# 🚀 TON Shield Backend Deployment Guide

## 📋 Рекомендованный стек для deployment:

### Backend API: Railway.app (или Render.com)
### Frontend TMA: Vercel (или Netlify)

---

## 🔧 Option 1: Railway.app (Рекомендуется)

### Преимущества:
- ✅ Бесплатный tier ($5 credit/месяц)
- ✅ Поддержка Node.js из коробки
- ✅ Auto-deploy из GitHub
- ✅ Environment variables UI
- ✅ Logs и monitoring
- ✅ Custom domain

### Шаги:

#### 1. Подготовь проект

Создай файл `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node src/app.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Обнови `package.json`:
```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "node src/app.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 2. Deploy на Railway

```bash
# 1. Создай GitHub репозиторий
git init
git add .
git commit -m "Initial commit: TON Shield Backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ton-shield-backend.git
git push -u origin main

# 2. Зайди на railway.app
# - Sign up с GitHub
# - New Project → Deploy from GitHub repo
# - Выбери ton-shield-backend
# - Railway автоматически определит Node.js

# 3. Добавь Environment Variables в Railway dashboard:
```

#### 3. Environment Variables (Railway UI)

Зайди в **Variables** tab и добавь:

```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# TON API (получи новый ключ)
TONAPI_KEY=your_real_tonapi_key_here

# DeepSeek AI (получи новый ключ)
DEEPSEEK_API_KEY=your_real_deepseek_key_here

# Supabase (твои реальные ключи)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### 4. Получи API URL

После deployment:
- Railway даст тебе URL: `https://ton-shield-backend-production.up.railway.app`
- Сохрани этот URL для frontend

#### 5. Тестируй

```bash
# Health check
curl https://ton-shield-backend-production.up.railway.app/health

# Link scanner
curl -X POST https://ton-shield-backend-production.up.railway.app/analyze/link \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 123456789" \
  -d '{"url": "https://ston-fi.io"}'
```

---

## 🔧 Option 2: Render.com (Альтернатива)

### Преимущества:
- ✅ Бесплатный tier (750 часов/месяц)
- ✅ Auto-sleep после 15 минут неактивности
- ✅ GitHub integration
- ✅ Environment variables

### Шаги:

#### 1. Создай `render.yaml`:

```yaml
services:
  - type: web
    name: ton-shield-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node src/app.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: TONAPI_KEY
        sync: false
      - key: DEEPSEEK_API_KEY
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
```

#### 2. Deploy:
- Push на GitHub
- Зайди на render.com
- New → Web Service → Connect GitHub repo
- Render автоматически прочитает `render.yaml`
- Добавь environment variables в UI

---

## 🔧 Option 3: Fly.io (Для продакшена)

### Преимущества:
- ✅ Edge deployment (ближе к пользователям)
- ✅ Бесплатный tier
- ✅ CLI deployment
- ✅ Multi-region support

### Шаги:

```bash
# 1. Установи Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Логин
fly auth login

# 3. Создай app
fly launch

# Fly создаст fly.toml автоматически
# Выбери region: Amsterdam (ams) для Europe/Russia

# 4. Добавь secrets
fly secrets set TONAPI_KEY=your_key
fly secrets set DEEPSEEK_API_KEY=your_key
fly secrets set SUPABASE_URL=your_url
fly secrets set SUPABASE_ANON_KEY=your_key

# 5. Deploy
fly deploy

# 6. Открой app
fly open
```

---

## 📱 Frontend TMA Deployment

### Vercel (Рекомендуется для Next.js)

#### 1. Создай проект Next.js:

```bash
npx create-next-app@latest ton-shield-tma --typescript --tailwind --app
cd ton-shield-tma
```

#### 2. Добавь `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://ton-shield-backend-production.up.railway.app
NEXT_PUBLIC_TON_MANIFEST_URL=https://ton-shield-tma.vercel.app/tonconnect-manifest.json
```

#### 3. Deploy на Vercel:

```bash
# 1. Push на GitHub
git init
git add .
git commit -m "Initial TMA"
git push

# 2. Зайди на vercel.com
# - Import GitHub repo
# - Add Environment Variables (NEXT_PUBLIC_API_URL)
# - Deploy

