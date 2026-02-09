import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(process.cwd(), ".env") })

/**
 * AMMCreate 트랜잭션: 새로운 AMM 풀을 생성
 * - 두 자산을 예치해 풀을 만들고 초기 TradingFee 설정
 * - TradingFee 범위: 0 ~ 1000 (0.001% ~ 1%)
 */
export async function AMMCreate() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  /**
   * ⚠️ 예시 자산 설정
   * - Asset: XRP
   * - Asset2: USD (ADMIN 발행 IOU)
   * - TradingFee: 30 (0.3%)
   */
  const tx: Transaction = {
    TransactionType: "AMMCreate",
    Account: admin.address, // 풀 생성자
    Amount: "10000000",     // 10 XRP (drops 단위)
    Amount2: {
      currency: "ABC",
      issuer: admin.address,
      value: "10"
    },
    TradingFee: 30 // 0.3%
  }

  try {
    const prepared = await client.autofill(tx)


const currentLedger = await client.getLedgerIndex()
prepared.LastLedgerSequence = currentLedger + 50

const signed = admin.sign(prepared)
console.log("TX Hash:", signed.hash)

// ✅ submit만
const result = await client.submit(signed.tx_blob)

// ✅ 수동 폴링


console.log("Result:")
console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

// 직접 실행
if (require.main === module) {
  AMMCreate().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
