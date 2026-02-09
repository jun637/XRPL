import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

export async function vaultClawback() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ISSUER_SEED = process.env.ADMIN_SEED
  const VAULT_ID = "" // VaultCreate 결과(64 hex)를 직접 입력
  const AMOUNT = "1000000" // 1 XRP in drops; IOU = {currency, issuer, value}

  if (!ISSUER_SEED) throw new Error("Missing env: ADMIN_SEED")
  if (!/^[A-F0-9]{64}$/i.test(VAULT_ID)) throw new Error("VAULT_ID를 코드 상단에 64 hex로 입력하세요")

  const issuer = Wallet.fromSeed(ISSUER_SEED.trim())

  const tx: any = {
    TransactionType: "VaultClawback",
    Account: issuer.address,
    VaultID: VAULT_ID,
    Amount: AMOUNT // XRP drops; for IOU use { currency: "USD", issuer: "r...", value: "10" }
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = issuer.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  vaultClawback().catch(e => { console.error(e); process.exit(1) })
}


