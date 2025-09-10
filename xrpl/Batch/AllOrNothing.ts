import dotenv from "dotenv"
import path from "path"
import { Client, Wallet } from "xrpl"
dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function AllOrNothing() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED  = process.env.USER_SEED!
  const USER2_SEED = process.env.USER2_SEED!
  const user  = Wallet.fromSeed(USER_SEED)
  const user2 = Wallet.fromSeed(USER2_SEED)

  try {
    // Outer/Inner에 쓸 시퀀스 확보
    const ai = await client.request({ command: "account_info", account: user.address })
    const seq = ai.result.account_data.Sequence

    const outer: any = {
      TransactionType: "Batch",
      Account: user.address,
      Flags: 0x00010000, // AllOrNothing
      RawTransactions: [
        {
          RawTransaction: {
            TransactionType: "Payment",
            Flags: 0x40000000,      // tfInnerBatchTxn (inner 필수)
            Account: user.address,
            Destination: user2.address,
            Amount: "5000000",         // 5 XRP
            Sequence: seq + 1,      // inner도 시퀀스 필수
            Fee: "0",
            SigningPubKey: ""
          }
        },
        {
          RawTransaction: {
            TransactionType: "Payment",
            Flags: 0x40000000,
            Account: user.address,
            Destination: user2.address,
            Amount: "10000000",         // 10 XRP
            Sequence: seq + 2,
            Fee: "0",
            SigningPubKey: ""
          }
        }
      ],
      Sequence: seq,
      // Fee/LastLedgerSequence는 autofill로 채움
    }

    const prepared = await client.autofill(outer)
    const signed = user.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  AllOrNothing().catch(e => { console.error(e); process.exit(1) })
}
