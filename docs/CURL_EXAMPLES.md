# 🧪 TON Shield API - cURL Examples

Готовые команды для тестирования всех эндпоинтов.

---

## 🏥 Health & Meta

### Проверка статуса
```bash
curl http://localhost:3000/
```

### Health check
```bash
curl http://localhost:3000/health
```

---

## 💸 Анализ Транзакций

### Базовая проверка
```bash
curl -X POST http://localhost:3000/analyze/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "user_wallet": "UQD1Lp1KcmGHFpE8QAOhM5jg8qygLR2Vz-5jgxzNTt6_UdGh",
    "target_address": "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
  }'
```

### С суммой и доменом
```bash
curl -X POST http://localhost:3000/analyze/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "user_wallet": "UQD1Lp1KcmGHFpE8QAOhM5jg8qygLR2Vz-5jgxzNTt6_UdGh",
    "target_address": "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT",
    "amount_nanoton": "5000000000",
    "origin_domain": "ston-fi-fake123.com"
  }'
```

### С сохранением в историю
```bash
curl -X POST http://localhost:3000/analyze/transaction \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 123456789" \
  -d '{
    "user_wallet": "UQD1Lp1KcmGHFpE8QAOhM5jg8qygLR2Vz-5jgxzNTt6_UdGh",
    "target_address": "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
    "amount_nanoton": "1000000000"
  }'
```

---

## 📍 Анализ Адресов

### Проверить адрес
```bash
curl http://localhost:3000/analyze/address/UQD1Lp1KcmGHFpE8QAOhM5jg8qygLR2Vz-5jgxzNTt6_UdGh
```

### С сохранением в историю
```bash
curl http://localhost:3000/analyze/address/UQD1Lp1KcmGHFpE8QAOhM5jg8qygLR2Vz-5jgxzNTt6_UdGh \
  -H "X-User-ID: 123456789"
```

---

## 🪙 Анализ Жетонов

### Проверить Notcoin
```bash
curl http://localhost:3000/analyze/jetton/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT
```

### Проверить USDT
```bash
curl http://localhost:3000/analyze/jetton/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs
```

### С сохранением в историю
```bash
curl http://localhost:3000/analyze/jetton/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT \
  -H "X-User-ID: 123456789"
```

---

## 🔗 Сканер Ссылок

### Проверить обычный сайт
```bash
curl -X POST http://localhost:3000/analyze/link \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://ston.fi"
  }'
```

### Проверить фишинг сайт
```bash
curl -X POST http://localhost:3000/analyze/link \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://ston-fi-airdrop-2024.com"
  }'
```

### Проверить Telegram бота
```bash
curl -X POST http://localhost:3000/analyze/link \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://t.me/wallet"
  }'
```

### Проверить подозрительного бота
```bash
curl -X POST http://localhost:3000/analyze/link \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://t.me/tonkeeper_official_2024_bot"
  }'
```

### С сохранением в историю
```bash
curl -X POST http://localhost:3000/analyze/link \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 123456789" \
  -d '{
    "url": "https://suspicious-site.com"
  }'
```

---

## 📊 Dashboard

### Получить полную сводку
```bash
curl http://localhost:3000/dashboard/123456789
```

### Получить только статистику
```bash
curl http://localhost:3000/stats/123456789
```

### Получить историю (первая страница)
```bash
curl http://localhost:3000/history/123456789
```

### История с пагинацией
```bash
curl "http://localhost:3000/history/123456789?limit=10&offset=0"
```

### Фильтр по типу
```bash
curl "http://localhost:3000/history/123456789?type=transaction"
```

### Фильтр по уровню риска
```bash
curl "http://localhost:3000/history/123456789?risk_level=CRITICAL"
```

### Комбинированные фильтры
```bash
curl "http://localhost:3000/history/123456789?limit=20&type=link&risk_level=WARNING"
```

---

## 🧪 Тестовые Сценарии

