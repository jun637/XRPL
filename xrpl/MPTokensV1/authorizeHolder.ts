import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

// createIssuance 실행 로그에서 복사한 IssuanceID
const ISSUANCE_ID = "005F7182F83DBD3A2D4DA72C6C10B2B4265471A682741D4D"

export async function authorizeHolder() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED  = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED)
  const user  = Wallet.fromSeed(USER_SEED)

  const tx: Transaction = {
    TransactionType: "MPTokenAuthorize",
    Account: admin.address,
    MPTokenIssuanceID: ISSUANCE_ID,
    Holder: user.address
    //Flags: { tfMPTUnauthorize: true } // 해제하고 싶을 때만 사용
  }
  
// Opt-in 할 때는 다음과 같이
// const tx: Transaction = {
//    TransactionType: "MPTokenAuthorize",
//    Account: user.address,
//    MPTokenIssuanceID: ISSUANCE_ID,
//  }

  try {
    const prepared = await client.autofill(tx)
    const signed = user.sign(prepared) // 변경해서 사용!
    const result = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  authorizeHolder().catch(e => { console.error(e); process.exit(1) })
}
