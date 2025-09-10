import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

// createIssuance 실행 로그에서 복사한 IssuanceID
const ISSUANCE_ID = "0049CE469E4215DD8AC6196A0A5027DF489AEC3B17BD6211"

export async function setIssuance() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")
  const admin = Wallet.fromSeed(ADMIN_SEED)

  // 사용법: lock|unlock [holderAddress]
  const mode = (process.argv[2] || "").toLowerCase()
  const holder = process.argv[3]

  if (mode !== "lock" && mode !== "unlock") {
    console.error('Usage: ts-node setIssuance.ts <lock|unlock> [holderAddress]')
    process.exit(1)
  }

  const flags = mode === "lock" ? { tfMPTLock: true } : { tfMPTUnlock: true }

  const tx: Transaction = {
    TransactionType: "MPTokenIssuanceSet",
    Account: admin.address,
    MPTokenIssuanceID: ISSUANCE_ID,
    ...(holder ? { Holder: holder } : {}),
    Flags: flags
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = admin.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  setIssuance().catch(e => { console.error(e); process.exit(1) })
}
