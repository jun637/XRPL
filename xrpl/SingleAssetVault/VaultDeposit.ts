import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

export async function vaultDeposit() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const VAULT_ID = "869B1291C541569E3CC830D0EF8FACC0477140F4E59368721EC09CB08ABC5D82" // VaultCreate 결과(64 hex)를 직접 입력
  const DEPOSITOR_SEED = process.env.USER_SEED

  if (!DEPOSITOR_SEED) throw new Error("Missing env: USER_SEED or ADMIN_SEED")
  if (!/^[A-F0-9]{64}$/i.test(VAULT_ID)) throw new Error("VAULT_ID를 코드 상단에 64 hex로 입력하세요")

  const depositor = Wallet.fromSeed(DEPOSITOR_SEED.trim())

  const tx: any = {
    TransactionType: "VaultDeposit",
    Account: depositor.address,
    VaultID: VAULT_ID,
    Amount: "10000000" // 10 XRP in drops
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = depositor.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  vaultDeposit().catch(e => { console.error(e); process.exit(1) })
}


