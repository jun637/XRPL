import 'dotenv/config'
import { Client, Transaction, Wallet } from 'xrpl'

async function allowTrust() {
  const client = new Client('wss://s.devnet.rippletest.net:51233')
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED  = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error('Missing env: ADMIN_SEED, USER_SEED')

  const adminWallet = Wallet.fromSeed(ADMIN_SEED.trim())
  const userWallet  = Wallet.fromSeed(USER_SEED.trim())

  const tx : Transaction = {
    TransactionType: 'TrustSet',
    Account: adminWallet.address,    // 발행자(RequireAuth 설정된 계정)
    LimitAmount: {
      currency: 'ABC',
      issuer: userWallet.address,   // 
      value: '0'
    },
    Flags: 0x00010000               // tfSetAuth = 승인
  }

  const prepared = await client.autofill(tx)
  const signed = adminWallet.sign(prepared)
  const result = await client.submitAndWait(signed.tx_blob)

  console.log(JSON.stringify(result, null, 2))

  await client.disconnect()
}

allowTrust()
