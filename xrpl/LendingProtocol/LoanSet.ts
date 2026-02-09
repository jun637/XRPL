import { Client, Wallet } from "xrpl"
import { encodeForSigning, encode, decode } from "ripple-binary-codec"
import { sign as kpSign, deriveKeypair } from "ripple-keypairs"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

// Loan 생성: Borrower(Account) 서명 + CounterpartySignature(Broker 서명) 포함 후 제출
const LOAN_BROKER_ID = "84975F80CA210572755095AB72E181F278A518D3FFBF945A5E1610A033D0AAAF"
const PRINCIPAL_AMOUNT = "1000000"
const INTEREST_RATE = 0
const PAYMENT_INTERVAL = 31536000  // 1년 (초 단위)
const GRACE_PERIOD = 31536000      // 1년 (초 단위)

export async function loanSet() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const BROKER_SEED = process.env.ADMIN_SEED
  const BORROWER_SEED = process.env.USER_SEED
  if (!BROKER_SEED || !BORROWER_SEED) throw new Error("Missing env: ADMIN_SEED or USER_SEED")
  if (!/^[A-F0-9]{64}$/i.test(LOAN_BROKER_ID)) throw new Error("LOAN_BROKER_ID를 64 hex로 입력")

  const broker = Wallet.fromSeed(BROKER_SEED.trim())
  const borrower = Wallet.fromSeed(BORROWER_SEED.trim())

  const baseTx: any = {
    TransactionType: "LoanSet",
    Account: borrower.address,
    LoanBrokerID: LOAN_BROKER_ID,
    Counterparty: broker.address,
    PrincipalRequested: PRINCIPAL_AMOUNT,
    ...(INTEREST_RATE ? { InterestRate: INTEREST_RATE } : {}),
    ...(PAYMENT_INTERVAL ? { PaymentInterval: PAYMENT_INTERVAL } : {}),
    ...(GRACE_PERIOD ? { GracePeriod: GRACE_PERIOD } : {}),
    Flags: 0,
  }

  try {
    // 1) autofill (Fee는 counterparty signer 수까지 고려해 자동 계산)
    const prepared = await client.autofill(baseTx)
    console.log("prepared:", JSON.stringify(prepared, null, 2))

    // 2) Borrower(Account) 서명
    const { tx_blob: borrowerSigned } = borrower.sign(prepared as any)

    // 3) 서명된 tx 디코딩 → Counterparty 서명 추가
    const txObj = decode(borrowerSigned) as any

    // 4) Counterparty(Broker) 서명 생성
    //    CounterpartySignature는 isSigningField: false이므로 encodeForSigning에서 자동 제외
    const signingData = encodeForSigning(txObj)
    const { privateKey: brokerPriv } = deriveKeypair(BROKER_SEED.trim())
    const brokerSig = kpSign(signingData, brokerPriv)

    // 5) CounterpartySignature 추가
    txObj.CounterpartySignature = {
      SigningPubKey: broker.publicKey,
      TxnSignature: brokerSig,
    }
    console.log("finalTx:", JSON.stringify(txObj, null, 2))

    // 6) 최종 직렬화 & 제출
    const finalBlob = encode(txObj)
    const result = await client.submitAndWait(finalBlob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  loanSet().catch(e => { console.error(e); process.exit(1) })
}
