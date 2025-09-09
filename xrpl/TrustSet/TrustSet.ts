import dotenv from "dotenv"
import path from "path"
import { Client, Wallet, TrustSet as TrustSetTx } from "xrpl"

dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function TrustSet() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())
  const user = Wallet.fromSeed(USER_SEED.trim())

  // TrustSet 트랜잭션
  const tx: TrustSetTx = {
    TransactionType: "TrustSet",
    Account: user.address,
    LimitAmount: {
      currency: "ABC",
      issuer: admin.address,
      value: "100", //개
    },
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = user.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  TrustSet().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
