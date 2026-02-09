# XRPL Lending Protocol - Lifecycle Flow

## Architecture Overview

```
+------------------+       +------------------+       +------------------+
|    Depositor     |       |     Broker       |       |    Borrower      |
|   (LP 투자자)     |       |  (대출 중개인)     |       |    (차입자)       |
+--------+---------+       +--------+---------+       +--------+---------+
         |                          |                          |
         |  VaultDeposit            |                          |
         +--------->+-------+       |                          |
                    | Vault |<-----+ VaultCreate               |
                    | (금고) |       |                          |
                    +---+---+       |                          |
                        |           |                          |
                        |   LoanBrokerSet                      |
                        |   +-------->+-----------+            |
                        |             | LoanBroker |           |
                        |             | (브로커)    |           |
                        |   Cover     +-----+-----+            |
                        |   Deposit         |                  |
                        |   +-------------->|                  |
                        |                   |                  |
                        |            LoanSet (dual-sign)       |
                        |<------+-----------+----------+------>|
                        |       |      +----+----+     |       |
                        |  원금  |      |  Loan   |     | 원금  |
                        |  출금  |      | (대출)   |     | 수령  |
                        |       |      +---------+     |       |
                        |                              |       |
                        |            LoanPay           |       |
                        |<-----------------------------+-------+
                        |       (상환금 → 금고 복귀)             |
                        |                                      |
```

---

## Ledger Object Relationship

```
Vault ──────────── LoanBroker ──────────── Loan
(금고)               (브로커)                (대출)
  │                   │                      │
  ├─ Asset: XRP       ├─ VaultID ────────>Vault  ├─ LoanBrokerID ──>LoanBroker
  ├─ AssetsTotal      ├─ CoverAvailable         ├─ Borrower
  ├─ AssetsAvailable  ├─ DebtTotal              ├─ PrincipalOutstanding
  └─ Owner: Broker    └─ Owner: Broker          ├─ PaymentInterval
                                                ├─ GracePeriod
                                                └─ NextPaymentDueDate
```

---

## Full Lifecycle Flow

```
Phase 1: Setup                 Phase 2: Lending              Phase 3: Cleanup
========================       ========================       ========================

[1] VaultCreate (Broker)       [5] LoanSet (Dual-sign)       [8]  LoanDelete (Broker)
         │                              │                              │
         v                              v                              v
[2] VaultDeposit (Depositor)   [6] LoanPay (Borrower)        [9]  LoanBrokerCoverWithdraw
         │                              │                              │
         v                              v                              v
[3] LoanBrokerSet (Broker)     [7] LoanManage (Broker)       [10] LoanBrokerDelete
         │                         (옵션: Default/Impair)              │
         v                                                             v
[4] LoanBrokerCoverDeposit                                   [11] VaultWithdraw
    (Broker, 권장)                                                     │
                                                                       v
                                                              [12] VaultDelete
```

---

## Transaction Details

### Phase 1: Setup

| # | Transaction | Account (서명) | 주요 필드 | 산출 |
|---|------------|---------------|----------|------|
| 1 | `VaultCreate` | Broker | Asset, WithdrawalPolicy | **VaultID** (64 hex) |
| 2 | `VaultDeposit` | Depositor | VaultID, Amount | 금고 자산 증가 |
| 3 | `LoanBrokerSet` | Broker | VaultID | **LoanBrokerID** (64 hex) |
| 4 | `LoanBrokerCoverDeposit` | Broker | LoanBrokerID, Amount | CoverAvailable 증가 |

### Phase 2: Lending

| # | Transaction | Account (서명) | 주요 필드 | 비고 |
|---|------------|---------------|----------|------|
| 5 | `LoanSet` | **Borrower** | LoanBrokerID, Counterparty, PrincipalRequested, PaymentInterval, GracePeriod | **듀얼 서명 필요** (아래 참고) |
| 6 | `LoanPay` | Borrower | LoanID, Amount | PeriodicPayment 이상 납부 필요 |
| 7 | `LoanManage` | Broker | LoanID, Flags | tfLoanDefault / tfLoanImpair / tfLoanUnimpair |

### Phase 3: Cleanup

