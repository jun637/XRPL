import dotenv from "dotenv"
import path from "path"
import { Client } from "xrpl"

dotenv.config({ path: path.join(process.cwd(), ".env") })

async function inspectDomain() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()
  const DOMAIN_ID = "53FD5B556275B5A2ECB0B78678EE308813B0C6F33F39B8ED4BDE7284A12EC7CD"// Domain ID 넣기
  const r = await client.request({ command: "ledger_entry", index: DOMAIN_ID })
  console.log(JSON.stringify(r, null, 2))
  await client.disconnect()
}
inspectDomain().catch(console.error)