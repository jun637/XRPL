import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const TF_VAULT_PRIVATE = 0x00010000
const TF_VAULT_SHARE_NON_TRANSFERABLE = 0x00020000

export async function vaultCreate() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const OWNER_SEED = process.env.ADMIN_SEED
  if (!OWNER_SEED) throw new Error("Missing env: ADMIN_SEED")

  const owner = Wallet.fromSeed(OWNER_SEED.trim())

  const tx: any = {
    TransactionType: "VaultCreate",
    Account: owner.address,
    Asset: { currency: "XRP" }, // XRP vault. IOU/MPT일 경우 { currency, issuer } 또는 { mpt_issuance_id }
    WithdrawalPolicy: 1, // 1 = first-come-first-serve
    //Flags: TF_VAULT_PRIVATE | TF_VAULT_SHARE_NON_TRANSFERABLE,
    //DomainID: "", // required when private vault
    //Data: "5661756c742054657374" // optional hex metadata
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
  vaultCreate().catch(e => { console.error(e); process.exit(1) })
}




