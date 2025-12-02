# 📋 TON Shield API - Быстрая Шпаргалка

## 🚀 Быстрый Старт

```bash
# 1. Базовый URL
const API = 'http://localhost:3000';

# 2. Проверка транзакции
POST /analyze/transaction
{
  "user_wallet": "UQ...",
  "target_address": "EQ...",
  "amount_nanoton": "5000000000"
}

# 3. Проверка адреса
GET /analyze/address/UQD1Lp1Kcm...

# 4. Проверка токена
GET /analyze/jetton/EQAvlWFDxGF2...

# 5. Проверка ссылки
POST /analyze/link
{ "url": "https://ston.fi" }

# 6. Dashboard
GET /dashboard/:userId
GET /history/:userId
GET /stats/:userId
```

---

## 📊 Структура Ответа

```typescript
// Все успешные ответы
{
  "status": "ok",
  "data": { ... }
}

// Ошибки
{
  "error": "ERROR_CODE",
  "message": "Description"
}
```

---

## 🎯 Risk Levels

```
SAFE      (0-39)   ✅ Безопасно
WARNING   (40-79)  ⚠️ Осторожно
CRITICAL  (80-100) 🚨 Опасно
```

---

## 🔑 Опциональный Заголовок

```
X-User-ID: <telegram_user_id>
```
Автоматически сохраняет результат в историю пользователя.

---

## ⚡ Примеры Кода

### React Hook
```tsx
const useAnalyzeTransaction = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async (data, userId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/analyze/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'X-User-ID': userId }),
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      setResult(json.data);
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, result };
};
```

### Telegram Mini App
```tsx
import { useTonAddress } from '@tonconnect/ui-react';

const CheckBeforeSend = () => {
  const userAddress = useTonAddress();
  const userId = window.Telegram.WebApp.initDataUnsafe.user?.id;

  const checkAndSend = async (to, amount) => {
    const res = await fetch(`${API}/analyze/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
      },
      body: JSON.stringify({
        user_wallet: userAddress,
        target_address: to,
        amount_nanoton: amount,
      }),
    });

    const { data } = await res.json();
    
    if (data.risk_level === 'CRITICAL') {
      if (!confirm(`⚠️ ${data.ai_explanation}\n\nContinue?`)) {
        return;
      }
    }

    // Send transaction...
  };
};
```

---

## 🎨 UI Components

### Risk Badge
```tsx
const RiskBadge = ({ level }) => {
  const colors = {
    SAFE: 'bg-green-100 text-green-800',
    WARNING: 'bg-yellow-100 text-yellow-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };

  const icons = {
    SAFE: '✅',
    WARNING: '⚠️',
    CRITICAL: '🚨',
  };

  return (
    <span className={`px-3 py-1 rounded ${colors[level]}`}>
      {icons[level]} {level}
    </span>
  );
};
```

### Transaction Alert
```tsx
const TransactionAlert = ({ analysis }) => {
  if (analysis.risk_level === 'SAFE') return null;

  return (
    <div className={`alert ${analysis.risk_level.toLowerCase()}`}>
      <h4>{analysis.risk_level === 'CRITICAL' ? '🚨 High Risk' : '⚠️ Warning'}</h4>
      <p>{analysis.ai_explanation}</p>
      <ul>
        {analysis.signals.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
};
```

---

## 🔍 Полезные Паттерны

### Проверка перед отправкой
```typescript
async function safeSend(to: string, amount: string) {
  // 1. Проверить риски
  const check = await analyzeTransaction({
    user_wallet: myAddress,
    target_address: to,
    amount_nanoton: amount,
  });

  // 2. Показать предупреждение
  if (check.risk_level !== 'SAFE') {
    const confirmed = await showWarningDialog(check);
    if (!confirmed) return;
  }

  // 3. Отправить транзакцию
  await sendTransaction({ to, amount });
}
```

### Проверка ссылки
```typescript
async function checkLink(url: string) {
  const res = await analyzeLink(url);
  
  if (res.risk_level === 'CRITICAL') {
    return {
      safe: false,
      message: res.ai_summary,
      signals: res.signals,
    };
  }
  
  return { safe: true };
}
```

### Dashboard загрузка
```typescript
async function loadDashboard(userId: string) {
  const [summary, history] = await Promise.all([
    fetch(`${API}/dashboard/${userId}`).then(r => r.json()),
    fetch(`${API}/history/${userId}?limit=20`).then(r => r.json()),
  ]);

  return {
    stats: summary.data.stats,
    critical: summary.data.recent_critical,
    timeline: summary.data.risk_timeline,
    history: history.data.items,
  };
}
```

---

## 🐛 Обработка Ошибок

```typescript
async function safeAnalyze(data) {
  try {
    const res = await fetch(`${API}/analyze/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      
      if (error.error === 'VALIDATION_ERROR') {
        showToast('Please check your input');
        return null;
      }
      
      if (error.error === 'UPSTREAM_ERROR') {
        showToast('Service temporarily unavailable');
        return null;
      }
      
      throw new Error(error.message);
    }

    return await res.json();
  } catch (err) {
    console.error('Analysis failed:', err);
    showToast('Something went wrong');
    return null;
  }
}
```

---

## 📦 Пример API Service

```typescript
// services/tonShield.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class TonShieldAPI {
  private async request(endpoint: string, options?: RequestInit) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }

    const data = await res.json();
    return data.data;
  }

  async analyzeTransaction(data: any, userId?: string) {
    return this.request('/analyze/transaction', {
      method: 'POST',
      headers: userId ? { 'X-User-ID': userId } : {},
      body: JSON.stringify(data),
    });
  }

  async analyzeAddress(address: string, userId?: string) {
    return this.request(`/analyze/address/${address}`, {
      headers: userId ? { 'X-User-ID': userId } : {},
    });
  }

  async analyzeJetton(address: string, userId?: string) {
    return this.request(`/analyze/jetton/${address}`, {
      headers: userId ? { 'X-User-ID': userId } : {},
    });
  }

  async analyzeLink(url: string, userId?: string) {
    return this.request('/analyze/link', {
      method: 'POST',
      headers: userId ? { 'X-User-ID': userId } : {},
      body: JSON.stringify({ url }),
    });
  }

  async getDashboard(userId: string) {
    return this.request(`/dashboard/${userId}`);
  }

  async getHistory(userId: string, params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/history/${userId}${query ? '?' + query : ''}`);
  }

  async getStats(userId: string) {
    return this.request(`/stats/${userId}`);
  }
}

export const tonShield = new TonShieldAPI();
```

---

## 📱 Полная Документация

**👉 [docs/FRONTEND_API_GUIDE.md](../FRONTEND_API_GUIDE.md)**

---

**Быстрого старта! 🚀**
