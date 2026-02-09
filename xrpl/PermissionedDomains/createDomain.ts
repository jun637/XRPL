import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

const toHex = (s: string) => Buffer.from(s, "utf8").toString("hex")

export async function createDomain() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")
  const admin = Wallet.fromSeed(ADMIN_SEED)

  try {
    const tx: Transaction = { 
      TransactionType: "PermissionedDomainSet",
      Account: admin.address,
      // 새로운 Domain 생성 시에는 DomainID 생략
      AcceptedCredentials: [ 
        {
          Credential: {
            Issuer: admin.address,
            CredentialType: toHex("AML"),
          }
        }
      ]
    }

    const prepared = await client.autofill(tx)
    const signed = admin.sign(prepared)
    const result: any = await client.submitAndWait(signed.tx_blob)

    // 전체 응답 로그
    console.log(JSON.stringify(result, null, 2))

    // 생성된 도메인의 ID 추출 (CreatedNode 중 PermissionedDomain)
    const out = result.result ?? result
    const created = (out.meta?.AffectedNodes || []).find(
      (n: any) => n.CreatedNode?.LedgerEntryType === "PermissionedDomain"
    )
    const domainId =
      created?.CreatedNode?.LedgerIndex ||
      created?.CreatedNode?.NewFields?.DomainID || null

    if (domainId) {
      console.log("DomainID(created):", domainId)
    } else {
      console.log("⚠️ Could not locate DomainID in meta. Check node support/fields.")
    }

    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  createDomain().catch((e) => { console.error(e); process.exit(1) })
}
