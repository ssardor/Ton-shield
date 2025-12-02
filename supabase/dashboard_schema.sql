-- TON Shield AI Dashboard Schema
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (linked to Telegram user_id or wallet address)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE,
  wallet_address TEXT,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  is_active BOOLEAN DEFAULT true
);

-- Assessments history (all checks: transaction, jetton, address, link)
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('transaction', 'jetton', 'address', 'link')),
  
  -- Target info
  target_identifier TEXT NOT NULL, -- address, domain, or URL
  
  -- Risk data
  risk_level TEXT NOT NULL CHECK (risk_level IN ('SAFE', 'WARNING', 'CRITICAL')),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  signals JSONB DEFAULT '[]'::jsonb,
  
  -- Full assessment payload (flexible storage)
  assessment_data JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  origin_domain TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for fast queries
  CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- Dashboard statistics (pre-aggregated for performance)
CREATE TABLE IF NOT EXISTS dashboard_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Counters
  total_checks INTEGER DEFAULT 0,
  checks_today INTEGER DEFAULT 0,
  checks_this_week INTEGER DEFAULT 0,
  
  -- Risk breakdown
  safe_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  
  -- Type breakdown
  transaction_checks INTEGER DEFAULT 0,
  jetton_checks INTEGER DEFAULT 0,
  address_checks INTEGER DEFAULT 0,
  link_checks INTEGER DEFAULT 0,
  
  -- Timestamps
  last_check_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_counts CHECK (
    total_checks >= 0 AND
    safe_count >= 0 AND
    warning_count >= 0 AND
    critical_count >= 0
  )
);

-- API keys for authentication (optional for MVP)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,
  key_preview TEXT NOT NULL, -- first/last 4 chars for display
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 100, -- requests per hour
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessments_risk_level ON assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_assessments_user_created ON assessments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text OR telegram_id = (SELECT telegram_id FROM users WHERE id::text = auth.uid()::text));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Assessments: users can view their own
CREATE POLICY "Users can view own assessments"
  ON assessments FOR SELECT
  USING (user_id::text = auth.uid()::text OR user_id IN (SELECT id FROM users WHERE telegram_id = (SELECT telegram_id FROM users WHERE id::text = auth.uid()::text)));

CREATE POLICY "Users can insert own assessments"
  ON assessments FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text OR user_id IN (SELECT id FROM users WHERE telegram_id = (SELECT telegram_id FROM users WHERE id::text = auth.uid()::text)));

-- Dashboard stats: users can view their own
CREATE POLICY "Users can view own stats"
  ON dashboard_stats FOR SELECT
  USING (user_id::text = auth.uid()::text OR user_id IN (SELECT id FROM users WHERE telegram_id = (SELECT telegram_id FROM users WHERE id::text = auth.uid()::text)));

CREATE POLICY "Users can update own stats"
  ON dashboard_stats FOR UPDATE
  USING (user_id::text = auth.uid()::text);

-- API keys: users can manage their own
CREATE POLICY "Users can view own api keys"
  ON api_keys FOR SELECT
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own api keys"
  ON api_keys FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Function to update dashboard stats after assessment insert
CREATE OR REPLACE FUNCTION update_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update stats
  INSERT INTO dashboard_stats (user_id, total_checks, last_check_at, updated_at)
  VALUES (NEW.user_id, 1, NEW.created_at, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_checks = dashboard_stats.total_checks + 1,
    checks_today = CASE
      WHEN DATE(dashboard_stats.last_check_at) = CURRENT_DATE THEN dashboard_stats.checks_today + 1
      ELSE 1
    END,
    checks_this_week = CASE
      WHEN dashboard_stats.last_check_at >= CURRENT_DATE - INTERVAL '7 days' THEN dashboard_stats.checks_this_week + 1
      ELSE 1
    END,
    safe_count = dashboard_stats.safe_count + CASE WHEN NEW.risk_level = 'SAFE' THEN 1 ELSE 0 END,
    warning_count = dashboard_stats.warning_count + CASE WHEN NEW.risk_level = 'WARNING' THEN 1 ELSE 0 END,
    critical_count = dashboard_stats.critical_count + CASE WHEN NEW.risk_level = 'CRITICAL' THEN 1 ELSE 0 END,
    transaction_checks = dashboard_stats.transaction_checks + CASE WHEN NEW.assessment_type = 'transaction' THEN 1 ELSE 0 END,
    jetton_checks = dashboard_stats.jetton_checks + CASE WHEN NEW.assessment_type = 'jetton' THEN 1 ELSE 0 END,
    address_checks = dashboard_stats.address_checks + CASE WHEN NEW.assessment_type = 'address' THEN 1 ELSE 0 END,
    link_checks = dashboard_stats.link_checks + CASE WHEN NEW.assessment_type = 'link' THEN 1 ELSE 0 END,
    last_check_at = NEW.created_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats
DROP TRIGGER IF EXISTS trigger_update_dashboard_stats ON assessments;
CREATE TRIGGER trigger_update_dashboard_stats
  AFTER INSERT ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_stats();

-- Function to get user dashboard summary
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_id', p_user_id,
    'stats', (SELECT row_to_json(ds) FROM dashboard_stats ds WHERE ds.user_id = p_user_id),
    'recent_critical', (
      SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
      FROM (
        SELECT id, assessment_type, target_identifier, risk_level, risk_score, created_at
        FROM assessments
        WHERE user_id = p_user_id AND risk_level = 'CRITICAL'
        ORDER BY created_at DESC
        LIMIT 5
      ) a
    ),
    'risk_timeline', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) FILTER (WHERE risk_level = 'SAFE') as safe,
          COUNT(*) FILTER (WHERE risk_level = 'WARNING') as warning,
          COUNT(*) FILTER (WHERE risk_level = 'CRITICAL') as critical
        FROM assessments
        WHERE user_id = p_user_id AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
        LIMIT 30
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (optional - comment out for production)
-- INSERT INTO users (telegram_id, username, subscription_tier) 
-- VALUES (123456789, 'test_user', 'free')
-- ON CONFLICT (telegram_id) DO NOTHING;

COMMENT ON TABLE users IS 'TON Shield users linked via Telegram or wallet';
COMMENT ON TABLE assessments IS 'History of all security assessments';
COMMENT ON TABLE dashboard_stats IS 'Pre-aggregated statistics for dashboard performance';
COMMENT ON TABLE api_keys IS 'API authentication keys for extension and external access';
