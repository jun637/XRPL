import { Client, Wallet, Transaction} from "xrpl"
import { encodeForSigning, encode } from "ripple-binary-codec"
import { sign as kpSign, deriveKeypair } from "ripple-keypairs"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

function Now() {
  return Math.floor(Date.now() / 1000) - 946_684_800
}

export async function escrowCreateIOU() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  // 연결 후 지갑 로드
  const ADMIN_SEED = process.env.ADMIN_SEED!
  const USER_SEED  = process.env.USER_SEED!
  const USER2_SEED = process.env.USER2_SEED!
  const admin  = Wallet.fromSeed(ADMIN_SEED)  // IOU 발행자
  const user   = Wallet.fromSeed(USER_SEED)   // 에스크로 소스
  const user2  = Wallet.fromSeed(USER2_SEED)  // 에스크로 목적지

  try {
    // IOU EscrowCreate: Amount는 CurrencyAmount 객체
    const tx: Transaction = {
      TransactionType: "EscrowCreate",
      Account: user.address,              // 소스 = User
      Destination: user2.address,         // 목적지 = User2 (Merchant)
      Amount: {
        currency: "ABC",                  // 통화 코드
        issuer: admin.address,            // IOU 발행자 (Admin)
        value: "10"                       // 문자열 수치
      } as any,
      FinishAfter: Now() + 10,
      CancelAfter: Now() + 150        // 150초 후 취소 가능
      // Condition: "<hex>"               // 조건부 escrow 시
    }

const prepared = await client.autofill(tx)

// 1) 서명 대상 객체에 SigningPubKey를 "미리" 넣는다
const toSign = {
  ...prepared,
  SigningPubKey: user.publicKey,   // 보통 'ED...' 33바이트(hex)
}

// 2) seed로 keypair 파생 (★ Wallet.privateKey 대신, seed→derive 사용)
const { privateKey, publicKey } = deriveKeypair(USER_SEED)

// 3) 서명 (프리픽스 자르지 말고 그대로 전달)
const signingData = encodeForSigning(toSign as any)
const signature   = kpSign(signingData, privateKey)

// 4) 최종 인코딩 & 제출
const signedTx = { ...toSign, TxnSignature: signature }
const tx_blob  = encode(signedTx)

const result = await client.submitAndWait(tx_blob)
    console.log(JSON.stringify(result, null, 2))
    console.log(`EscrowCreate(IOU User→User2) -> Owner=${user.address}, OfferSequence=${prepared.Sequence}`)
    console.log({
        acc: user.address,
        pub_user: user.publicKey,
        pub_derived: publicKey,
        samePub: user.publicKey === publicKey,
        privLen: privateKey.length,            // 보통 66(hex) = 33바이트 (ED prefix 포함)
        signingDataLen: (signingData.length/2) // 바이트 길이 확인
      })
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  escrowCreateIOU().catch(e => { console.error(e); process.exit(1) })
}
