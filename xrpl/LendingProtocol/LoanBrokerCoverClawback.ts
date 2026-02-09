import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const LOAN_BROKER_ID = "84975F80CA210572755095AB72E181F278A518D3FFBF945A5E1610A033D0AAAF"
// IOU/MPT일 때만 Amount 사용 (XRP 대출은 Amount 생략 → 자동 계산)
// const COVER_CLAWBACK_AMOUNT = { currency: "USD", issuer: "rIssuer...", value: "100" }

export async function loanBrokerCoverClawback() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const BROKER_SEED = process.env.ADMIN_SEED
  if (!BROKER_SEED) throw new Error("Missing env: ADMIN_SEED")

  const broker = Wallet.fromSeed(BROKER_SEED.trim())

  const tx: any = {
    TransactionType: "LoanBrokerCoverClawback",
    Account: broker.address,
    LoanBrokerID: LOAN_BROKER_ID,
    // IOU/MPT일 때: Amount: COVER_CLAWBACK_AMOUNT
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
  loanBrokerCoverClawback().catch(e => { console.error(e); process.exit(1) })
}