| # | Transaction | Account (서명) | 주요 필드 | 선행 조건 |
|---|------------|---------------|----------|----------|
| 8 | `LoanDelete` | Broker | LoanID | 미상환 잔액 = 0 (상환 완료 or Default 처리) |
| 9 | `LoanBrokerCoverWithdraw` | Broker | LoanBrokerID, Amount | - |
| 10 | `LoanBrokerDelete` | Broker | LoanBrokerID | 소속 Loan 전부 삭제 (OwnerCount = 0) |
| 11 | `VaultWithdraw` | Depositor | VaultID, Amount | - |
| 12 | `VaultDelete` | Broker (Owner) | VaultID | 잔액 = 0, 연결된 Broker 없음 |

---

## LoanSet Dual Signing (핵심)

LoanSet은 **Borrower + Counterparty(Broker) 두 주체의 서명**이 필요한 유일한 트랜잭션입니다.

```
Borrower                          Broker (Counterparty)
────────                          ─────────────────────
   │                                      │
   │  1. autofill(baseTx)                 │
   │  2. borrower.sign(prepared)          │
   │  3. decode(tx_blob) → txObj          │
   │                                      │
   │  4. signingData = encodeForSigning(txObj)
   │                                      │
   │          signingData ───────────────>│
   │                                      │
   │                          5. kpSign(signingData, brokerPrivKey)
   │                                      │
   │          brokerSig <─────────────────│
   │                                      │
   │  6. txObj.CounterpartySignature = {  │
   │       SigningPubKey: broker.publicKey,│
   │       TxnSignature: brokerSig        │
   │     }                                │
   │                                      │
   │  7. encode(txObj) → finalBlob        │
   │  8. submit(finalBlob)                │
   └──────────────────────────────────────┘
```

**핵심 포인트:**
- `CounterpartySignature`는 `isSigningField: false` → `encodeForSigning`에서 자동 제외
- 두 서명 모두 **동일한 signing data** 사용 (encodeForSigning 결과)
- `autofill`이 Counterparty signer 수를 고려해 Fee를 자동 계산
- Account = **Borrower**, Counterparty = **Broker** (Broker가 대출을 승인하는 구조)

---

## ID Dependency Chain

```
VaultCreate ──> VaultID ──┬──> VaultDeposit
                          ├──> VaultWithdraw
                          ├──> VaultDelete
                          └──> LoanBrokerSet ──> LoanBrokerID ──┬──> LoanBrokerCoverDeposit
                                                                ├──> LoanBrokerCoverWithdraw
                                                                ├──> LoanBrokerCoverClawback
                                                                ├──> LoanBrokerDelete
                                                                └──> LoanSet ──> LoanID ──┬──> LoanPay
                                                                                          ├──> LoanManage
                                                                                          └──> LoanDelete
```

---

## Scenario Flows

### Scenario A: Normal Repayment (정상 상환)

```
LoanSet ──> LoanPay (전액) ──> LoanDelete ──> Cleanup
```

가장 기본적인 플로우. Borrower가 PeriodicPayment 이상을 납부하면 PrincipalOutstanding이 감소하고,
전액 상환 시 LoanDelete로 Loan 객체를 삭제합니다.

### Scenario B: Loan Default (부도/채무불이행)

```
LoanSet ──> (Borrower 미상환, 만기+Grace 초과)
        ──> LoanManage (tfLoanDefault: 0x00010000)
        ──> LoanDelete ──> Cleanup
```

- Borrower가 `NextPaymentDueDate + GracePeriod`까지 미상환 시 Broker가 부도 처리
- Default 시 `PrincipalOutstanding`이 0으로 상각, Vault의 `AssetsTotal`에서 손실 차감
- Default 후 LoanDelete 가능

### Scenario C: Loan Impairment (손상 처리)

```
LoanSet ──> LoanManage (tfLoanImpair: 0x00020000)
        ──> ... (이후 상환 or Default)
        ──> LoanManage (tfLoanUnimpair: 0x00040000)  ← 회복 시
```

- Broker가 대출 건전성 악화를 판단 시 Impair 처리
- 상황 개선 시 Unimpair로 복구 가능

### Scenario D: Late Payment (연체 후 상환)

```
LoanSet ──> (NextPaymentDueDate 경과)
        ──> LoanPay (GracePeriod 내)
        ──> LoanDelete ──> Cleanup
```

- `NextPaymentDueDate`를 넘겼지만 `GracePeriod` 이내라면 LoanPay 가능
- GracePeriod도 초과하면 `tecEXPIRED` → Scenario B(Default)로 진행

