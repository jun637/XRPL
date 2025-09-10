import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function cancelOffer() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED = process.env.USER_SEED
  if (!USER_SEED) throw new Error("Missing env: USER_SEED")
  const user = Wallet.fromSeed(USER_SEED)

  // ⚠️ 취소할 오퍼의 시퀀스 번호(OfferSequence)를 넣어주세요
  //  - 보통 오퍼를 만든 트랜잭션의 Sequence
  const OFFER_SEQUENCE = 4836789

  try {
    const tx: Transaction = {
      TransactionType: "OfferCancel",
      Account: user.address,
      OfferSequence: OFFER_SEQUENCE
    }

    const prepared = await client.autofill(tx)
    const signed   = user.sign(prepared)
    const result   = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  cancelOffer().catch(e => { console.error(e); process.exit(1) })
}
