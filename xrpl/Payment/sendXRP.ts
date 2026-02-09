import { Client, Wallet, Payment } from "xrpl"
import path from "path"
import dotenv from "dotenv"                  // 필요 모듈 Import
dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function sendXRP() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")// Devnet에 Websocket 연결
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED // 환경변수에서 시드 로드
  const USER_SEED = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  try {
    const admin = Wallet.fromSeed(ADMIN_SEED.trim())
    const user = Wallet.fromSeed(USER_SEED.trim())  // 불러온 시드로 지갑 불러오기

    const tx: Payment = {
      TransactionType: "Payment",
      Account: admin.address,                 //핵심부(트랜잭션)
      Destination: "r3mYPWJqwbjv5EqEakhwqu7fwGpKb2bDzA",
      Amount: "5000000" // 1 XRP = 1,000,000 drops
    }

    const prepared = await client.autofill(tx)       
    const signed = admin.sign(prepared)          //트랜잭션 필드 자동 채우기 + 서명
    const result = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2)) // 트랜잭션 결과 로그 출력
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  sendXRP().catch(e => { console.error(e); process.exit(1) })
}


