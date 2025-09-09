import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "..", ".env") })

/**
 * AMMDeposit 트랜잭션: 기존 AMM 풀에 유동성 추가
 * - 두 자산 비율에 맞춰 추가하거나, 단일 자산만 추가할 수도 있음
 * - 예시에서는 XRP + USD(IOU) 비율로 예치
 */
export async function AMMDeposit() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())
  const user = Wallet.fromSeed(USER_SEED.trim())

  /**
   * ⚠️ 예시 자산: 풀 생성 시 지정한 동일한 자산
   * - Asset: XRP
   * - Asset2: USD (ADMIN 발행 IOU)
   * - Amount/Amount2: 예치할 수량
   */
  const tx: Transaction = {
    TransactionType: "AMMDeposit",
    Account: user.address,   // 유동성 추가 주체 (트레이더)
    Asset: { currency: "XRP" }, // 첫 번째 풀 자산
    Asset2: {
      currency: "USD",
      issuer: admin.address
    },
    Amount: "5000000", // 5 XRP (drops 단위)
    Amount2: {
      currency: "USD",
      issuer: admin.address,
      value: "50"
    },
    Flags: 0x00100000 // tfTwoAsset: 두 자산 비율 맞춰 예치
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = user.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log("✅ AMMDeposit Result:")
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

// 직접 실행
if (require.main === module) {
  AMMDeposit().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
