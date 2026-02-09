import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

// createIssuance 실행 로그에서 복사한 IssuanceID
const ISSUANCE_ID = ""

export async function destroyIssuance() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")
  const admin = Wallet.fromSeed(ADMIN_SEED)

  const tx: Transaction = {
    TransactionType: "MPTokenIssuanceDestroy",
    Account: admin.address,
    MPTokenIssuanceID: ISSUANCE_ID
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = admin.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  destroyIssuance().catch(e => { console.error(e); process.exit(1) })
}
