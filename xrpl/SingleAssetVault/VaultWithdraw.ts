import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const WITHDRAW_AMOUNT = "10000000" // 10 XRP (전액 출금)
const DESTINATION = "" // 필요 시 특정 계정으로 출금할 때 입력

export async function vaultWithdraw() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const VAULT_ID = "869B1291C541569E3CC830D0EF8FACC0477140F4E59368721EC09CB08ABC5D82"
  const HOLDER_SEED = process.env.USER_SEED || process.env.ADMIN_SEED

  if (!HOLDER_SEED) throw new Error("Missing env: USER_SEED or ADMIN_SEED")
  if (!/^[A-F0-9]{64}$/i.test(VAULT_ID)) throw new Error("VAULT_ID를 코드 상단에 64 hex로 입력하세요")

  const holder = Wallet.fromSeed(HOLDER_SEED.trim())

  const tx: any = {
    TransactionType: "VaultWithdraw",
    Account: holder.address,
    VaultID: VAULT_ID,
    Amount: WITHDRAW_AMOUNT,
    ...(DESTINATION ? { Destination: DESTINATION } : {})
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = holder.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  vaultWithdraw().catch(e => { console.error(e); process.exit(1) })
}


