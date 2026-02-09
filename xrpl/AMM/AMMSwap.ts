import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(process.cwd(), ".env") })

/**
 * AMMSwap (실제로는 Payment 트랜잭션 활용)
 * - AssetA → AssetB 교환
 * - AMM 풀과 오더북을 자동으로 경유하여 최적 가격 경로를 선택
 */
export async function AMMSwap() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED = process.env.USER_SEED
  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!USER_SEED || !ADMIN_SEED) throw new Error("Missing env: USER_SEED, ADMIN_SEED")

  const user = Wallet.fromSeed(USER_SEED.trim())
  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  /**
   * ⚠️ 예시: USER가 5 XRP를 내고, 최소 40 USD(IOU)를 받고 싶을 때
   * - Amount: 내가 받고 싶은 자산
   * - SendMax: 내가 최대 투입할 자산
   */
  const tx: Transaction = {
    TransactionType: "Payment",
    Account: user.address,
    Destination: user.address, // 자기 자신을 대상으로 설정 (스왑 결과를 본인 지갑에 받음)
    Amount: {
      currency: "ABC",
      issuer: admin.address,
      value: "0.00001" // 받고 싶은 IOU 최소 수량
    },
    SendMax: "1000000", // 최대 5 XRP 지불 (drops 단위)
    Flags: 0x00020000 // tfPartialPayment (일부만 충족해도 실행 가능)
  }as any

  try {
    const prepared = await client.autofill(tx as any)
    const signed = user.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log("✅ AMMSwap (Payment) Result:")
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

// 직접 실행
if (require.main === module) {
  AMMSwap().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
