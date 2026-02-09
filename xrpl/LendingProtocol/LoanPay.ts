import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const LOAN_ID = "FA1B3C6570692E6667084C5FD94D8B244595A05ABA92E80A0363EABF975BB6D9" // LoanSet 결과 LedgerIndex (64 hex)
const PAY_AMOUNT = "1000000" // XRP drops; IOU는 {currency, issuer, value}

export async function loanPay() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const BORROWER_SEED = process.env.USER_SEED
  if (!BORROWER_SEED) throw new Error("Missing env: USER_SEED")

  const borrower = Wallet.fromSeed(BORROWER_SEED.trim())

  const tx: any = {
    TransactionType: "LoanPay",
    Account: borrower.address,
    LoanID: LOAN_ID,
    Amount: PAY_AMOUNT
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = borrower.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  loanPay().catch(e => { console.error(e); process.exit(1) })
}
