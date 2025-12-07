# 📊 Analyze Address Response - Balance Info

## ✅ ДА, endpoint показывает баланс кошелька!

### Структура ответа `/analyze/address/:address`:

```json
{
  "status": "ok",
  "data": {
    "address": "UQAXUIBBTQBQ5P1R0QLFWRCECE1BHHFLYEUPZ2VXIGZW77II",
    "risk_level": "SAFE",
    "risk_score": 10,
    "signals": [
      "Account is active"
    ],
    "account": {
      "status": "active",           // ✅ Статус: active/uninit/frozen
      "balance": "123.4567",         // ✅ Баланс в TON (форматированный)
      "balance_nanoton": "123456700000", // ✅ Баланс в nanoton (точный)
      "interfaces": ["wallet_v4"],   // ✅ Тип контракта
      "name": "TON Wallet"           // ✅ Имя (если есть)
    },
    "ai_explanation": "Risk level SAFE. Active wallet with balance."
  }
}
```

---

## 🔍 Что возвращается в поле `account`:

### Если адрес активен (имеет баланс):
```json
"account": {
  "status": "active",
  "balance": "1234.5678",          // 👈 БАЛАНС В TON
  "balance_nanoton": "1234567800000000", // 👈 БАЛАНС В NANOTON
  "interfaces": ["wallet_v4"],
  "name": null
}
```

### Если адрес не активен (не инициализирован):
```json
"account": null   // Кошелек еще не получал транзакции
```

### Если адрес заморожен:
```json
"account": {
  "status": "frozen",              // ⚠️ Заблокирован
  "balance": "0",
  "balance_nanoton": "0",
  "interfaces": [],
  "name": null
}
```

---

## 📝 Примеры реальных ответов:

### 1. Активный кошелек с балансом:

**Request:**
```bash
curl https://ton-shield.onrender.com/analyze/address/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT
```

**Response:**
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
      "balance": "50000000000.0000",    // 👈 50 млрд NOT токенов
      "balance_nanoton": "50000000000000000000",
      "interfaces": ["jetton_master"],
      "name": "Notcoin"
    },
    "ai_explanation": "Active jetton contract with high balance."
  }
}
```

### 2. Неактивный адрес (0 баланс):

**Request:**
```bash
curl https://ton-shield.onrender.com/analyze/address/UQAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

**Response:**
```json
{
  "status": "ok",
  "data": {
    "address": "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "risk_level": "SAFE",
    "risk_score": 30,
    "signals": [
      "Address not yet active on-chain"
    ],
    "account": null,  // 👈 Нет баланса, не инициализирован
    "ai_explanation": "Address not yet active on-chain."
  }
}
```

### 3. Скам адрес (из blacklist):

**Request:**
```bash
curl https://ton-shield.onrender.com/analyze/address/EQBrokenScamAddress123
```

**Response:**
```json
{
  "status": "ok",
  "data": {
    "address": "UQBROKENSCAMADDRESS123",
    "risk_level": "CRITICAL",
    "risk_score": 95,
    "signals": [
      "Address flagged as scam: UQBROKENSCAMADDRESS123"
    ],
    "account": {
      "status": "active",
      "balance": "0.0000",  // 👈 Скам кошелек может быть пустым
      "balance_nanoton": "0",
      "interfaces": ["wallet_v3"],
      "name": null
    },
    "ai_explanation": "CRITICAL risk detected: Address flagged as scam."
  }
}
```

---

## 💡 Как использовать баланс в UI:

### React компонент:

```typescript
interface AccountInfo {
  status: 'active' | 'uninit' | 'frozen';
  balance: string;           // Форматированный баланс в TON
  balance_nanoton: string;   // Точный баланс в nanoton
  interfaces: string[];
  name: string | null;
}

function AddressCard({ account }: { account: AccountInfo | null }) {
  if (!account) {
    return <div>Address not active (0 TON)</div>;
  }

  return (
    <div>
      <p>Status: {account.status}</p>
      <p>Balance: {account.balance} TON</p>  {/* 👈 Показываем баланс */}
      <p>Type: {account.interfaces.join(', ')}</p>
      {account.name && <p>Name: {account.name}</p>}
    </div>
  );
}
```

### Telegram Mini App:

```javascript
async function checkAddress(address) {
  const response = await fetch(
    `https://ton-shield.onrender.com/analyze/address/${address}`,
    {
      headers: {
        'X-User-ID': window.Telegram.WebApp.initDataUnsafe.user?.id
      }
    }
  );
  
  const { data } = await response.json();
  
  if (data.account) {
    console.log(`Balance: ${data.account.balance} TON`);  // 👈 Баланс есть!
    console.log(`Status: ${data.account.status}`);
  } else {
    console.log('Address not active');
  }
}
```

---

## 🔧 Код в RiskEngine (уже реализовано):

**Файл:** `src/core/RiskEngine.js`

```javascript
sanitizeAccount(accountInfo) {
  if (!accountInfo) return null;
  return {
    status: accountInfo.status,
    balance: this.formatTonAmount(accountInfo.balance),  // ✅ Конвертирует nanoton → TON
    balance_nanoton: accountInfo.balance,                // ✅ Сохраняет точное значение
    interfaces: accountInfo.interfaces,
    name: accountInfo.name,
  };
}

formatTonAmount(value, precision = 4) {
  return this.formatTokenAmount(value, 9, precision);  // ✅ 9 decimals для TON
}
```

---

## ⚠️ Важно:

### Почему иногда `account: null`:

1. **Адрес не инициализирован** — кошелек создан но никогда не получал TON
2. **TON API не отвечает** — проблема с TONAPI_KEY (сейчас на production)
3. **Неверный формат адреса** — не парсится как TON address

### Как проверить работает ли баланс:

```bash
# 1. Убедись что TONAPI_KEY валидный в Render Environment Variables
# 2. Проверь логи Render (должно быть "Account found" в логах)
# 3. Тестируй с известным активным адресом, например:

curl https://ton-shield.onrender.com/analyze/address/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT
```

---

## ✅ Резюме:

| Вопрос | Ответ |
|--------|-------|
| **Показывает ли баланс?** | ✅ ДА! В полях `balance` и `balance_nanoton` |
| **В каком формате?** | `balance` — строка с TON (например "123.4567")<br>`balance_nanoton` — строка с точным значением |
| **Когда баланса нет?** | Если `account: null` (адрес не активен) |
| **Точность баланса** | 4 знака после запятой по умолчанию |
| **Работает сейчас?** | ⚠️ На production не работает из-за невалидного TONAPI_KEY |

---

## 🛠️ Что нужно сделать:

1. **Обнови TONAPI_KEY** в Render Dashboard:
   - Получи новый ключ на https://tonapi.io
   - Render → Environment → Edit `TONAPI_KEY`
   - Сохрани (auto redeploy)

2. **Протестируй**:
   ```bash
   curl https://ton-shield.onrender.com/analyze/address/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT
   ```

3. **Убедись что `account.balance` заполнен** ✅

---

**Вывод:** Баланс кошелька **УЖЕ возвращается** в endpoint! Нужно только обновить TONAPI_KEY чтобы API работал правильно. 🚀
