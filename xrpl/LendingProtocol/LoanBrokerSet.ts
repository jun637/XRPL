import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

// Loan broker 생성 및 설정
// 필요한 값들은 코드 상단 상수로 직접 입력
const VAULT_ID = "869B1291C541569E3CC830D0EF8FACC0477140F4E59368721EC09CB08ABC5D82" // SAV VaultID (64 hex)
const MANAGEMENT_FEE_RATE = 0 // optional: millionths; 0이면 미설정
const DEBT_MAXIMUM = "0" // optional: XRPLNumber string; "0" = 무제한

export async function loanBrokerSet() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const BROKER_SEED = process.env.ADMIN_SEED
  if (!BROKER_SEED) throw new Error("Missing env: ADMIN_SEED")

  const broker = Wallet.fromSeed(BROKER_SEED.trim())

  const tx: any = {
    TransactionType: "LoanBrokerSet",
    Account: broker.address,
    VaultID: VAULT_ID,
    ...(MANAGEMENT_FEE_RATE ? { ManagementFeeRate: MANAGEMENT_FEE_RATE } : {}),
    ...(DEBT_MAXIMUM ? { DebtMaximum: DEBT_MAXIMUM } : {}),
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = broker.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  loanBrokerSet().catch(e => { console.error(e); process.exit(1) })
}
