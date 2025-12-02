# TON Shield AI — Dashboard & History Setup Guide

## 📋 Supabase Configuration

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose project name: `ton-shield-ai`
4. Set strong database password
5. Select region (closest to your users)
6. Click "Create new project"

### Step 2: Execute Database Schema

1. In your Supabase dashboard, navigate to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/dashboard_schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** or press `Ctrl+Enter`

This will create:
- ✅ `users` table (Telegram ID or wallet address)
- ✅ `assessments` table (all security check history)
- ✅ `dashboard_stats` table (pre-aggregated statistics)
- ✅ `api_keys` table (for future authentication)
- ✅ Auto-update triggers for statistics
- ✅ RLS (Row Level Security) policies
- ✅ Helper function `get_dashboard_summary()`

### Step 3: Get Your Credentials

In Supabase dashboard:
1. Go to **Settings → API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`

### Step 4: Configure Backend

Create `.env` file (copy from `.env.example`):

```bash
# Supabase Configuration
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 5: Test Connection

Start the backend:
```bash
npm run dev
```

Check logs — you should NOT see:
```
"Supabase credentials missing — persistence disabled"
```

## 🎯 Dashboard API Endpoints

### 1. Get Full Dashboard Summary
```bash
GET /dashboard/:userId
```

Returns:
```json
{
  "status": "ok",
  "data": {
    "user_id": "uuid-here",
    "stats": {
      "total_checks": 42,
      "checks_today": 5,
      "checks_this_week": 18,
      "safe_count": 25,
      "warning_count": 12,
      "critical_count": 5,
      "transaction_checks": 20,
      "jetton_checks": 10,
      "address_checks": 8,
      "link_checks": 4
    },
    "recent_critical": [ /* last 5 CRITICAL findings */ ],
    "risk_timeline": [ /* 30-day risk breakdown */ ]
  }
}
```

### 2. Get Assessment History
```bash
GET /history/:userId?limit=20&offset=0&type=transaction&risk_level=CRITICAL
```

Query params:
- `limit` (default 20) — results per page
- `offset` (default 0) — pagination offset
- `type` — filter by `transaction`, `jetton`, `address`, `link`
- `risk_level` — filter by `SAFE`, `WARNING`, `CRITICAL`

Returns:
```json
{
  "status": "ok",
  "data": {
    "items": [ /* assessment records */ ],
    "total": 156,
    "limit": 20,
    "offset": 0
  }
}
```

### 3. Get Quick Stats Only
```bash
GET /stats/:userId
```

Faster than full dashboard — just returns the stats object.

## 🔐 Auto-Save to History

All `analyze/*` endpoints accept optional header:
```bash
X-User-ID: <user-uuid>
```

Example:
```bash
curl -X POST http://localhost:3000/analyze/transaction \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 123e4567-e89b-12d3-a456-426614174000" \
  -d '{
    "user_wallet": "EQ...",
    "target_address": "EQ...",
    "amount_nanoton": "1000000000"
  }'
```

The assessment will be:
1. ✅ Returned in response
2. ✅ Saved to `assessments` table
3. ✅ Automatically update `dashboard_stats` via trigger

## 🧪 Testing the Dashboard

### Create Test User

In Supabase SQL Editor:
```sql
INSERT INTO users (telegram_id, username, subscription_tier) 
VALUES (123456789, 'test_user', 'free')
RETURNING id;
```

Copy the returned UUID.

### Run Some Checks

```bash
# Transaction check
curl -X POST http://localhost:3000/analyze/transaction \
  -H "Content-Type: application/json" \
  -H "X-User-ID: YOUR_UUID_HERE" \
  -d '{"user_wallet": "EQTest", "target_address": "EQTarget"}'

# Link check
curl -X POST http://localhost:3000/analyze/link \
  -H "Content-Type: application/json" \
  -H "X-User-ID: YOUR_UUID_HERE" \
  -d '{"url": "https://ston-fi-drop.com"}'
```

### View Dashboard

```bash
curl http://localhost:3000/dashboard/YOUR_UUID_HERE | jq
```

You should see:
- `total_checks: 2`
- `transaction_checks: 1`
- `link_checks: 1`
- Recent critical findings (if any were CRITICAL)

## 📊 Dashboard Stats Auto-Update

The `update_dashboard_stats()` trigger runs after every insert to `assessments`:

- ✅ Increments `total_checks`
- ✅ Updates `checks_today` (resets daily)
- ✅ Updates `checks_this_week` (rolling 7 days)
- ✅ Increments risk level counters (safe/warning/critical)
- ✅ Increments type counters (transaction/jetton/address/link)
- ✅ Updates `last_check_at` timestamp

**No manual updates needed!**

## 🔒 Row Level Security (RLS)

Users can only:
- ✅ View their own profile
- ✅ View their own assessments
- ✅ View their own stats
- ✅ Insert their own assessments

Service role key (backend) bypasses RLS for admin operations.

## 🚀 Production Checklist

Before deploying:

1. ✅ Enable Supabase RLS on all tables
2. ✅ Use environment variables for credentials
3. ✅ Set up Supabase backups (automatic in paid plan)
4. ✅ Monitor Supabase dashboard for usage/errors
5. ✅ Add indexes if query performance degrades
6. ✅ Consider rate limiting on dashboard endpoints
7. ✅ Set up Supabase Edge Functions for complex queries (optional)

## 📈 Scaling Considerations

Current schema handles:
- **Users:** Unlimited (indexed by telegram_id, wallet_address)
- **Assessments:** 10M+ records with good performance
- **Dashboard stats:** O(1) lookups (pre-aggregated)

If you exceed 1M assessments per user:
- Consider partitioning `assessments` table by date
- Archive old assessments to separate table
- Use materialized views for complex analytics

## 💡 Tips

**Get user by Telegram ID:**
```sql
SELECT * FROM users WHERE telegram_id = 123456789;
```

**Manually update stats:**
```sql
SELECT update_dashboard_stats() FROM assessments WHERE id = 'assessment-uuid';
```

**View recent critical findings:**
```sql
SELECT * FROM assessments 
WHERE user_id = 'user-uuid' AND risk_level = 'CRITICAL'
ORDER BY created_at DESC
LIMIT 10;
```

**Check trigger execution:**
```sql
SELECT * FROM dashboard_stats WHERE user_id = 'user-uuid';
```

---

## 🎉 Ready for Frontend!

Your backend now has:
- ✅ Full risk analysis (transaction/jetton/address/link)
- ✅ Persistent history with Supabase
- ✅ Real-time dashboard updates
- ✅ Pagination and filtering
- ✅ Secure RLS policies

Next steps:
1. Build Telegram Mini App UI
2. Build Chrome Extension
3. Integrate with TON Connect
4. Add subscription tiers (free vs premium)
