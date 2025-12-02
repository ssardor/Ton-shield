# 📚 TON Shield AI - Documentation Index

Полная документация для разработки фронтенда.

---

## 🎯 Для Фронтенд Разработчиков

### 📘 [FRONTEND_API_GUIDE.md](./FRONTEND_API_GUIDE.md) - НАЧНИТЕ ОТСЮДА!
**Полная документация API с примерами кода**
- ✅ Описание всех эндпоинтов
- ✅ Структура запросов и ответов
- ✅ Примеры интеграции (React, Next.js, Telegram Mini App)
- ✅ TypeScript типы
- ✅ Коды ошибок
- ✅ UI рекомендации

### 🧪 [CURL_EXAMPLES.md](./CURL_EXAMPLES.md)
**Готовые cURL команды для тестирования**
- ✅ Примеры всех эндпоинтов
- ✅ Тестовые сценарии
- ✅ Проверка ошибок
- ✅ Быстрый старт

---

## 🔧 Для Backend Разработчиков

### 📖 [API_REFERENCE.md](./API_REFERENCE.md)
Краткая справка по API

### 🔌 [openapi.yaml](./openapi.yaml)
OpenAPI 3.0 спецификация (импортируйте в Swagger Editor)

### 🧪 [API_TESTING.md](./API_TESTING.md)
Гайд по тестированию API

---

## 📊 Для Dashboard Разработки

### 💾 [DASHBOARD_SETUP.md](./DASHBOARD_SETUP.md)
Настройка Dashboard и интеграция с Supabase

---

## 🚀 Быстрый Старт

### 1. Установка
```bash
npm install
cp .env.example .env
# Отредактируйте .env с вашими ключами
npm run dev
```

### 2. Тестирование
```bash
# Health check
curl http://localhost:3000/health

# Первая проверка
curl -X POST http://localhost:3000/analyze/link \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ston.fi"}'
```

### 3. Интеграция во фронтенд
Смотрите примеры в [FRONTEND_API_GUIDE.md](./FRONTEND_API_GUIDE.md)

---

## 📋 Структура Проекта

```
ton-shield-backend/
├── src/
│   ├── app.js                  # Главный файл
│   ├── core/                   # Бизнес-логика
│   │   ├── RiskEngine.js       # Движок анализа рисков
│   │   ├── TonService.js       # TON API клиент
│   │   ├── AiService.js        # DeepSeek AI клиент
│   │   ├── LinkService.js      # Анализ ссылок
│   │   └── SupabaseService.js  # База данных
│   └── routes/                 # API эндпоинты
│       ├── transaction.route.js
│       ├── address.route.js
│       ├── jetton.route.js
│       ├── link.route.js
│       ├── dashboard.route.js
│       └── meta.route.js
├── docs/                       # Документация
├── supabase/                   # SQL схемы
└── package.json
```

---

## 🔑 API Endpoints Overview

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/` | Статус сервиса |
| GET | `/health` | Health check |
| POST | `/analyze/transaction` | Анализ транзакции |
| GET | `/analyze/address/:address` | Проверка адреса |
| GET | `/analyze/jetton/:address` | Анализ токена |
| POST | `/analyze/link` | Сканер ссылок |
| GET | `/dashboard/:userId` | Dashboard пользователя |
| GET | `/history/:userId` | История проверок |
| GET | `/stats/:userId` | Статистика |

---

## 💡 Примеры Использования

### React Component
```tsx
import { useState } from 'react';
import { analyzeLink } from '@/api/tonShield';

export default function LinkChecker() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);

  const check = async () => {
    const data = await analyzeLink(url, telegramUserId);
    setResult(data);
  };

  return (
    <div>
      <input value={url} onChange={e => setUrl(e.target.value)} />
      <button onClick={check}>Check Link</button>
      {result && (
        <div className={`risk-${result.risk_level.toLowerCase()}`}>
          <h3>{result.risk_level}</h3>
          <p>{result.ai_summary}</p>
        </div>
      )}
    </div>
  );
}
```

### Telegram Mini App
```typescript
import { useTonConnectUI } from '@tonconnect/ui-react';

// Проверка перед отправкой транзакции
const sendSafely = async () => {
  const analysis = await analyzeTransaction({
    user_wallet: userAddress,
    target_address: recipientAddress,
    amount_nanoton: amount,
  });

  if (analysis.risk_level === 'CRITICAL') {
    const confirm = window.confirm(
      `⚠️ ${analysis.ai_explanation}\n\nContinue?`
    );
    if (!confirm) return;
  }

  await tonConnectUI.sendTransaction({ ... });
};
```

---

## 🎨 UI Kit

### Risk Level Colors
```css
.risk-safe     { color: #10b981; } /* Green */
.risk-warning  { color: #f59e0b; } /* Amber */
.risk-critical { color: #ef4444; } /* Red */
```

### Score Mapping
- 0-39: SAFE ✅
- 40-79: WARNING ⚠️
- 80-100: CRITICAL 🚨

---

## 🔒 Безопасность

- ✅ CORS настраивается через `ALLOWED_ORIGINS`
- ✅ Input валидация на всех эндпоинтах
- ✅ Graceful degradation при отказе внешних API
- ⚠️ В MVP нет rate limiting (добавится в production)

---

## 🐛 Troubleshooting

### Сервер не запускается
```bash
# Проверьте .env файл
cat .env

# Проверьте зависимости
npm install

# Проверьте порт
lsof -i :3000
```

### API возвращает 502
- Проверьте TONAPI_KEY в .env
- Проверьте DEEPSEEK_API_KEY в .env
- Система работает с fallback, но без AI объяснений

### Dashboard пустой
- Выполните SQL из `supabase/dashboard_schema.sql`
- Проверьте SUPABASE_URL и SUPABASE_ANON_KEY
- Убедитесь, что передаёте `X-User-ID` заголовок

---

## 📞 Поддержка

- **Документация:** Этот каталог `/docs`
- **Issues:** GitHub Issues
- **API Spec:** `openapi.yaml`

---

## 🚀 Next Steps

1. ✅ Прочитайте [FRONTEND_API_GUIDE.md](./FRONTEND_API_GUIDE.md)
2. ✅ Попробуйте примеры из [CURL_EXAMPLES.md](./CURL_EXAMPLES.md)
3. ✅ Интегрируйте в свой фронтенд
4. ✅ Настройте Dashboard ([DASHBOARD_SETUP.md](./DASHBOARD_SETUP.md))

---

**Happy Coding! 🎉**
