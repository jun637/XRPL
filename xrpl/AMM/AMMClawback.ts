import { Client, Transaction, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function AMMClawback() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  const tx: Transaction = {
    TransactionType: "AMMClawback",
    Account: admin.address,
    Asset: { currency: "XRP", issuer: admin.address}, // XRP는 issuer 필요 없음 (any로 우회)
    Asset2: { currency: "ABC", issuer: admin.address },
    Amount: {
      currency: "ABC",
      issuer: admin.address,
      value: "10"
    },
    Holder: "rSomeLiquidityProvider..." // ✅ clawback 대상 계정
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = admin.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log("✅ AMMClawback Result:")
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

if (require.main === module) {
  AMMClawback().catch(e => { console.error(e); process.exit(1) })
}
