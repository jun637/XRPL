import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "..", ".env") })

/**
 * AMMVote 트랜잭션
 * - LPToken 보유자가 AMM 인스턴스의 TradingFee에 투표
 * - TradingFee 범위: 0 ~ 1000 (0.001% ~ 1%)
 */
export async function AMMVote() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED = process.env.USER_SEED
  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!USER_SEED || !ADMIN_SEED) throw new Error("Missing env: USER_SEED, ADMIN_SEED")

  const user = Wallet.fromSeed(USER_SEED.trim())
  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  /**
   * ⚠️ 예시: USER가 XRP/USD AMM 풀에 대해 0.25% (TradingFee = 25) 로 투표
   */
  const tx: Transaction = {
    TransactionType: "AMMVote",
    Account: user.address,
    Asset: { currency: "XRP" }, // 풀의 첫 번째 자산
    Asset2: { currency: "USD", issuer: admin.address }, // 풀의 두 번째 자산
    TradingFee: 25 // 0.25%
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = user.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log("✅ AMMVote Result:")
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

// 직접 실행
if (require.main === module) {
  AMMVote().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
