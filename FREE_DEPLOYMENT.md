# 🚀 TON Shield Backend - Бесплатный Deployment

## ✅ 100% БЕСПЛАТНЫЕ варианты (без карты!)

### 1️⃣ Render.com (Лучший выбор!)
### 2️⃣ Vercel (с адаптером)
### 3️⃣ Koyeb.com (альтернатива)

---

# 🥇 Option 1: Render.com (РЕКОМЕНДУЮ!)

## ✅ Почему Render:
- **100% БЕСПЛАТНО** (карта НЕ нужна!)
- 750 часов/месяц
- Auto-deploy из GitHub
- Environment variables через UI
- Логи и monitoring
- Custom domain

## ⚠️ Минус:
- Auto-sleep через 15 минут неактивности
- Cold start ~30-60 сек (можно решить UptimeRobot)

---

## 📝 Пошаговая инструкция:

### Шаг 1: Подготовь код

Убедись что в `package.json` есть:

```json
{
  "type": "module",
  "scripts": {
    "start": "node src/app.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

Проверь что `src/app.js` читает PORT из env:

```javascript
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

await app.listen({ port: PORT, host: HOST });
```

### Шаг 2: Push на GitHub

```bash
# Если еще не создал репозиторий
git init
git add .
git commit -m "TON Shield Backend ready for deployment"
git branch -M main
git remote add origin https://github.com/ssardor/Ton-shield.git
git push -u origin main
```

### Шаг 3: Deploy на Render

1. **Зайди на** https://render.com
2. **Sign up** через GitHub (бесплатно, карта НЕ нужна!)
3. **Dashboard → New (+) → Web Service**
4. **Connect GitHub** → найди `ssardor/Ton-shield`
5. **Настрой параметры:**

```
Name: ton-shield-backend
Region: Frankfurt (EU Central)  ← ближе к России
Branch: main
Runtime: Node
Build Command: npm install
Start Command: node src/app.js
Instance Type: Free (0$/month) ✅
```

### Шаг 4: Добавь Environment Variables

Нажми **Advanced → Add Environment Variable**:

```env
NODE_ENV=production
PORT=10000

# TON API (получи новый на tonapi.io)
TONAPI_KEY=AFCPVGYOYB6WIKAAAAAA...

# DeepSeek AI (получи новый на platform.deepseek.com)
DEEPSEEK_API_KEY=sk-xxxxxxxx...

# Supabase
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Шаг 5: Создай Web Service

Нажми **"Create Web Service"**

Render начнет deploy (2-3 минуты):
```
==> Cloning from GitHub...
==> Running 'npm install'
==> Starting service...
✅ Live at https://ton-shield-backend.onrender.com
```

### Шаг 6: Тестируй API

```bash
# Health check
curl https://ton-shield-backend.onrender.com/health

# Link scanner
curl -X POST https://ton-shield-backend.onrender.com/analyze/link \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 123456789" \
  -d '{"url": "https://ston-fi.io"}'
```

✅ **Готово!** Твой backend живет на:
```
https://ton-shield-backend.onrender.com
```

---

# 🥈 Option 2: Vercel (для Next.js API Routes)

⚠️ **Важно:** Vercel не поддерживает Fastify напрямую, нужно переписать на Next.js API Routes

### Быстрая миграция на Next.js API:

1. Создай Next.js проект:
```bash
npx create-next-app ton-shield-api --typescript --app
```

2. Перенеси эндпоинты в `app/api/`:
```
app/
  api/
    health/route.ts
    analyze/
      transaction/route.ts
      address/[address]/route.ts
      jetton/[address]/route.ts
      link/route.ts
    dashboard/
      [userId]/route.ts
    history/
      [userId]/route.ts
```

3. Deploy на Vercel:
```bash
vercel --prod
```

**Минусы:** Много работы для миграции ❌

---

# 🥉 Option 3: Koyeb.com (Альтернатива Render)

## ✅ Почему Koyeb:
- Бесплатный tier
- No credit card required
- Auto-deploy
- EU servers

## Шаги:

```bash
# 1. Зайди на koyeb.com
# 2. Sign up (бесплатно)
# 3. Create App → GitHub
# 4. Выбери Ton-shield repo
# 5. Настрой:
```