# Vercel даст URL: https://ton-shield-tma.vercel.app
```

---

## 🔐 Важные шаги после deployment

### 1. Получи новые API ключи

#### TON API:
```bash
# Зайди на https://tonapi.io
# Sign up → Create API key
# Free tier: 1 req/sec, 100K requests/month
```

#### DeepSeek AI:
```bash
# Зайди на https://platform.deepseek.com
# Sign up → API Keys → Create new key
# Free tier: $5 credit
```

### 2. Обнови CORS в `src/app.js`

```javascript
// Добавь production origins
await app.register(cors, {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ton-shield-tma.vercel.app',  // Production TMA
    'https://t.me'  // Telegram WebApp
  ],
  credentials: true
});
```

### 3. Настрой Supabase RLS

Если используешь Supabase, примени SQL из `supabase/dashboard_schema.sql`:

```bash
# Зайди в Supabase Dashboard
# SQL Editor → New Query
# Вставь содержимое dashboard_schema.sql
# Run
```

### 4. Обнови TMA в BotFather

```
/setmenubutton
@your_bot_name
URL: https://ton-shield-tma.vercel.app
Button text: Open TON Shield
```

---

## 🧪 Тестирование production API

### Health Check:
```bash
curl https://your-backend.railway.app/health
```

### Link Scanner с Telegram User ID:
```bash
curl -X POST https://your-backend.railway.app/analyze/link \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 123456789" \
  -d '{"url": "https://example.com"}'
```

### Dashboard:
```bash
curl https://your-backend.railway.app/dashboard/123456789
```

---

## 📊 Мониторинг

### Railway:
- Logs: Railway Dashboard → Deployments → Logs
- Metrics: CPU, Memory, Network usage
- Alerts: Set up в Settings

### Render:
- Logs: Dashboard → Logs tab
- Metrics: Free tier limited

### Vercel (Frontend):
- Analytics: Dashboard → Analytics
- Logs: Dashboard → Deployments → Function Logs

---

## 💰 Стоимость (бесплатные tiers)

| Сервис | Free Tier | Ограничения |
|--------|-----------|-------------|
| **Railway** | $5 credit/месяц | ~500 часов uptime |
| **Render** | 750 часов/месяц | Auto-sleep после 15 мин |
| **Fly.io** | 3 VM по 256MB | Shared CPU |
| **Vercel** | Unlimited | 100GB bandwidth |
| **TON API** | 100K req/месяц | 1 req/sec |
| **DeepSeek** | $5 credit | ~500K tokens |
| **Supabase** | 500MB DB | 2GB bandwidth |

**Итого:** Можно запустить **полностью бесплатно** на несколько месяцев!

---

## ✅ Checklist перед запуском

- [ ] Backend deployed на Railway/Render
- [ ] Environment variables добавлены
- [ ] TONAPI_KEY и DEEPSEEK_API_KEY новые (не из .env.example)
- [ ] Supabase schema применен
- [ ] CORS настроен для production origin
- [ ] Health check проходит
- [ ] API endpoints работают (протестировал через curl)
- [ ] Frontend TMA deployed на Vercel
- [ ] NEXT_PUBLIC_API_URL указывает на production backend
- [ ] TON Connect manifest доступен
- [ ] Telegram Bot настроен с Menu Button
- [ ] Dashboard показывает данные

---

## 🚀 Quick Start (для нетерпеливых)

```bash
# 1. Backend
git add .
git commit -m "Ready for deployment"
git push

# 2. Railway
# - railway.app → New Project → GitHub → Deploy
# - Add environment variables
# - Copy URL

# 3. Frontend
npx create-next-app ton-shield-tma
# Используй промпт из COPILOT_PROMPT_TMA.md
# Deploy на Vercel

# 4. Готово! 🎉
```

---

## 📞 Troubleshooting

### Backend не стартует:
```bash
# Проверь logs в Railway/Render dashboard
# Частые проблемы:
# - Missing environment variables
# - PORT не установлен (Railway auto-assigns)
# - Node version mismatch
```

### 401 ошибки от TON API:
```bash
# Ключ из .env.example expired
# Получи новый на tonapi.io
```

### CORS ошибки:
```bash
# Добавь production URL в cors origin в app.js
# Redeploy backend
```

### Supabase RLS блокирует запросы:
```bash
# Упрости policies (убери auth.uid() для MVP)
# См. исправленный SQL в FINAL_CHECK.md
```

---

## 🎯 Следующие шаги

1. ✅ Deploy backend на Railway
2. ✅ Получи новые API ключи
3. ✅ Протестируй production API
4. ✅ Создай TMA фронтенд (используй COPILOT_PROMPT_TMA.md)
5. ✅ Deploy TMA на Vercel
6. ✅ Настрой Telegram Bot
7. ✅ Launch! 🚀

---

**Рекомендация:** Начни с **Railway для backend** и **Vercel для frontend** — это самый простой стек для старта!
