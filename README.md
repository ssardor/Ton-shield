# TON Shield AI — Backend

Hybrid backend service that powers the TON Shield browser extension and Telegram Mini App with real-time risk scoring for TON transactions and jettons.

---

## 📚 Документация для Фронтенд Разработчиков

**👉 [НАЧНИТЕ ОТСЮДА: docs/FRONTEND_API_GUIDE.md](docs/FRONTEND_API_GUIDE.md)**

Полная документация API с примерами кода для React, Next.js, Telegram Mini App:
- 📘 **Все эндпоинты** с примерами запросов/ответов
- 🧪 **cURL команды**: [docs/CURL_EXAMPLES.md](docs/CURL_EXAMPLES.md)
- 📊 **Dashboard**: [docs/DASHBOARD_SETUP.md](docs/DASHBOARD_SETUP.md)
- 🔌 **OpenAPI**: [docs/openapi.yaml](docs/openapi.yaml)

---

## Features
- 🚀 Fastify-based HTTP API with CORS-ready configuration
- 🔍 Risk Engine backed by live tonapi.io calls (account status, jetton metadata, holder stats)
- 🤖 DeepSeek AI summaries that translate heuristics into human-readable verdicts
- 🧠 Structured responses for overlay UI/Telegram dashboards

## Getting Started

```bash
npm install
npm run dev
```

Скопируйте `.env.example` в `.env` и заполните ключи.

Environment variables:

| Name | Required | Description |
| --- | --- | --- |
| `PORT` | No | Server port (default `3000`) |
| `HOST` | No | Host interface (default `0.0.0.0`) |
| `LOG_LEVEL` | No | Pino log level (default `info`) |
| `ALLOWED_ORIGINS` | No | Comma-separated list of allowed origins for CORS (default `*`) |
| `TONAPI_KEY` | Yes (prod) | API token for tonapi.io (Bearer token) |
| `TONAPI_BASE_URL` | No | Override tonapi base URL (default `https://tonapi.io/v2`) |
| `DEEPSEEK_API_KEY` | Optional | API key for DeepSeek-compatible endpoint |
| `DEEPSEEK_BASE_URL` | No | Override DeepSeek base (default `https://api.deepseek.com/v1`) |
| `DEEPSEEK_MODEL` | No | Model name (default `deepseek-chat`) |

## API

Swagger/OpenAPI спецификация лежит в [`docs/openapi.yaml`](docs/openapi.yaml). Удобно просматривать через https://editor.swagger.io/.

### POST /analyze/transaction
Body:
```json
{
  "user_wallet": "EQ...",
  "target_address": "EQ...",
  "amount_nanoton": "1500000000",
  "payload_boc": "BASE64...",
  "origin_domain": "ston-fi-drop.com"
}
```
Response includes `risk_level`, `risk_score`, `signals`, and `ai_explanation`.

### GET /analyze/jetton/:address
Returns live verdict (admin ownership, supply centralization, holder stats) for the given jetton master address with `risk_level`, `signals`, and `ai_verdict`.

### GET /analyze/address/:address
Quick reputation check for обычного TON-адреса (кошелёк/контракт) без транзакции. Возвращает `risk_level`, `risk_score`, `signals`, снэпшот аккаунта, **анализ последних 10 транзакций** и AI-пояснение — идеален для поля "Check Address" в TMA.

**NEW**: Автоматический анализ паттернов транзакций для выявления:
- 🚨 **Drainer атак** (множественные неудачные исходящие переводы)
- 🤖 **Ботов/спама** (быстрые всплески транзакций)
- 💸 **Высокого исходящего объёма** (возможная компрометация)
- 🔄 **Автоматического поведения** (взаимодействие с одним адресом)
- 🪙 **Активности жеттонов** (переводы токенов)

**Подробная документация**: [docs/TRANSACTION_PATTERN_ANALYSIS.md](docs/TRANSACTION_PATTERN_ANALYSIS.md)

## Next Steps
1. **Stabilize backend observability**
  - Add request metrics (p95 latency, tonapi response codes) and structured error tags.
  - Implement basic rate limiting + API keys for the extension/TMA clients.

2. **Speed + reliability enhancements**
  - Cache tonapi responses for 30–60 seconds using an in-memory LRU or Redis.
  - Add exponential backoff + retry for tonapi outages and queue DeepSeek calls.

3. **Data persistence**
  - Store transaction/jetton assessments (wallet ID, timestamp, verdict) for the Telegram Mini App dashboard.
  - Expose `/history/:wallet` endpoint with pagination for TMA.

4. **Browser Extension (Desktop Guard)**
  - Content script перехватывает TonConnect события и шлёт payload в API.
  - Оверлей предупреждает: Safe/Scam, показывает asset deltas и опции Proceed/Reject.
  - Popup добавляет Check Address + toggles для Simulation/Phishing Warning и deep-link "Open Dashboard in Telegram".

5. **Telegram Mini App (Mission Control)**
  - Dashboard: история проверок, уровень риска кошелька, баннеры из backend `/history`.
  - AI Link Scanner: input/forwarded URL → ML пайплайн (visual diff, domain intel, NLP) через backend endpoints.
  - Wallet Health: список активных approvals/jetton allowances с кнопками revoke (через будущий API).
  - Settings: уведомления, связка с расширением, управление toggles.

6. **Extension ↔️ TMA handshake**
  - Issue short-lived tokens that link browser extension sessions к Telegram user IDs.
  - Sync toggle settings (simulation, phishing alerts) via a shared preferences endpoint.

7. **AI/ML roadmap**
  - Feed stored assessments + Link Scanner результаты в DS pipeline для визуального сравнения и доменных скорингов.
  - Запустить A/B тесты DeepSeek промптов vs rule-based копирайта, расширить объяснения до многоязычности.