```
Runtime: Node
Build: npm install
Run: node src/app.js
Instance: Free (Eco)
```

6. Добавь Environment Variables
7. Deploy!

URL: `https://ton-shield-backend-ssardor.koyeb.app`

---

# 🚨 Как решить Auto-Sleep на Render

## Проблема:
Render засыпает после 15 минут → первый запрос медленный

## Решение: UptimeRobot (бесплатно!)

1. **Зайди на** https://uptimerobot.com
2. **Sign up** (бесплатно)
3. **Add New Monitor:**
```
Monitor Type: HTTP(s)
Friendly Name: TON Shield Backend
URL: https://ton-shield-backend.onrender.com/health
Monitoring Interval: Every 5 minutes
```

4. **Save**

✅ UptimeRobot будет пинговать твой API каждые 5 минут → он не заснет!

**Бесплатный tier:** 50 мониторов, проверка каждые 5 мин

---

# 📊 Сравнение платформ

| Платформа | Бесплатно | Карта | Auto-sleep | Deploy | 
|-----------|-----------|-------|------------|--------|
| **Render.com** | ✅ 750ч | ❌ Нет | ✅ Да (решаемо) | GitHub |
| **Railway** | ❌ $5 | ✅ Да | ❌ Нет | GitHub |
| **Vercel** | ✅ | ❌ Нет | ❌ Нет | Git (только serverless) |
| **Koyeb** | ✅ | ❌ Нет | ⚠️ Да | GitHub |
| **Fly.io** | ⚠️ Ограничено | ⚠️ Иногда | ❌ Нет | CLI |

**Итог:** **Render.com** — лучший выбор! 🏆

---

# 🔐 Получи новые API ключи

## 1. TON API (tonapi.io)

```bash
# 1. Зайди на https://tonapi.io
# 2. Sign up (GitHub или email)
# 3. Dashboard → API Keys → Create Key
# 4. Copy key: AFCPVGYOYB6WIKAAAAAA...

# Free tier:
# - 1 request/second
# - 100,000 requests/month
# - Достаточно для MVP!
```

## 2. DeepSeek AI (platform.deepseek.com)

```bash
# 1. Зайди на https://platform.deepseek.com
# 2. Sign up
# 3. API Keys → Create new key
# 4. Copy: sk-xxxxxxxxxxxxxxxx

# Free tier:
# - $5 credit на старте
# - ~500K tokens (много!)
# - Можно refill потом
```

## 3. Supabase (уже есть)

```bash
# У тебя уже есть проект на Supabase
# Просто копируй URL и anon key из dashboard
```

---

# ✅ Финальный Checklist

Перед запуском проверь:

- [ ] `package.json` имеет `"start": "node src/app.js"`
- [ ] `src/app.js` читает `process.env.PORT`
- [ ] Код на GitHub (push сделан)
- [ ] Render Web Service создан
- [ ] Environment variables добавлены
- [ ] TONAPI_KEY новый (не из .env.example!)
- [ ] DEEPSEEK_API_KEY новый
- [ ] Deploy прошел успешно (смотри логи)
- [ ] `/health` endpoint работает
- [ ] `/analyze/link` возвращает результат
- [ ] UptimeRobot настроен (против sleep)

---

# 🚀 Quick Start (TL;DR)

```bash
# 1. Push на GitHub
git add .
git commit -m "Ready for Render"
git push

# 2. Render.com → New Web Service
# 3. Connect GitHub repo
# 4. Add environment variables
# 5. Deploy!

# 6. Твой API живет:
https://ton-shield-backend.onrender.com

# 7. Используй в TMA:
NEXT_PUBLIC_API_URL=https://ton-shield-backend.onrender.com
```

---

# 🎯 Следующий шаг: Frontend TMA

После того как backend задеплоен:

1. ✅ Создай Next.js TMA (используй `COPILOT_PROMPT_TMA.md`)
2. ✅ Добавь `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://ton-shield-backend.onrender.com
```
3. ✅ Deploy на Vercel (100% бесплатно!)
4. ✅ Настрой Telegram Bot Menu Button
5. ✅ Launch! 🎉

---

**Вопросы?** Пиши! Render — это самый простой способ задеплоить твой backend бесплатно! 🚀
