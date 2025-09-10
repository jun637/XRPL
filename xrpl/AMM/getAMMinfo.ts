import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(process.cwd(), ".env") })

/**
 * 특정 AMM 풀의 정보 조회
 * - 풀 상태(잔액, TradingFee, LP Token 등) 확인 가능
 * - LP Token currency/issuer 확인 후 Withdraw 등에 활용
 */
export async function getAMMInfo() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  // ⚠️ 조회할 풀 자산쌍 (예: XRP + USD)
  const req: any = {
    command: "amm_info",
    asset: { currency: "XRP" },
    asset2: { currency: "ABC", issuer: admin.address }
  }

  try {
    const result: any = await client.request(req as any)
    console.log("✅ AMM Info Result:")
    console.log(JSON.stringify(result.result, null, 2))

    if (result.result?.amm?.lp_token) {
      console.log("📌 LPToken Info:")
      console.log(result.result.amm.lp_token)
    }

    return result.result
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

// 직접 실행
if (require.main === module) {
  getAMMInfo().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
