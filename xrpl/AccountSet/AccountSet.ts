import dotenv from "dotenv"
import path from "path"
import { Client, Wallet, Transaction} from "xrpl"

dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function AccountSet() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED!
  const admin = Wallet.fromSeed(ADMIN_SEED)

  try {
    const tx = {
      TransactionType: "AccountSet",
      Account: admin.address, //설정할 지갑 주소 입력
      SetFlag : 2 // 설정할 플래그 입력
    //ClearFlag : 2  
    // RequireAuth, NoFreeze, AllowTrustLineClawback 3가지는 되돌릴 수 없음.
    }

    const prepared = await client.autofill(tx as any)
    const signed = admin.sign(prepared as any)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  AccountSet().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