### Сценарий 1: Безопасная транзакция
```bash
curl -X POST http://localhost:3000/analyze/transaction \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-1" \
  -d '{
    "user_wallet": "UQD1Lp1KcmGHFpE8QAOhM5jg8qygLR2Vz-5jgxzNTt6_UdGh",
    "target_address": "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT",
    "amount_nanoton": "100000000",
    "origin_domain": "ston.fi"
  }'
```
**Ожидаемый результат:** `SAFE` или `WARNING` (низкий score)

---

### Сценарий 2: Подозрительная транзакция
```bash
curl -X POST http://localhost:3000/analyze/transaction \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-1" \
  -d '{
    "user_wallet": "UQD1Lp1KcmGHFpE8QAOhM5jg8qygLR2Vz-5jgxzNTt6_UdGh",
    "target_address": "UQNEWADDRESSNOTACTIVEYET123456789",
    "amount_nanoton": "100000000000",
    "origin_domain": "ston-fi-drop-2024.xyz"
  }'
```
**Ожидаемый результат:** `WARNING` или `CRITICAL`

---

### Сценарий 3: Проверка фишинга
```bash
curl -X POST http://localhost:3000/analyze/link \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-1" \
  -d '{
    "url": "https://tonkeeper-wallet-connect-2024.com"
  }'
```
**Ожидаемый результат:** `CRITICAL` (impersonation detected)

---

### Сценарий 4: Проверка легитимного бота
```bash
curl -X POST http://localhost:3000/analyze/link \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-1" \
  -d '{
    "url": "https://t.me/wallet"
  }'
```
**Ожидаемый результат:** `SAFE` или `WARNING`

---

### Сценарий 5: Проверить Dashboard после тестов
```bash
# Сначала выполните несколько проверок с одним X-User-ID
# Затем получите dashboard:
curl http://localhost:3000/dashboard/test-user-1
```
**Ожидаемый результат:** Статистика с total_checks > 0

---

## 📝 Форматирование вывода (опционально)

### С jq (если установлен)
```bash
curl -s http://localhost:3000/analyze/address/UQD1... | jq .
```

### Только risk_level
```bash
curl -s http://localhost:3000/analyze/address/UQD1... | jq -r '.data.risk_level'
```

### Только signals
```bash
curl -s http://localhost:3000/analyze/address/UQD1... | jq -r '.data.signals[]'
```

---

## 🐛 Тестирование ошибок

### Отсутствует обязательное поле
```bash
curl -X POST http://localhost:3000/analyze/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "user_wallet": "UQD1..."
  }'
```
**Ожидаемый результат:** `400 VALIDATION_ERROR`

---

### Невалидный URL
```bash
curl -X POST http://localhost:3000/analyze/link \
  -H "Content-Type: application/json" \
  -d '{
    "url": "not-a-url"
  }'
```
**Ожидаемый результат:** `400 VALIDATION_ERROR`

---

### Wallet адрес вместо jetton
```bash
curl http://localhost:3000/analyze/jetton/UQD1Lp1KcmGHFpE8QAOhM5jg8qygLR2Vz-5jgxzNTt6_UdGh
```
**Ожидаемый результат:** `400 NOT_JETTON_MASTER` (если TON API работает)

---

## ⚡ Быстрый старт для тестирования

Выполните все команды последовательно:

```bash
# 1. Проверка сервера
curl http://localhost:3000/health

# 2. Проверка транзакции
curl -X POST http://localhost:3000/analyze/transaction \
  -H "Content-Type: application/json" \
  -H "X-User-ID: quick-test" \
  -d '{"user_wallet":"UQD1Lp1KcmGHFpE8QAOhM5jg8qygLR2Vz-5jgxzNTt6_UdGh","target_address":"EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"}'

# 3. Проверка ссылки
curl -X POST http://localhost:3000/analyze/link \
  -H "Content-Type: application/json" \
  -H "X-User-ID: quick-test" \
  -d '{"url":"https://ston-fi-fake.com"}'

# 4. Просмотр dashboard
curl http://localhost:3000/dashboard/quick-test

# 5. Просмотр истории
curl http://localhost:3000/history/quick-test
```

---

**Tip:** Сохраните этот файл и используйте команды для быстрого тестирования! 🚀
