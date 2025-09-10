import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function bookOffers() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())
  const ADMIN_ADDRESS = admin.address

  // ⚠️ 도메인 오더북만 보고 싶으면 DomainID 넣기, 오픈 오더북만 보고 싶으면 ""로 두기
  const DOMAIN_ID = "" // 또는 ""

  try {
    const req: any = {
      command: "book_offers",
      taker_pays: { currency: "XRP" },
      taker_gets: { currency: "ABC", issuer: ADMIN_ADDRESS },
      limit: 50
    }
    if (DOMAIN_ID) req.domain = DOMAIN_ID

    const result: any = await client.request(req)
    console.log(JSON.stringify(result.result || result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  bookOffers().catch(e => { console.error(e); process.exit(1) })
}
