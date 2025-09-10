import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

// createIssuance 실행 로그에서 복사한 IssuanceID
const ISSUANCE_ID = "0049CE469E4215DD8AC6196A0A5027DF489AEC3B17BD6211"

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

  try {
    const prepared = await client.autofill(tx)
    const signed = admin.sign(prepared) // 변경해서 사용!
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
