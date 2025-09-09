import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(__dirname, "..", ".env") })

const toHex = (s: string) => Buffer.from(s, "utf8").toString("hex")

export async function deleteCredential() {

  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()
  
  const ADMIN_SEED = process.env.ADMIN_SEED   // 발급자 (대상 지정용)
  const USER_SEED  = process.env.USER_SEED    // ✅ 삭제 주체(본인)
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")
  try {
    const issuer  = Wallet.fromSeed(ADMIN_SEED)
    const subject = Wallet.fromSeed(USER_SEED) // ✅ 서명자 = 본인(Subject)

    const tx: Transaction = {
      TransactionType: "CredentialDelete",
      Account: subject.address,        // ✅ 본인이 서명/전송
      Issuer: issuer.address,          // 명시 권장
      Subject: subject.address,        // 명시 권장
      CredentialType: toHex("KYC")     // create/accept과 동일하게
    }

    const prepared = await client.autofill(tx)
    const signed   = subject.sign(prepared)    // ✅ 본인 서명
    const result   = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

// 직접 실행
if (require.main === module) {
  deleteCredential().catch(e => { console.error(e); process.exit(1) })
}
