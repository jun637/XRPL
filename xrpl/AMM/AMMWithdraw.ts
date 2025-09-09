import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "..", ".env") })

/**
 * AMMWithdraw 트랜잭션: 기존 AMM 풀에서 유동성 제거
 * - LPToken을 제출하면, 그 비율만큼 자산(A/B)을 반환받음
 * - 전체 인출(tfWithdrawAll) 또는 부분 인출 가능
 */
export async function AMMWithdraw() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED = process.env.USER_SEED
  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!USER_SEED || !ADMIN_SEED) throw new Error("Missing env: USER_SEED, ADMIN_SEED")

  const user = Wallet.fromSeed(USER_SEED.trim())
  const admin = Wallet.fromSeed(ADMIN_SEED.trim())
  

  const tx: Transaction = {
    TransactionType: "AMMWithdraw",
    Account: user.address,   // 유동성 제거 주체
    Asset: { currency: "XRP" },
    Asset2: { currency: "USD", issuer: admin.address },
    LPTokenIn: {
      currency: "03930D02208264E2E40EC1B0C09E4DB96EE197B1", // getAMMInfo에서 확인한 unique LP 토큰 코드
      issuer: "rUd5wEYNLtC4NRoMEXDAmd8L9ASof8Hn18",         // AMM 계정 주소 (풀 생성 시 자동 생성됨)
      value: "10000"                                          // 제거할 LPToken 수량
    }
    , Flags: 0x00080000
  } 

  try {
    // 트랜잭션 준비
    const prepared = await client.autofill(tx)
    const currentLedger = await client.getLedgerIndex()
    prepared.LastLedgerSequence = currentLedger + 50

    // 서명
    const signed = user.sign(prepared)

    // 제출 (Wait 대신 직접 폴링)
    const submitResult = await client.submit(signed.tx_blob)
    console.log("📤 Submit Result:", submitResult)

    const txHash = signed.hash
    console.log("⏳ TX Hash:", txHash)

    // 폴링
    let attempts = 0
    while (attempts < 20) { // 약 20번 = 40초 정도 대기
      const txResult = await client.request({
        command: "tx",
        transaction: txHash
      })

      if (txResult.result.validated) {
        console.log("✅ AMMWithdraw Final Result:")
        console.log(JSON.stringify(txResult.result, null, 2))
        return txResult.result
      }

      attempts++
      await new Promise(r => setTimeout(r, 2000)) // 2초 간격
    }

    throw new Error("트랜잭션이 유효화되지 않았습니다 (timeout).")
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

// 직접 실행
if (require.main === module) {
  AMMWithdraw().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
