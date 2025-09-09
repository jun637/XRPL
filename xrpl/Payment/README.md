## Payment
* XRPL에서 **계정 간 자산 전송**을 수행하는 스크립트 모음입니다.  
* 송금 자산은 **XRP**(drops 단위 문자열) 또는 **IOU**(CurrencyAmount 객체)로 지정할 수 있습니다.  

- **XRP 전송**: `Amount: "1000"` (drops)  
- **IOU 전송**: `Amount: { currency, issuer, value }`  
- **사전 조건(IOU)**: 수신자가 해당 IOU의 **TrustLine**을 보유해야 수취 가능  
- **RequireAuth 활성화** 시: 수신자는 반드시 **승인(allow trust)** 상태여야 수취 가능  

---

## 🎯 시나리오 실행 명령어 및 설명  

### 1. XRP 전송
```bash
npx ts-node xrpl/Payment/sendXRP.ts
``` 
* Admin 계정이 User 계정으로 XRP를 송금 (`Amount`는 drops 단위 문자열, 예: `"1000"` = 0.001 XRP)

---

### 2. IOU 전송
```bash
npx ts-node xrpl/Payment/sendIOU.ts
```
* Admin(발행자) 계정이 User 계정으로 IOU를 송금  
* `Amount`는 `{ currency, issuer, value }` 형식이며, User는 해당 IOU의 TrustLine을 반드시 보유해야 함  

---

## ✅ 예상 결과
성공 시:
* send-xrp.ts 실행 → User 지갑에 지정한 수량의 XRP가 도착  
* send-iou.ts 실행 → User 지갑에 지정한 IOU가 도착, Explorer에서 `tesSUCCESS` 확인 가능  

실패 시:
* User가 IOU 신뢰선을 보유하지 않은 경우 → `tecNO_LINE` / `tecNO_AUTH` 오류  
* 발행자 계정이 RequireAuth 설정 시 승인되지 않은 계정 → 수취 실패  
* .env 누락 또는 노드 연결 실패 → 실행 불가  

---

## 🔍 추가 참고
전체 코드 / 상세 실행 로그 / 필드 해석은 Notion 문서 참고 → [Payment](https://catalyze-research.notion.site/Payment-241898c680bf80d293aaff549535a2b7?source=copy_link)

