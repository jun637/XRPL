# XRPL 핵심 기능별 샘플 코드

> XRPL에서 주요 기능(지갑 생성/관리, 송금, Trustset, Credential 등)을 테스트할 수 있는 시나리오 기반 예제 코드 모음입니다.

---

## 📑 목차

- [🚀 Quickstart](./README.md#-quickstart)
- [🗂️ 전체 디렉토리 구조](#-전체-디렉토리-구조)
- [📂 폴더별 README 바로가기](./README.md#-폴더별-readme-바로가기)
- [XRPL Devnet Explorer](./README.md#xrpl-devnet-explorer)
- [🌐 네트워크 / 버전](./README.md#-네트워크--버전)
---

## 🚀 Quickstart

```bash
# 0) 레포 클론
git clone https://github.com/jun637/XRPL.git
cd XRPL

# 1) 의존성 설치
npm install

# 2) Devnet 지갑 생성 (Admin, User, User2 총 3개)
npx ts-node xrpl/Wallet/createNewWallet.ts  -> 여기서 출력되는 시드 값을 .env에 저장

# 3) faucet으로 자산 활성화
npx ts-node xrpl/Wallet/faucet.ts

# 4) 지갑 정보 조회
npx ts-node xrpl/Wallet/WalletInfo.ts
```
* Quickstart 이후 기능별 실행 명령어 및 간단한 시나리오 이해는 [*GitHub 폴더별 README*](#-폴더별-readme-바로가기)에서,  
* 폴더별 전체 코드 및 상세 실행 로그를 포함한 스크립트 해석은 [*Notion 문서*](https://catalyze-research.notion.site/XRPL-23e898c680bf8023b1b5f94b0b544db3?source=copy_link)에서 확인하세요.


---

## 🗂️ 전체 디렉토리 구조

```bash
xrpl/
├── Wallet/ # 지갑 생성/관리
│ ├── createNewWallet.ts
│ ├── faucet.ts
│ ├── LoadWallet.ts
│ └── WalletInfo.ts
│
├── Payment/ # XRP/IOU 송금
│ ├── sendIOU.ts
│ └── sendXRP.ts
│
├── TrustSet/ # 신뢰선 설정
├ ├── requireAuth.ts
│ └── TrustSet.ts
│
├── AccountSet/ # 계정 옵션 설정
│ └── AccountSet.ts
│
├── Credential/ # Credential 발급/검증
│ ├── acceptCredential.ts
│ ├── checkCredential.ts
│ ├── createCredential.ts
│ └── deleteCredential.ts
│
├── PermissionedDEX/ # 권한 기반 DEX
│ ├── bookOffers.ts
│ ├── cancelOffer.ts
│ └── createPermissionedOffer.ts
│
├── PermissionedDomains/# Domain 기반 권한 관리
│ ├── AcceptedCredentials.ts
│ ├── createDomain.ts
│ └── deleteDomain.ts
│
├── TokenEscrow/ # 에스크로
│ ├── escrowCancel.ts
│ ~~├── escrowCreateIOU.ts~~
│ ├── escrowCreateMPT.ts
│ └── escrowFinish.ts
│
├── MPTokensV1/ # Multi-Party Tokens (v1)
│ ├── authorizeHolder.ts
│ ├── createIssuance.ts
│ ├── destroyIssuance.ts
│ ├── sendMPT.ts
│ └── setIssuance.ts
│
├── Batch/ # 배치 트랜잭션
│ ├── AllOrNothing.ts
│ ├── Independent.ts
│ ├── OnlyOne.ts
│ └── UntilFailure.ts
│
├── Server/ # 서버 정보 확인
│ └── serverInfo.ts
│
```
---
## 📂 폴더별 README 바로가기

- [Wallet](./xrpl/Wallet/README.md)
- [TrustSet](./xrpl/TrustSet/README.md)
- [TokenEscrow](./xrpl/TokenEscrow/README.md)
- [Server](./xrpl/Server/README.md)
- [PermissionedDomains](./xrpl/PermissionedDomains/README.md)
- [PermissionedDEX](./xrpl/PermissionedDEX/README.md)
- [Payment](./xrpl/Payment/README.md)
- [MPTokensV1](./xrpl/MPTokensV1/README.md)
- [Credential](./xrpl/Credential/README.md)
- [Batch](./xrpl/Batch/README.md)
- [AccountSet](./xrpl/AccountSet/README.md)

---
## XRPL Devnet Explorer

👉 https://devnet.xrpl.org/

---
## 🌐 네트워크 / 버전
 
| 항목       | 값 |
|------------|------------------------------------------------|
| 네트워크   | XRPL Devnet (wss://s.devnet.rippletest.net:51233) |
| rippled    | v2.5.0 |
| xrpl.js    | package.json 참조 |
| Node.js    | LTS 권장 |