### Scenario E: Cover Clawback (커버 자본 환수 - IOU/MPT Only)

```
LoanBrokerCoverClawback (Asset Issuer가 실행)
──> Broker의 CoverAvailable 감소
```

- **XRP 대출에서는 사용 불가** (Issuer가 존재하지 않음)
- IOU/MPT 대출에서 Asset Issuer가 Broker의 Cover를 강제 환수
- Amount 생략 시 `DebtTotal * CoverRateMinimum`만큼 자동 계산

---

## Important Fields Reference

### LoanSet 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `LoanBrokerID` | String (64 hex) | O | 연결할 Broker |
| `PrincipalRequested` | String (Number) | O | 대출 원금 (drops) |
| `Counterparty` | String (address) | - | Broker 주소 (듀얼 서명 대상) |
| `PaymentInterval` | UInt32 | - | 상환 주기 (초). 기본값 60 |
| `GracePeriod` | UInt32 | - | 연체 유예 기간 (초). 기본값 60 |
| `InterestRate` | Number | - | 이자율 |
| `PaymentTotal` | UInt32 | - | 총 상환 횟수 |
| `LoanOriginationFee` | String (Number) | - | 대출 개설 수수료 |
| `LoanServiceFee` | String (Number) | - | 서비스 수수료 |
| `LatePaymentFee` | String (Number) | - | 연체 수수료 |
| `ClosePaymentFee` | String (Number) | - | 조기 상환 수수료 |
| `OverpaymentFee` | UInt32 | - | 초과 납부 수수료 |

> **주의:** `PaymentInterval`과 `GracePeriod` 기본값이 60초(1분)입니다.
> 테스트 시 반드시 충분한 값으로 설정하세요. (예: 31536000 = 1년)

### Loan Ledger Object 상태 필드

| 필드 | 설명 |
|------|------|
| `PrincipalOutstanding` | 미상환 원금 잔액 |
| `TotalValueOutstanding` | 미상환 총액 (원금 + 이자 + 수수료) |
| `NextPaymentDueDate` | 다음 납부 기한 (Ripple epoch) |
| `PaymentRemaining` | 남은 납부 횟수 |
| `PeriodicPayment` | 1회 납부 금액 |
| `StartDate` | 대출 시작일 |
| `Flags: 0x00010000` | Default (부도) 상태 |

---

## Execution Commands (Quick Reference)

```bash
# Phase 1: Setup
npx ts-node xrpl/SingleAssetVault/VaultCreate.ts
npx ts-node xrpl/SingleAssetVault/VaultDeposit.ts
npx ts-node xrpl/LendingProtocol/LoanBrokerSet.ts
npx ts-node xrpl/LendingProtocol/LoanBrokerCoverDeposit.ts

# Phase 2: Lending
npx ts-node xrpl/LendingProtocol/LoanSet.ts
npx ts-node xrpl/LendingProtocol/LoanPay.ts
npx ts-node xrpl/LendingProtocol/LoanManage.ts

# Phase 3: Cleanup
npx ts-node xrpl/LendingProtocol/LoanDelete.ts
npx ts-node xrpl/LendingProtocol/LoanBrokerCoverWithdraw.ts
npx ts-node xrpl/LendingProtocol/LoanBrokerDelete.ts
npx ts-node xrpl/SingleAssetVault/VaultWithdraw.ts
npx ts-node xrpl/SingleAssetVault/VaultDelete.ts
```

---

## Known Issue: ripple-binary-codec STNumber Bug

`ripple-binary-codec@2.6.0`의 `STNumber.normalize()`가 rippled C++과 다른 정규화를 수행하여,
`Number` 타입 필드(PrincipalRequested 등)가 포함된 트랜잭션에서 **서명 해시 불일치 → Invalid signature** 오류가 발생합니다.

**영향 범위:** LoanSet의 `PrincipalRequested`, 각종 Fee 필드 등 `Number` 타입(type code 9) 사용 필드 전체

**임시 해결:** `node_modules/ripple-binary-codec/dist/types/st-number.js`의 `normalize()` 함수를 패치하여
mantissa를 `MAX_INT64`까지 최대화하도록 변경

**이슈 트래킹:** https://github.com/XRPLF/xrpl.js/issues
