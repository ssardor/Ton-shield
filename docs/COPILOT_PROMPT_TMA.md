# 🤖 Prompt для GitHub Copilot: TON Shield Telegram Mini App

## Контекст Проекта

Я разрабатываю **TON Shield Telegram Mini App** — приложение для проверки безопасности транзакций, токенов и ссылок в блокчейне TON. У меня уже готов полноценный backend API, и мне нужно создать современный Telegram Mini App фронтенд.

---

## 🎯 Задача

Создай полноценный **Telegram Mini App** на **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**, который интегрируется с моим существующим backend API и использует TON Connect для работы с кошельком пользователя.

---

## 🏗️ Технический Стек

### Frontend:
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (строгая типизация)
- **Styling:** Tailwind CSS + shadcn/ui компоненты
- **State Management:** React Context API + hooks
- **TON Integration:** @tonconnect/ui-react
- **API Client:** fetch API с TypeScript типами
- **Charts:** Recharts для графиков статистики
- **Icons:** Lucide React
- **Telegram:** @twa-dev/sdk для Telegram WebApp API

### Backend API (уже готов):
- **Base URL:** `http://localhost:3000` (dev), переменная окружения `NEXT_PUBLIC_API_URL` для production
- **Документация:** `/docs/FRONTEND_API_GUIDE.md`
- **Эндпоинты:** Transaction analysis, Address check, Jetton analysis, Link scanner, Dashboard, History

---

## 📋 Требования к Приложению

### 1. Структура Проекта

```
ton-shield-tma/
├── app/
│   ├── layout.tsx              # Root layout с Telegram provider
│   ├── page.tsx                # Home/Scanner page
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard с историей
│   ├── check/
│   │   ├── transaction/page.tsx
│   │   ├── address/page.tsx
│   │   ├── jetton/page.tsx
│   │   └── link/page.tsx
│   └── settings/
│       └── page.tsx
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── RiskBadge.tsx
│   ├── TransactionCard.tsx
│   ├── HistoryList.tsx
│   ├── StatsOverview.tsx
│   ├── RiskChart.tsx
│   └── Navigation.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts           # API client с типизацией
│   │   └── types.ts            # API типы из документации
│   ├── hooks/
│   │   ├── useAnalyze.ts
│   │   ├── useDashboard.ts
│   │   └── useTelegram.ts
│   └── utils.ts
├── providers/
│   ├── TonConnectProvider.tsx
│   └── TelegramProvider.tsx
└── public/
```

### 2. Ключевые Экраны

#### A. Home Screen (Scanner)
- **URL:** `/`
- **Функционал:**
  - Quick actions: Scan Link, Check Transaction, Analyze Jetton
  - Recent activity preview (последние 3 проверки)
  - TON Connect wallet button
  - Telegram user info (avatar, username)
- **Компоненты:**
  - Quick action cards с иконками
  - Mini stats (total checks, critical alerts today)
  - CTA buttons с градиентами

#### B. Dashboard Screen
- **URL:** `/dashboard`
- **Функционал:**
  - Статистика: total checks, safe/warning/critical breakdown
  - Risk timeline график (30 дней)
  - Список последних критических находок
  - Фильтры по типу (transaction/jetton/address/link)
- **API Calls:**
  - `GET /dashboard/:userId` при загрузке
  - Auto-refresh каждые 30 секунд
- **Компоненты:**
  - Stats cards с процентами
  - Line chart для timeline
  - Scrollable list критических находок

#### C. Link Scanner Screen
- **URL:** `/check/link`
- **Функционал:**
  - Input поле для URL
  - Real-time validation URL формата
  - Scan button
  - Результат с risk level, signals, AI summary
  - Share button (Telegram share)
- **API Calls:**
  - `POST /analyze/link` с URL и `X-User-ID` заголовком
- **UX:**
  - Показывать loading spinner во время анализа
  - Success animation при SAFE
  - Warning modal при WARNING/CRITICAL

#### D. Transaction Check Screen
- **URL:** `/check/transaction`
- **Функционал:**
  - Auto-fill user wallet через TON Connect
  - Input для target address
  - Input для amount (с конвертацией TON ↔ nanoton)
  - Optional: origin domain input
  - Analyze button
  - Результат с детальным breakdown
  - "Proceed anyway" / "Cancel" buttons
- **API Calls:**
  - `POST /analyze/transaction`
- **Интеграция:**
  - TON Connect для получения user address
  - Validation addresses через ton/core

#### E. Address Check Screen
- **URL:** `/check/address`
- **Функционал:**
  - Input или QR scanner для адреса
  - Analyze button
  - Результат: risk level, account info, balance
  - History кнопка (все проверки этого адреса)
- **API Calls:**
  - `GET /analyze/address/:address`

#### F. Jetton Analysis Screen
- **URL:** `/check/jetton`
- **Функционал:**
  - Input для jetton master address
  - Search популярных токенов (preset buttons: USDT, NOT, etc.)
  - Analyze button
  - Результат: metadata, holder count, admin info, honeypot warning
  - "Add to watchlist" feature (local storage)
