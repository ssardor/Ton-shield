# 📘 TON Shield AI - Полная API Документация для Фронтенд Разработчиков

**Version:** 0.1.0  
**Base URL:** `http://localhost:3000` (dev) / `https://your-domain.com` (production)  
**Date:** November 30, 2025

---

## 📋 Содержание

1. [Общая Информация](#общая-информация)
2. [Мета Эндпоинты](#мета-эндпоинты)
3. [Анализ Транзакций](#анализ-транзакций)
4. [Анализ Адресов](#анализ-адресов)
5. [Анализ Жетонов](#анализ-жетонов)
6. [Сканер Ссылок](#сканер-ссылок)
7. [Dashboard & История](#dashboard--история)
8. [Типы Данных](#типы-данных)
9. [Коды Ошибок](#коды-ошибок)
10. [Примеры Интеграции](#примеры-интеграции)

---

## 🌐 Общая Информация

### Формат Запросов
- **Content-Type:** `application/json`
- **Accept:** `application/json`
- **Encoding:** UTF-8

### Формат Ответов
Все успешные ответы имеют структуру:
```json
{
  "status": "ok",
  "data": { ... }
}
```

Ошибки возвращаются с HTTP кодом 4xx/5xx:
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message"
}
```

### Заголовки (опционально)
```
X-User-ID: <telegram_user_id_or_uuid>
```
Если передан `X-User-ID`, результат автоматически сохраняется в историю пользователя.

---

## 🏥 Мета Эндпоинты

### GET `/`
Проверка статуса сервиса.

**Response:**
```json
{
  "status": "ok",
  "service": "TON Shield AI backend",
  "version": "0.1.0",
  "timestamp": "2025-11-30T12:00:00.000Z"
}
```

**HTTP Status:** `200 OK`

---

### GET `/health`
Health check для мониторинга.

**Response:**
```json
{
  "status": "ok",
  "uptime": 12345.67,
  "timestamp": "2025-11-30T12:00:00.000Z"
}
```

**HTTP Status:** `200 OK`

---

## 💸 Анализ Транзакций

### POST `/analyze/transaction`

Анализирует предстоящую транзакцию на предмет рисков.

#### Request Body:
```json
{
  "user_wallet": "UQD1Lp1KcmGHFpE8QAOhM5jg8qygLR2Vz-5jgxzNTt6_UdGh",
  "target_address": "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
  "amount_nanoton": "5000000000",
  "payload_boc": "te6ccgEBAQEADgAAGEhlbGxvIHdvcmxkIXgtxbw=",
  "origin_domain": "ston.fi"
}
```

#### Параметры:
| Параметр | Тип | Обязательно | Описание |
|----------|-----|-------------|----------|
| `user_wallet` | string | ✅ Да | Адрес кошелька пользователя (friendly format) |
| `target_address` | string | ✅ Да | Адрес получателя |
| `amount_nanoton` | string/number | ❌ Нет | Сумма в нанотонах (1 TON = 10^9 nanoton) |
| `payload_boc` | string | ❌ Нет | Base64-encoded BOC с payload |
| `origin_domain` | string | ❌ Нет | Домен сайта, откуда инициирована транзакция |

#### Response (200 OK):
```json
{
  "status": "ok",
  "data": {
    "risk_level": "WARNING",
    "risk_score": 65,
    "signals": [
      "Address not yet active on-chain",
      "High value transfer: 5 TON",
      "Domain contains suspicious numeric/hyphen patterns"
    ],
    "target_address": "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9C",
    "target_account": {
      "status": "uninit",
      "balance": "0",
      "balance_nanoton": "0",
      "interfaces": [],
      "name": null
    },
    "ai_explanation": "This transaction has moderate risk due to uninitialized recipient and high transfer amount."
  }
}
```

#### Response Fields:
| Поле | Тип | Описание |
|------|-----|----------|
| `risk_level` | string | `SAFE` / `WARNING` / `CRITICAL` |
| `risk_score` | number | 0-100 (чем выше, тем опаснее) |
| `signals` | array | Список обнаруженных факторов риска |
| `target_address` | string | Нормализованный адрес получателя |
| `target_account` | object/null | Информация об аккаунте получателя |
| `ai_explanation` | string | Объяснение риска на естественном языке |

#### Errors:
**400 Bad Request** - Отсутствуют обязательные поля:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Missing required fields: target_address"
}
```

**502 Bad Gateway** - Ошибка при обращении к внешним API:
```json
{
  "error": "UPSTREAM_ERROR",
  "message": "Unable to analyze transaction right now"
}
```

---

## 📍 Анализ Адресов

### GET `/analyze/address/:address`

Проверяет репутацию TON адреса.

#### URL Parameters:
| Параметр | Описание |
|----------|----------|
| `address` | TON адрес в friendly или raw формате |

#### Example Request:
```bash
GET /analyze/address/UQD1Lp1KcmGHFpE8QAOhM5jg8qygLR2Vz-5jgxzNTt6_UdGh
```

#### Response (200 OK):
```json
{
  "status": "ok",
  "data": {
    "address": "UQD1LP1KCMGHFPE8QAOHM5JG8QYGLR2VZ-5JGXZNTT6_UDGH",
    "risk_level": "SAFE",
    "risk_score": 30,
    "signals": [
      "Address not yet active on-chain"
    ],
    "account": {
      "status": "uninit",
      "balance": "0",
      "balance_nanoton": "0",
      "interfaces": [],
      "name": null
    },
    "ai_explanation": "This is a new wallet address with no on-chain activity yet."
  }
}
```

#### Response Fields:
| Поле | Тип | Описание |
|------|-----|----------|
| `address` | string | Нормализованный адрес |
| `risk_level` | string | `SAFE` / `WARNING` / `CRITICAL` |
| `risk_score` | number | 0-100 |
| `signals` | array | Факторы риска |
| `account` | object/null | Информация об аккаунте |
| `account.status` | string | `active` / `uninit` / `frozen` |
| `account.balance` | string | Баланс в TON (форматированный) |
| `account.balance_nanoton` | string | Баланс в нанотонах |
| `account.interfaces` | array | Типы контракта (wallet_v3r2, nft_item и т.д.) |
| `ai_explanation` | string | Объяснение |

#### Errors:
**400 Bad Request:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Wallet address is required"
}
```

---

## 🪙 Анализ Жетонов (Jetton)

### GET `/analyze/jetton/:address`

Проверяет токен на honeypot, риски централизации и другие проблемы.

#### URL Parameters:
| Параметр | Описание |
|----------|----------|
| `address` | Jetton **master** адрес (не wallet адрес!) |

#### Example Request:
```bash
GET /analyze/jetton/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT
```

#### Response (200 OK):
```json
{
  "status": "ok",
  "data": {
    "jetton_address": "UQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__I5W",
    "is_honeypot_suspected": false,
    "risk_score": 20,
    "risk_level": "SAFE",
    "signals": [],
    "metadata": {
      "name": "Notcoin",
      "symbol": "NOT",
      "description": "Notcoin token",
      "image": "https://cdn.joincommunity.xyz/clicker/not_logo.png",
      "decimals": "9",
      "total_supply": "102456956071910898915",
      "total_supply_tokens": "102456956071.9109"
    },
    "holder_count": 20,
    "admin_address": null,
    "ai_verdict": "This jetton appears safe with no admin privileges and good holder distribution."
  }
}
```

#### Response Fields:
| Поле | Тип | Описание |
|------|-----|----------|
| `jetton_address` | string | Нормализованный адрес jetton |
| `is_honeypot_suspected` | boolean | Подозрение на honeypot (score >= 60) |
| `risk_score` | number | 0-100 |
| `risk_level` | string | `SAFE` / `WARNING` / `CRITICAL` |
| `signals` | array | Обнаруженные проблемы |
| `metadata` | object/null | Метаданные токена |
| `metadata.name` | string | Название |
| `metadata.symbol` | string | Тикер |
| `metadata.decimals` | string | Количество десятичных знаков |
| `metadata.total_supply` | string | Supply в мини-единицах |
| `metadata.total_supply_tokens` | string | Supply в токенах (форматированный) |
| `holder_count` | number | Количество холдеров (макс 20 в выборке) |
| `admin_address` | string/null | Адрес админа (если есть) или null |
| `ai_verdict` | string | AI оценка |

#### Errors:
**400 Bad Request - Not a Jetton:**
```json
{
  "error": "NOT_JETTON_MASTER",
  "message": "Provided address belongs to a wallet, not a jetton master contract"
}
```

**400 Bad Request - Invalid Address:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Provide a valid TON jetton master address"
}
```

---

## 🔗 Сканер Ссылок

### POST `/analyze/link`

Проверяет URL на фишинг и мошенничество (включая Telegram Mini Apps).

#### Request Body:
```json
{
  "url": "https://t.me/tonkeeper_fake_bot/app"
}
```

#### Parameters:
| Параметр | Тип | Обязательно | Описание |
|----------|-----|-------------|----------|
| `url` | string | ✅ Да | Полный URL для проверки |

#### Response (200 OK):
```json
{
  "status": "ok",
  "data": {
    "url": "https://t.me/tonkeeper_fake_bot/app",
    "domain": "t.me",
    "is_telegram_link": true,
    "bot_username": "tonkeeper_fake_bot",
    "risk_level": "CRITICAL",
    "risk_score": 95,
    "signals": [
      "Domain may impersonate tonkeeper",
      "Bot username contains suspicious patterns",
      "Domain age unknown (unable to verify registration date)",
      "No official news or trusted mentions found online"
    ],
    "domain_age_days": null,
    "has_official_news": false,
    "ai_summary": "No official mentions found. This appears to be an impersonation attempt."
  }
}
```

#### Response Fields:
| Поле | Тип | Описание |
|------|-----|----------|
| `url` | string | Исходный URL |
| `domain` | string | Извлечённый домен |
| `is_telegram_link` | boolean | true если это t.me ссылка |
| `bot_username` | string/null | Username бота (если Telegram link) |
| `risk_level` | string | `SAFE` / `WARNING` / `CRITICAL` |
| `risk_score` | number | 0-100 |
| `signals` | array | Обнаруженные подозрительные признаки |
| `domain_age_days` | number/null | Возраст домена в днях (если известен) |
| `has_official_news` | boolean | Найдены ли официальные упоминания |
| `ai_summary` | string | AI резюме о репутации |

#### Errors:
**400 Bad Request - Missing URL:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "URL is required in request body"
}
```

**400 Bad Request - Invalid URL:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid URL format"
}
```

---

## 📊 Dashboard & История

### GET `/dashboard/:userId`

Получить полную сводку Dashboard для пользователя.

#### URL Parameters:
| Параметр | Описание |
|----------|----------|
| `userId` | Telegram User ID или UUID пользователя |

#### Example Request:
```bash
GET /dashboard/123456789
```

#### Response (200 OK):
```json
{
  "status": "ok",
  "data": {
    "user_id": "123456789",
    "stats": {
      "user_id": "123456789",
      "total_checks": 42,
      "checks_today": 5,
      "checks_this_week": 18,
      "safe_count": 30,
      "warning_count": 10,
      "critical_count": 2,
      "transaction_checks": 20,
      "jetton_checks": 10,
      "address_checks": 8,
      "link_checks": 4,
      "last_check_at": "2025-11-30T12:00:00.000Z",
      "updated_at": "2025-11-30T12:00:00.000Z"
    },
    "recent_critical": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "assessment_type": "link",
        "target_identifier": "phishing-site.com",
        "risk_level": "CRITICAL",
        "risk_score": 95,
        "created_at": "2025-11-30T11:00:00.000Z"
      }
    ],
    "risk_timeline": [
      {
        "date": "2025-11-30",
        "safe": 3,
        "warning": 2,
        "critical": 0
      },
      {
        "date": "2025-11-29",
        "safe": 5,
        "warning": 1,
        "critical": 1
      }
    ]
  }
}
```

#### Response Fields:
| Поле | Тип | Описание |
|------|-----|----------|
| `stats` | object | Статистика пользователя |
| `stats.total_checks` | number | Всего проверок |
| `stats.checks_today` | number | Проверок сегодня |
| `stats.checks_this_week` | number | Проверок за неделю |
| `stats.safe_count` | number | Безопасных результатов |
| `stats.warning_count` | number | Предупреждений |
| `stats.critical_count` | number | Критических находок |
| `stats.*_checks` | number | Проверок по типу |
| `recent_critical` | array | Последние 5 критических находок |
| `risk_timeline` | array | График рисков за 30 дней |

---

### GET `/history/:userId`

Получить историю проверок с пагинацией и фильтрами.

#### URL Parameters:
| Параметр | Описание |
|----------|----------|
| `userId` | Telegram User ID или UUID |

#### Query Parameters:
| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `limit` | number | 20 | Количество записей (макс 100) |
| `offset` | number | 0 | Смещение для пагинации |
| `type` | string | null | Фильтр: `transaction`, `jetton`, `address`, `link` |
| `risk_level` | string | null | Фильтр: `SAFE`, `WARNING`, `CRITICAL` |

#### Example Request:
```bash
GET /history/123456789?limit=10&offset=0&type=transaction&risk_level=CRITICAL
```

#### Response (200 OK):
```json
{
  "status": "ok",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": "123456789",
        "assessment_type": "transaction",
        "target_identifier": "EQAbc...",
        "risk_level": "CRITICAL",
        "risk_score": 85,
        "signals": ["High risk signals..."],
        "assessment_data": {
          "risk_level": "CRITICAL",
          "risk_score": 85,
          "signals": ["..."],
          "ai_explanation": "..."
        },
        "origin_domain": "suspicious-site.com",
        "created_at": "2025-11-30T10:00:00.000Z"
      }
    ],
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```

#### Response Fields:
| Поле | Тип | Описание |
|------|-----|----------|
| `items` | array | Массив записей истории |
| `total` | number | Общее количество записей (с учётом фильтров) |
| `limit` | number | Использованный limit |
| `offset` | number | Использованный offset |

---

### GET `/stats/:userId`

Получить только статистику (быстрее, чем dashboard).

#### Example Request:
```bash
GET /stats/123456789
```

#### Response (200 OK):
```json
{
  "status": "ok",
  "data": {
    "user_id": "123456789",
    "total_checks": 42,
    "checks_today": 5,
    "checks_this_week": 18,
    "safe_count": 30,
    "warning_count": 10,
    "critical_count": 2,
    "transaction_checks": 20,
    "jetton_checks": 10,
    "address_checks": 8,
    "link_checks": 4,
    "last_check_at": "2025-11-30T12:00:00.000Z",
    "updated_at": "2025-11-30T12:00:00.000Z"
  }
}
```

---

## 📐 Типы Данных

### Risk Level
```typescript
type RiskLevel = "SAFE" | "WARNING" | "CRITICAL";
```

- **SAFE** - score 0-39
- **WARNING** - score 40-79
- **CRITICAL** - score 80-100

### Assessment Type
```typescript
type AssessmentType = "transaction" | "jetton" | "address" | "link";
```

### Account Status
```typescript
type AccountStatus = "active" | "uninit" | "frozen";
```

### Account Info
```typescript
interface AccountInfo {
  status: AccountStatus;
  balance: string;           // Форматированный в TON
  balance_nanoton: string;   // В нанотонах
  interfaces: string[];      // ["wallet_v3r2", "nft_item"]
  name: string | null;
}
```

### Jetton Metadata
```typescript
interface JettonMetadata {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  decimals: string;
  total_supply: string;           // В мини-единицах
  total_supply_tokens: string;    // Форматированный
}
```

---

## ⚠️ Коды Ошибок

| HTTP Code | Error Code | Описание |
|-----------|------------|----------|
| 400 | `VALIDATION_ERROR` | Невалидные входные данные |
| 400 | `NOT_JETTON_MASTER` | Адрес не является jetton master |
| 404 | `NOT_FOUND` | Ресурс не найден |
| 502 | `UPSTREAM_ERROR` | Ошибка внешнего API (TON API, DeepSeek) |
| 500 | `INTERNAL_ERROR` | Внутренняя ошибка сервера |

---

## 💡 Примеры Интеграции

### React / Next.js

```typescript
// api/tonShield.ts
const API_BASE = 'http://localhost:3000';

export interface TransactionAnalysisRequest {
  user_wallet: string;
  target_address: string;
  amount_nanoton?: string;
  payload_boc?: string;
  origin_domain?: string;
}

export interface AnalysisResponse {
  risk_level: 'SAFE' | 'WARNING' | 'CRITICAL';
  risk_score: number;
  signals: string[];
  ai_explanation: string;
}

export async function analyzeTransaction(
  data: TransactionAnalysisRequest,
  userId?: string
): Promise<AnalysisResponse> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (userId) {
    headers['X-User-ID'] = userId;
  }

  const response = await fetch(`${API_BASE}/analyze/transaction`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Analysis failed');
  }

  const result = await response.json();
  return result.data;
}

export async function analyzeLink(url: string, userId?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (userId) {
    headers['X-User-ID'] = userId;
  }

  const response = await fetch(`${API_BASE}/analyze/link`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Link analysis failed');
  }

  const result = await response.json();
  return result.data;
}

export async function getDashboard(userId: string) {
  const response = await fetch(`${API_BASE}/dashboard/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to load dashboard');
  }

  const result = await response.json();
  return result.data;
}
```

### Использование в компоненте:

```tsx
import { analyzeTransaction, analyzeLink, getDashboard } from '@/api/tonShield';

function TransactionChecker() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkTransaction = async () => {
    setLoading(true);
    try {
      const analysis = await analyzeTransaction({
        user_wallet: 'UQ...',
        target_address: 'EQ...',
        amount_nanoton: '5000000000',
      }, '123456789'); // Telegram User ID

      setResult(analysis);

      // Показать предупреждение если риск высокий
      if (analysis.risk_level === 'CRITICAL') {
        alert(`⚠️ CRITICAL RISK: ${analysis.ai_explanation}`);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={checkTransaction} disabled={loading}>
        {loading ? 'Analyzing...' : 'Check Transaction'}
      </button>
      
      {result && (
        <div className={`risk-${result.risk_level.toLowerCase()}`}>
          <h3>Risk Level: {result.risk_level}</h3>
          <p>Score: {result.risk_score}/100</p>
          <p>{result.ai_explanation}</p>
          <ul>
            {result.signals.map((signal, i) => (
              <li key={i}>{signal}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Telegram Mini App (TON Connect)

```typescript
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { analyzeTransaction } from './api/tonShield';

function SendTransaction() {
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();
  const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  const sendWithRiskCheck = async (to: string, amount: string) => {
    // Проверяем риски ПЕРЕД отправкой
    const analysis = await analyzeTransaction({
      user_wallet: userAddress,
      target_address: to,
      amount_nanoton: amount,
    }, telegramUserId?.toString());

    // Показываем предупреждение
    if (analysis.risk_level === 'CRITICAL') {
      const confirmed = confirm(
        `🚨 HIGH RISK DETECTED!\n\n${analysis.ai_explanation}\n\nDo you want to proceed?`
      );
      if (!confirmed) return;
    }

    // Отправляем транзакцию
    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: to,
        amount: amount,
      }],
    });
  };

  return (
    <button onClick={() => sendWithRiskCheck('EQ...', '5000000000')}>
      Send 5 TON
    </button>
  );
}
```

---

## 🔄 Rate Limiting

В текущей версии нет rate limiting. В production версии будет:
- **Без API ключа:** 100 запросов/час
- **С API ключом:** 1000 запросов/час
- **Premium:** без лимитов

---

## 🔒 Безопасность

### CORS
API поддерживает CORS для всех доменов (`*`) в dev режиме.  
В production настройте `ALLOWED_ORIGINS` в `.env`.

### Аутентификация
В MVP аутентификации нет. Данные разделены по `X-User-ID`.  
В production будет:
- JWT токены
- API ключи
- Row Level Security в Supabase

---

## 🎨 UI Рекомендации

### Цвета для Risk Level

```css
.risk-safe {
  color: #10b981;      /* green */
  background: #d1fae5;
}

.risk-warning {
  color: #f59e0b;      /* amber */
  background: #fef3c7;
}

.risk-critical {
  color: #ef4444;      /* red */
  background: #fee2e2;
}
```

### Иконки
- ✅ SAFE - зелёная галочка
- ⚠️ WARNING - жёлтый треугольник
- 🚨 CRITICAL - красный восклицательный знак

---

## 📞 Поддержка

**Issues:** GitHub Issues  
**Docs:** `/docs` в репозитории  
**OpenAPI:** `/docs/openapi.yaml`

---

**Happy Coding! 🚀**
