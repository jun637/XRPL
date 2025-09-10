import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

// 하이브리드로 올리고 싶으면 true로 변경 (tfHybrid 플래그 추가)
const HYBRID = false
const TF_HYBRID = 0x00100000 // tfHybrid

export async function createPermissionedOffer() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED   // 예: USD 발행자(issuer)
  const USER_SEED  = process.env.USER_SEED    // 오퍼 생성자
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED)
  const user  = Wallet.fromSeed(USER_SEED)

  // PermissionedDomains/createDomain 스크립트에서 생성된 DomainID(64 hex)
  const DOMAIN_ID = ""

  // 예시) USD(ADMIN 발행)를 팔고, XRP를 받는 오퍼
  // XRPL 의미상: TakerGets = 시장이 '받는 것'(= 내가 파는 것), TakerPays = 시장이 '지불하는 것'(= 내가 받는 것)
  const tx: Transaction = {
    TransactionType: "OfferCreate",
    Account: user.address,
    TakerGets: { currency: "ABC", issuer: admin.address, value: "10" }, // 내가 파는 IOU
    TakerPays: "10000000", // drops (10 XRP) - 내가 받는 것
    DomainID: DOMAIN_ID,
    ...(HYBRID ? { Flags: TF_HYBRID } : {})
  }

  try {
    const prepared = await client.autofill(tx)
    const signed   = user.sign(prepared)
    const result   = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  createPermissionedOffer().catch(e => { console.error(e); process.exit(1) })
}