- **API Calls:**
  - `GET /analyze/jetton/:address`

#### G. History Screen (в Dashboard)
- **URL:** `/dashboard` (tab или section)
- **Функционал:**
  - Infinite scroll список всех проверок
  - Фильтры: type, risk level
  - Search by target address
  - Pull-to-refresh
- **API Calls:**
  - `GET /history/:userId?limit=20&offset=0`
  - Load more при scroll

#### H. Settings Screen
- **URL:** `/settings`
- **Функционал:**
  - User info (Telegram avatar, name, user_id)
  - Notifications toggles
  - Language selection (если multi-lang)
  - About / Version info
  - Disconnect wallet button
  - Clear history button

---

## 🔧 Технические Требования

### 1. API Client (`lib/api/client.ts`)

```typescript
// Создай полноценный API client с:
// - Типизацией всех endpoints
// - Error handling (VALIDATION_ERROR, UPSTREAM_ERROR)
// - Автоматическое добавление X-User-ID из Telegram
// - Retry логика для network errors
// - Request/response interceptors

interface ApiClient {
  analyzeTransaction(data: TransactionRequest): Promise<TransactionResponse>;
  analyzeAddress(address: string): Promise<AddressResponse>;
  analyzeJetton(address: string): Promise<JettonResponse>;
  analyzeLink(url: string): Promise<LinkResponse>;
  getDashboard(userId: string): Promise<DashboardResponse>;
  getHistory(userId: string, params?: HistoryParams): Promise<HistoryResponse>;
  getStats(userId: string): Promise<StatsResponse>;
}
```

### 2. API Types (`lib/api/types.ts`)

```typescript
// Импортируй все типы из документации:
// - RiskLevel = 'SAFE' | 'WARNING' | 'CRITICAL'
// - AssessmentType = 'transaction' | 'jetton' | 'address' | 'link'
// - Все Request/Response интерфейсы из FRONTEND_API_GUIDE.md
```

### 3. Telegram Integration (`lib/hooks/useTelegram.ts`)

```typescript
// Создай hook для Telegram WebApp:
// - Получение user данных (id, username, photo_url)
// - MainButton control
// - BackButton control
// - HapticFeedback
// - Theme colors (bg_color, text_color)
// - Share функция
```

### 4. TON Connect Integration

```typescript
// Используй @tonconnect/ui-react:
// - TonConnectUIProvider в root layout
// - useTonConnectUI hook для UI
// - useTonAddress для получения адреса
// - useTonWallet для wallet info
// - Disconnect функция
```

### 5. Темизация (Telegram Theme)

```typescript
// Используй Telegram theme colors:
const theme = {
  bg: window.Telegram.WebApp.backgroundColor,
  text: window.Telegram.WebApp.textColor,
  button: window.Telegram.WebApp.buttonColor,
  buttonText: window.Telegram.WebApp.buttonTextColor,
  // Fallback к default values если WebApp не доступен
};

// Интегрируй с Tailwind через CSS variables
```

---

## 🎨 UI/UX Требования

### Design System:

1. **Colors (Risk Levels):**
   - SAFE: Green (#10b981, #d1fae5)
   - WARNING: Amber (#f59e0b, #fef3c7)
   - CRITICAL: Red (#ef4444, #fee2e2)

2. **Typography:**
   - Font: System font (San Francisco на iOS, Roboto на Android)
   - Sizes: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl

3. **Components:**
   - Cards с shadow-sm и rounded-lg
   - Buttons: Primary (gradient), Secondary (outline), Danger (red)
   - Inputs: Border на focus, error states
   - Badges: Pill shape для risk levels
   - Icons: Lucide React (consistent размеры 20px, 24px)

4. **Animations:**
   - Fade in для modals
   - Slide up для bottom sheets
   - Skeleton loaders для async content
   - Success checkmark animation
   - Error shake animation

5. **Responsive:**
   - Mobile-first (большинство юзеров на мобилках)
   - Поддержка landscape orientation
   - Safe area insets для iOS notch

---

## 📊 Приоритеты Разработки

### Phase 1 (MVP):
1. ✅ Project setup (Next.js + TypeScript + Tailwind)
2. ✅ API client с типизацией
3. ✅ Telegram provider (user_id extraction)
4. ✅ TON Connect integration
5. ✅ Link Scanner screen (основной use case)
6. ✅ Dashboard с basic stats
7. ✅ History list

### Phase 2 (Extended):
8. ✅ Transaction Check screen
9. ✅ Address Check screen
10. ✅ Jetton Analysis screen
11. ✅ Settings screen
12. ✅ Advanced filters в History

### Phase 3 (Polish):
13. ✅ Animations и transitions
14. ✅ Error boundaries
15. ✅ Offline support (Service Worker)
16. ✅ Performance optimization
17. ✅ Analytics (plausible или similar)

---

## 🔐 Безопасность

1. **Environment Variables:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_TON_MANIFEST_URL=https://yourapp.com/tonconnect-manifest.json
   ```

2. **Input Validation:**
   - Валидируй все user inputs перед отправкой в API
   - Sanitize URL inputs
   - Validate TON addresses format

3. **Error Handling:**
   - Never expose API errors пользователю
   - Log errors в console.error для debugging
   - Show user-friendly messages

---

## 📱 Telegram Mini App Setup

### `tonconnect-manifest.json`:
```json
{
  "url": "https://yourapp.com",
  "name": "TON Shield AI",
  "iconUrl": "https://yourapp.com/icon.png",
  "termsOfUseUrl": "https://yourapp.com/terms",
  "privacyPolicyUrl": "https://yourapp.com/privacy"
}
```

### Telegram Bot Commands:
```
start - Открыть TON Shield
scan - Проверить ссылку
dashboard - Посмотреть статистику
help - Помощь
```

---

## 🧪 Testing Requirements

1. **Unit Tests:**
   - API client functions
   - Utility functions (address validation, formatting)
   - Custom hooks

2. **Integration Tests:**
   - API calls с mock responses
   - User flows (scan link → view result)

3. **E2E Tests:**
   - Critical path: Link scan
   - Dashboard load
   - Transaction check

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tonconnect/ui-react": "^2.0.0",
    "@twa-dev/sdk": "^7.0.0",
    "@ton/core": "^0.56.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.294.0",
    "recharts": "^2.10.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 🎯 Дополнительные Фичи (Nice to Have)

1. **QR Scanner:**
   - Scan TON addresses через camera
   - Library: `react-qr-scanner`

2. **Share Results:**
   - Share результаты проверки в Telegram
   - Deep links: `tg://resolve?domain=tonshield&start=check_<id>`

3. **Notifications:**
   - Push notifications при критических находках
   - Telegram Bot integration

4. **Watchlist:**
   - Save addresses для мониторинга
   - Local storage или backend API

5. **Multi-language:**
   - i18n support (EN, RU)
   - Detect Telegram language

---

## 📚 Документация Backend API

**Полная документация:** `/docs/FRONTEND_API_GUIDE.md`

**Основные эндпоинты:**

```typescript
// Transaction Analysis
POST /analyze/transaction
Body: { user_wallet, target_address, amount_nanoton?, payload_boc?, origin_domain? }
Header: X-User-ID: <telegram_user_id>

// Address Check
GET /analyze/address/:address
Header: X-User-ID: <telegram_user_id>

// Jetton Analysis
GET /analyze/jetton/:address
Header: X-User-ID: <telegram_user_id>

// Link Scanner
POST /analyze/link
Body: { url }
Header: X-User-ID: <telegram_user_id>

// Dashboard
GET /dashboard/:userId
Response: { stats, recent_critical, risk_timeline }

// History
GET /history/:userId?limit=20&offset=0&type=transaction&risk_level=CRITICAL
Response: { items[], total, limit, offset }

// Stats
GET /stats/:userId
Response: { total_checks, checks_today, safe_count, warning_count, critical_count, ... }
```

**Risk Levels:**
- `SAFE` (0-39) ✅
- `WARNING` (40-79) ⚠️
- `CRITICAL` (80-100) 🚨

---

## ✅ Acceptance Criteria

Приложение считается готовым когда:

1. ✅ Все экраны реализованы и работают
2. ✅ API интеграция работает с real backend
3. ✅ TON Connect подключается и показывает wallet
4. ✅ Telegram user_id извлекается корректно
5. ✅ Link Scanner сканирует и показывает результаты
6. ✅ Dashboard отображает статистику
7. ✅ History показывает проверки с пагинацией
8. ✅ Error handling работает (offline, API errors)
9. ✅ UI responsive на всех размерах экранов
10. ✅ Анимации smooth и не лагают
11. ✅ TypeScript без any типов
12. ✅ Build проходит без warnings

---

## 🚀 Getting Started Command

```bash
npx create-next-app@latest ton-shield-tma --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd ton-shield-tma
npm install @tonconnect/ui-react @twa-dev/sdk @ton/core lucide-react recharts zustand react-hook-form zod
```

---

## 💡 Best Practices

1. **Code Quality:**
   - Используй TypeScript строго (no `any`)
   - ESLint + Prettier конфигурация
   - Комментарии для сложной логики

2. **Performance:**
   - React.memo для дорогих компонентов
   - useMemo/useCallback где нужно
   - Lazy loading для routes
   - Image optimization через next/image

3. **Accessibility:**
   - Semantic HTML
   - ARIA labels для кнопок
   - Keyboard navigation
   - Focus management

4. **Git:**
   - Meaningful commit messages
   - Feature branches
   - PR reviews (если команда)

---

## 📞 Поддержка

При возникновении вопросов:
1. Проверь `/docs/FRONTEND_API_GUIDE.md`
2. Посмотри `/docs/QUICK_REFERENCE.md`
3. Протестируй API через `/docs/CURL_EXAMPLES.md`

---

**Начинай с Phase 1 (MVP) и постепенно добавляй фичи. Удачи! 🚀**
