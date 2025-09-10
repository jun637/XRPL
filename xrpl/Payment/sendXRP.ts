import { Client, Wallet, Payment } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function sendXRP() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  try {
    const admin = Wallet.fromSeed(ADMIN_SEED.trim())
    const user = Wallet.fromSeed(USER_SEED.trim())

    const tx: Payment = {
      TransactionType: "Payment",
      Account: admin.address,
      Destination: user.address,
      Amount: "1000000" // 1 XRP = 1,000,000 drops
    }

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
  sendXRP().catch(e => { console.error(e); process.exit(1) })
}


