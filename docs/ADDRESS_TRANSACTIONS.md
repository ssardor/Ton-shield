# 📜 Address Analysis - Recent Transactions Feature

## ✅ Новая фича добавлена!

Endpoint `/analyze/address/:address` теперь возвращает **последние 10 транзакций**!

---

## 📊 Структура ответа:

```json
{
  "status": "ok",
  "data": {
    "address": "UQAVLWFDXGF2LXM67Y4YZC17WYKD9A0GUWPKMS1GOSM__NOT",
    "risk_level": "SAFE",
    "risk_score": 10,
    "signals": [],
    "account": {
      "status": "active",
      "balance": "1234.5678",
      "balance_nanoton": "1234567800000000",
      "interfaces": ["wallet_v4"],
      "name": "My Wallet"
    },
    "recent_transactions": [
      {
        "hash": "a1b2c3d4e5f6...",
        "timestamp": 1733567890,
        "direction": "incoming",
        "counterparty": "UQCXXX...XXX",
        "amount": "10.5000",
        "amount_nanoton": "10500000000",
        "success": true,
        "fee": "0.0042"
      },
      {
        "hash": "f6e5d4c3b2a1...",
        "timestamp": 1733567850,
        "direction": "outgoing",
        "counterparty": "UQAYYY...YYY",
        "amount": "5.2500",
        "amount_nanoton": "5250000000",
        "success": true,
        "fee": "0.0038"
      }
    ],
    "ai_explanation": "Active wallet with recent transactions."
  }
}
```

---

## 🔍 Поля транзакции:

| Поле | Тип | Описание |
|------|-----|----------|
| `hash` | string | Хеш транзакции (можно использовать для explorer link) |
| `timestamp` | number | Unix timestamp (секунды) |
| `direction` | string | `"incoming"`, `"outgoing"`, или `"unknown"` |
| `counterparty` | string\|null | Адрес отправителя/получателя (normalized) |
| `amount` | string | Сумма в TON (форматированная) |
| `amount_nanoton` | string | Точная сумма в nanoton |
| `success` | boolean | Успешна ли транзакция |
| `fee` | string | Комиссия в TON |

---

## 💡 Примеры использования:

### 1. React компонент для отображения транзакций

```typescript
interface Transaction {
  hash: string | null;
  timestamp: number | null;
  direction: 'incoming' | 'outgoing' | 'unknown';
  counterparty: string | null;
  amount: string;
  amount_nanoton: string;
  success: boolean;
  fee: string;
}

function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="space-y-2">
      {transactions.map((tx, i) => (
        <div key={tx.hash || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="flex items-center gap-2">
              {tx.direction === 'incoming' ? (
                <span className="text-green-600">↓ Incoming</span>
              ) : (
                <span className="text-red-600">↑ Outgoing</span>
              )}
              <span className="font-mono text-sm">
                {tx.amount} TON
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {tx.counterparty && `From/To: ${tx.counterparty.slice(0, 8)}...${tx.counterparty.slice(-6)}`}
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            {tx.timestamp && new Date(tx.timestamp * 1000).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 2. Telegram Mini App - показать последние транзакции

```javascript
async function checkWalletAddress(address) {
  const response = await fetch(
    `https://ton-shield.onrender.com/analyze/address/${address}`,
    {
      headers: {
        'X-User-ID': window.Telegram.WebApp.initDataUnsafe.user?.id
      }
    }
  );
  
  const { data } = await response.json();
  
  // Показать баланс
  console.log(`Balance: ${data.account.balance} TON`);
  
  // Показать последние транзакции
  console.log(`Recent transactions (${data.recent_transactions.length}):`);
  data.recent_transactions.forEach(tx => {
    const arrow = tx.direction === 'incoming' ? '↓' : '↑';
    const color = tx.direction === 'incoming' ? '🟢' : '🔴';
    console.log(`${color} ${arrow} ${tx.amount} TON - ${new Date(tx.timestamp * 1000).toLocaleString()}`);
  });
}
```

### 3. Explorer link для транзакции

```javascript
function getTonScanLink(txHash) {
  return `https://tonscan.org/tx/${txHash}`;
}

// Usage
<a href={getTonScanLink(tx.hash)} target="_blank">
  View on TonScan →
</a>
```

---

## 📱 UX примеры:

### Вариант 1: Timeline view
```
📊 Wallet Balance: 1,234.56 TON

📜 Recent Transactions:

↓ 🟢 Received 10.50 TON
   From: UQCXXX...XXX
   2 hours ago

↑ 🔴 Sent 5.25 TON
   To: UQAYYY...YYY
   5 hours ago

↓ 🟢 Received 100.00 TON
   From: UQBZZZ...ZZZ
   1 day ago
```

### Вариант 2: Card list
```
┌─────────────────────────────────────┐
│ ↓ Incoming                          │
│ +10.5000 TON                        │
│ From: UQCXXX...XXX                  │
│ Dec 7, 2025 14:30                   │
│ Fee: 0.0042 TON                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ↑ Outgoing                          │
│ -5.2500 TON                         │
│ To: UQAYYY...YYY                    │
│ Dec 7, 2025 14:25                   │
│ Fee: 0.0038 TON                     │
└─────────────────────────────────────┘
```

---

## 🎨 UI рекомендации:

1. **Direction indicators:**
   - Incoming: Green ↓ или ⬇️ или 🟢
   - Outgoing: Red ↑ или ⬆️ или 🔴

2. **Amount formatting:**
   - Incoming: `+10.5000 TON` (green)
   - Outgoing: `-5.2500 TON` (red)

3. **Timestamp:**
   - Recent: "2 hours ago"
   - Older: "Dec 7, 2025"

4. **Counterparty address:**
   - Truncate: `UQCXXX...XXX` (first 6 + last 6 chars)
   - Link to explorer
   - Show full on tap/hover

5. **Transaction hash:**
   - Link to TonScan
   - Copy button
   - Icon: 🔗

---

## 🧪 Тестирование:

```bash
# Проверить адрес с транзакциями
curl https://ton-shield.onrender.com/analyze/address/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT

# Ответ должен содержать:
{
  "data": {
    "account": { ... },
    "recent_transactions": [
      { "direction": "incoming", "amount": "..." },
      ...
    ]
  }
}
```

---

## 📊 Лимиты:

- **Максимум транзакций:** 10 (последние)
- **Fallback:** Если TON API не работает → `recent_transactions: []`
- **Timeout:** 8 секунд на запрос

---

## ⚠️ Важно:

1. **Если адрес неактивен** → `recent_transactions: []`
2. **Если TONAPI_KEY невалидный** → `recent_transactions: []` (но ошибки не будет)
3. **Transaction hash** может быть `null` для старых транзакций
4. **Counterparty** может быть `null` для специальных транзакций

---

## ✅ Что готово:

- [x] Метод `getAccountTransactions()` в TonService
- [x] Метод `fetchRecentTransactions()` в RiskEngine
- [x] Метод `sanitizeTransactions()` для форматирования
- [x] Поле `recent_transactions` в ответе `/analyze/address`
- [x] Обработка direction (incoming/outgoing)
- [x] Форматирование amounts в TON
- [x] Timestamp parsing
- [x] Error handling с fallback

---

## 🚀 Готово к deploy!

```bash
git add .
git commit -m "feat: Add recent transactions to address analysis"
git push
```

Render задеплоит через 2-3 минуты! 🎉
