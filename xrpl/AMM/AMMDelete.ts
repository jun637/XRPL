import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(process.cwd(), ".env") })

/**
 * AMMDelete 트랜잭션
 * - 풀에 남은 유동성이 전혀 없을 때만 실행 가능
 * - AMM 인스턴스를 원장에서 제거
 */
export async function AMMDelete() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  /**
   * ⚠️ 예시: XRP / USD(IOU) 풀 삭제
   * - Asset, Asset2: 풀 생성 시 정의했던 동일 자산쌍
   */
  const tx: Transaction = {
    TransactionType: "AMMDelete",
    Account: admin.address, // 풀 생성자(혹은 관리 계정)
    Asset: { currency: "XRP" },
    Asset2: {
      currency: "ABC",
      issuer: admin.address
    }
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = admin.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log("✅ AMMDelete Result:")
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

// 직접 실행
if (require.main === module) {
  AMMDelete().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
