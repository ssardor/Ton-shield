# TON Shield AI — API Testing Guide

Этот гайд покрывает быстрый manual smoke-тест backend API перед интеграцией расширения и Telegram Mini App.

## 1. Подготовка окружения
1. Скопируйте `.env.example` → `.env` и заполните реальные ключи:
   - `TONAPI_KEY`
   - `DEEPSEEK_API_KEY`
   - (опционально) `ALLOWED_ORIGINS`, `PORT`, `HOST`
2. Убедитесь, что в Supabase создана схема из `supabase/schema.sql`.
3. Установите зависимости (один раз):
   ```bash
   npm install
   ```

## 2. Запуск backend
```bash
PORT=4200 HOST=127.0.0.1 \
TONAPI_KEY=... \
DEEPSEEK_API_KEY=... \
npm run dev
```
Логи должны содержать: `TON Shield backend running on http://127.0.0.1:4200`.

## 3. Проверка health-роута
```bash
curl -s http://127.0.0.1:4200/
```
Ожидаемый ответ:
```json
{
  "status": "ok",
  "service": "TON Shield AI backend",
  "version": "0.1.0",
  "timestamp": "..."
}
```

## 4. Проверка анализа транзакции
```bash
curl -s -X POST http://127.0.0.1:4200/analyze/transaction \
  -H "Content-Type: application/json" \
  -d '{
        "user_wallet": "EQBTESTUSERADDRESS000000000000000000000000000000000000",
        "target_address": "EQCplMPnkzRlaR271GGBqBPdZiZsaAJ2bXqVUuAv89xDSJqE",
        "amount_nanoton": "25000000000",
        "origin_domain": "ston-fi.app"
      }'
```
Убедитесь, что `risk_level`, `risk_score`, `signals`, `ai_explanation` возвращаются без ошибок. 
Пример: `risk_level: "SAFE"`, `signals: ["Domain impersonates known brand"]`.

## 5. Проверка анализа jetton
```bash
curl -s http://127.0.0.1:4200/analyze/jetton/EQBTuWmR7BncpsbR9f7D78Dveoxu48UUfZo0Sy0RKZ77N8C5
```
Ожидаем `risk_level` и сигналы по ликвидности/метаданным. Пример:
```json
{
  "status": "ok",
  "data": {
    "jetton_address": "EQBTUWMR7BNCPSBR9F7D78DVEOXU48UUFZO0SY0RKZ77N8C5",
    "risk_level": "CRITICAL",
    "signals": [
      "Jetton metadata unavailable from TON API",
      "No holder data returned — likely illiquid"
    ],
    "ai_verdict": "This token is extremely risky ..."
  }
}
```
> Если вставить обычный кошелёк, роут вернёт `400` с ошибкой `NOT_JETTON_MASTER`.

## 6. Проверка адреса (Check Address)
```bash
curl -s http://127.0.0.1:4200/analyze/address/EQCplMPnkzRlaR271GGBqBPdZiZsaAJ2bXqVUuAv89xDSJqE
```
Убедитесь, что ответ содержит `risk_level`, `signals` и `account`, где `balance` уже переведён в TON, а `balance_nanoton` — исходное значение.

## 7. Проверка сайтов и Telegram Mini App (Link Scanner)
```bash
curl -s -X POST http://127.0.0.1:4200/analyze/link \
  -H "Content-Type: application/json" \
  -d '{"url": "https://ston-fi-drop.com"}'
```
Ожидаем `risk_level`, `signals`, `domain_age_days`, `has_official_news`, `ai_summary`.

**Telegram bot пример:**
```bash
curl -s -X POST http://127.0.0.1:4200/analyze/link \
  -H "Content-Type: application/json" \
  -d '{"url": "https://t.me/wallet"}'
```

> Это примерная оценка, не 100% подтверждение. Всегда проверяйте дополнительно.

## 8. Dashboard и история (с Supabase)

Сначала создай пользователя в Supabase (выполни SQL):
```sql
INSERT INTO users (telegram_id, username) 
VALUES (123456789, 'test_user') 
RETURNING id;
```
Запомни `id` (UUID).

**Получить dashboard:**
```bash
curl -s http://127.0.0.1:4200/dashboard/<USER_UUID>
```

**История проверок:**
```bash
curl -s "http://127.0.0.1:4200/history/<USER_UUID>?limit=10&type=transaction"
```

**Только статистика:**
```bash
curl -s http://127.0.0.1:4200/stats/<USER_UUID>
```

**Сохранение в историю (опционально):**
Добавь заголовок `-H "X-User-ID: <USER_UUID>"` к любому analyze запросу:
```bash
curl -s -X POST http://127.0.0.1:4200/analyze/link \
  -H "Content-Type: application/json" \
  -H "X-User-ID: <USER_UUID>" \
  -d '{"url": "https://test-phishing.com"}'
```

## 9. Завершение
После тестов остановите сервер `Ctrl+C` или командой `kill <PID>`.

Если любой из шагов падает, проверьте ключи, сетевое соединение и лимиты tonapi/deepseek.
