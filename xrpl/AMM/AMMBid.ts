import { Client, Transaction, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(process.cwd(), ".env") })

/**
 * AMMBid: AMM 풀의 경매 슬롯 입찰
 * - 입찰자는 LPToken 단위로 BidMax/BidMin 지정 가능
 * - 승리 시 24시간 동안 수수료 할인 (TradingFee/10)
 */
export async function AMMBid() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED = process.env.USER_SEED
  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!USER_SEED || !ADMIN_SEED) throw new Error("Missing env: USER_SEED, ADMIN_SEED")

  const user = Wallet.fromSeed(USER_SEED.trim())
  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  // ⚠️ 예시: BidMax에 넣을 LPToken 통화코드와 issuer는 실제 amm_info RPC로 확인 필요
  const tx: Transaction = {
    TransactionType: "AMMBid",
    Account: user.address,
    Asset: { currency: "XRP" },
    Asset2: { currency: "ABC", issuer: admin.address },
    BidMax: {
      currency: "LP",              // 풀 생성 시 발급된 LP 토큰 코드 (16진 문자열)
      issuer: "rAMMInstance...",   // AMM 계정 주소
      value: "100"                 // 입찰할 LPToken 수량
    },
    AuthAccounts: [
      { AuthAccount: { Account: "rOtherAccount..." } }
    ]
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = user.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log("✅ AMMBid Result:")
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

if (require.main === module) {
  AMMBid().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
