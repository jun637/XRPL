import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

const toHex = (s: string) => Buffer.from(s, "utf8").toString("hex")

export async function acceptCredential() {
    
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED  = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const issuer  = Wallet.fromSeed(ADMIN_SEED)
  const subject = Wallet.fromSeed(USER_SEED) // ✅ 서명자 = 피발급자

  try {
    const tx: Transaction = {
      TransactionType: "CredentialAccept",
      Account: subject.address,                 // ✅ 피발급자 서명/전송
      Issuer: issuer.address,
      CredentialType: toHex("KYC")             // createCredential.ts와 동일
    }

    const prepared = await client.autofill(tx)
    const signed   = subject.sign(prepared)
    const result   = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  acceptCredential().catch(e => { console.error(e); process.exit(1) })
}
