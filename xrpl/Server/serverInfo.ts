import { Client } from "xrpl"

async function serverInfo() {
  const client = new Client("wss://s.devnet.rippletest.net:51233") // Devnet 노드 주소
  await client.connect()

  const res = await client.request({
    command: "server_info"
  })
  const res2 = await client.request({ command: "feature" })
  console.log(res2.result.features)
  console.log("rippled version:", res.result.info.build_version)

  await client.disconnect()
}

// 함수 실행
serverInfo().catch(console.error)