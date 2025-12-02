# TON Shield AI — API Reference

> Полная OpenAPI-спецификация лежит в [`docs/openapi.yaml`](openapi.yaml). Ниже краткое описание эндпоинтов.

## Базовые сведения
- **Base URL (dev):** `http://localhost:3000`
- **Auth:** не требуется (будет добавлено позже через API tokens)
- **Формат:** JSON

## Health
`GET /`
- Возвращает статус сервиса, версию и timestamp.

## Transaction Analysis
`POST /analyze/transaction`
```json
{
  "user_wallet": "EQ...",
  "target_address": "EQ...",
  "amount_nanoton": "1500000000",
  "payload_boc": "BASE64...",
  "origin_domain": "ston-fi.app"
}
```
**Ответ:** статус + объект `data` с `risk_level`, `risk_score`, `signals`, `target_account`, `ai_explanation`.
В `target_account.balance` сразу лежит TON (4 знака после запятой), а оригинальное значение можно взять из `balance_nanoton`.

## Jetton Analysis
`GET /analyze/jetton/:address`
- Параметр `address` — master-адрес jetton. Если передать обычный кошелёк, вернётся `400 NOT_JETTON_MASTER`.
- Ответ содержит `risk_level`, `signals`, `metadata`, `holder_count`, `ai_verdict`. В `metadata` появился `total_supply_tokens` — supply, приведённый к decimals токена.

## Address Reputation Check
`GET /analyze/address/:address`
- Принимает любой TON-адрес (кошелёк, контракт).
- Возвращает `risk_level`, `signals`, `account` (status, `balance` в TON и `balance_nanoton` в нанотонах) и `ai_explanation`.

## Link & Website Analysis
`POST /analyze/link`
```json
{
  "url": "https://ston-fi-drop.com"
}
```
- Проверяет сайты и Telegram Mini App ссылки на фишинг.
- Анализирует возраст домена, подозрительные паттерны, наличие официальных упоминаний.
- AI ищет новости и доверенные источники об этом домене/боте.
- **Важно:** Это примерная оценка риска, не 100% гарантия мошенничества или легитимности.
- Ответ содержит `risk_level`, `signals`, `domain_age_days`, `has_official_news`, `ai_summary`.

## Dashboard & History

### Get Dashboard Summary
`GET /dashboard/:userId`
- Возвращает полную сводку: статистику, последние критические находки, риск-таймлайн за 30 дней.
- Идеально для главного экрана TMA.

### Get Assessment History
`GET /history/:userId?limit=20&offset=0&type=transaction&risk_level=CRITICAL`
- Пагинированный список всех проверок пользователя.
- Фильтры: `type` (transaction/jetton/address/link), `risk_level` (SAFE/WARNING/CRITICAL).

### Get Quick Stats
`GET /stats/:userId`
- Только статистика без таймлайна (быстрее).
- Содержит счётчики по типам проверок и уровням риска.

**Заголовок `X-User-ID`**: Все analyze endpoints принимают опциональный заголовок `X-User-ID` для автоматического сохранения в историю.

## Расширение API
- Все endpoints автоматически сохраняют проверки в Supabase при наличии `X-User-ID` заголовка.
- RLS policies защищают данные пользователей.
- Dashboard автоматически обновляется через triggers.

## Как читать OpenAPI
1. Откройте `docs/openapi.yaml` в Swagger Editor (https://editor.swagger.io/).
2. Нажмите "File → Import file" и выберите YAML.
3. Получите интерактивный Swagger UI с возможностью выполнять запросы.

При изменении API обновляйте YAML и данную Markdown-страницу для синхронизации документации.
