import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function checkCredential() {

  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()
  
  const USER_SEED = process.env.USER_SEED
  if (!USER_SEED) throw new Error("Missing env: USER_SEED")
  try {
    const subject = Wallet.fromSeed(USER_SEED)

    const all: any[] = []
    let marker: any = undefined

    do {
      const r: any = await client.request({
        command: "account_objects",
        account: subject.address,
        limit: 400,
        ...(marker ? { marker } : {})
      })
      const creds = (r.result.account_objects || []).filter(
        (o: any) => o.LedgerEntryType === "Credential"
      )
      all.push(...creds)
      marker = r.result.marker
    } while (marker)

    console.log(JSON.stringify(all, null, 2))
    return all
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  checkCredential().catch(e => { console.error(e); process.exit(1) })
}
