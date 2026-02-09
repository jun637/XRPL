import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

export async function vaultSet() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const OWNER_SEED = process.env.ADMIN_SEED
  const VAULT_ID = "" // VaultCreate 결과(64 hex)를 직접 입력
  if (!OWNER_SEED) throw new Error("Missing env: ADMIN_SEED")
  if (!/^[A-F0-9]{64}$/i.test(VAULT_ID)) throw new Error("VAULT_ID를 코드 상단에 64 hex로 입력하세요")

  const owner = Wallet.fromSeed(OWNER_SEED.trim())

  const tx: any = {
    TransactionType: "VaultSet",
    Account: owner.address,
    VaultID: VAULT_ID,
    AssetsMaximum: "0", // keep 0 for uncapped; set new limit in drops or IOU value
    //DomainID: "", // update domain if needed
    //Data: "" // optional metadata hex
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = owner.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  vaultSet().catch(e => { console.error(e); process.exit(1) })
}


