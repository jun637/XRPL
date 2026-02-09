import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const LOAN_ID = "EDAF3FC022764D63A1574C6EA44DED835E59C8398DF522B7FC1C80E333C66151" // 만료된 Loan
// LoanManageFlags: tfLoanDefault=0x00010000, tfLoanImpair=0x00020000, tfLoanUnimpair=0x00040000
const LOAN_DEFAULT_FLAG = 0x00010000

export async function loanManage() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const BROKER_SEED = process.env.ADMIN_SEED
  if (!BROKER_SEED) throw new Error("Missing env: ADMIN_SEED")

  const broker = Wallet.fromSeed(BROKER_SEED.trim())

  const tx: any = {
    TransactionType: "LoanManage",
    Account: broker.address,
    LoanID: LOAN_ID,
    Flags: LOAN_DEFAULT_FLAG,
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
  loanManage().catch(e => { console.error(e); process.exit(1) })
}
