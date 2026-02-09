import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

export async function vaultDelete() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const OWNER_SEED = process.env.ADMIN_SEED
  const VAULT_ID = "869B1291C541569E3CC830D0EF8FACC0477140F4E59368721EC09CB08ABC5D82" // VaultCreate 결과(64 hex)를 직접 입력
  if (!OWNER_SEED) throw new Error("Missing env: ADMIN_SEED")
    
  const owner = Wallet.fromSeed(OWNER_SEED.trim())

  const tx: any = {
    TransactionType: "VaultDelete",
    Account: owner.address,
    VaultID: VAULT_ID
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
  vaultDelete().catch(e => { console.error(e); process.exit(1) })
}


