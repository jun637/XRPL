import dotenv from 'dotenv'
import path from 'path'
import { Wallet } from 'xrpl'

dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function createNewWallet() {
  try {
    // 1. 새 지갑 생성
    const newWallet = Wallet.generate()
    console.log('새 지갑 생성 완료')
    console.log(`주소: ${newWallet.address}`)
    console.log(`시드: ${newWallet.seed}`)
    console.log(`공개키: ${newWallet.publicKey}`)
    return {
      wallet: newWallet,
      address: newWallet.address,
      seed: newWallet.seed!
    }
  } catch (error) {
    console.error('❌ 새 지갑 생성 실패:', error)
    throw new Error(`새 지갑 생성 실패: ${error}`)
  }
}

if (require.main === module) {
  createNewWallet()
} 