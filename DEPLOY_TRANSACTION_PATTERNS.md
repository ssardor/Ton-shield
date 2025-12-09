# Deployment Instructions - Transaction Pattern Analysis Update

## Quick Deploy to Render.com

### Option 1: Automatic (Git Push)
```bash
# Commit changes
git add .
git commit -m "feat: Add transaction pattern analysis to address endpoint"
git push origin main
```

Render автоматически задеплоит обновление в течение 2-3 минут.

### Option 2: Manual Deploy
1. Open https://dashboard.render.com
2. Select `ton-shield` service
3. Click **Manual Deploy** → **Deploy latest commit**
4. Wait 2-3 minutes

## Verify Deployment

### 1. Health Check
```bash
curl https://ton-shield.onrender.com/health
```

Expected: `{"status":"ok"}`

### 2. Test Transaction Analysis
```bash
# Test with known drainer victim
curl https://ton-shield.onrender.com/analyze/address/UQB2T1kMgDeXo0PY6vTK76iufMYUwWZX_Xi9g2hTwS_CBtuk | jq '.data.transaction_analysis'
```

Expected output:
```json
{
  "total_analyzed": 10,
  "suspicious_patterns": [
    "high_failure_rate",
    "all_failed",
    "failed_outgoing_transfers"
  ],
  "risk_indicators": [
    "High transaction failure rate: 100%",
    "All recent transactions failed - possible drainer victim",
    "Multiple failed outgoing transfers - possible drainer attack"
  ]
}
```

### 3. Check Risk Score Adjustment
```bash
curl https://ton-shield.onrender.com/analyze/address/UQB2T1kMgDeXo0PY6vTK76iufMYUwWZX_Xi9g2hTwS_CBtuk | jq '.data | {risk_level, risk_score, signals}'
```

Expected:
```json
{
  "risk_level": "WARNING",
  "risk_score": 60,
  "signals": [
    "Balance below 0.01 TON",
    "High transaction failure rate: 100%",
    "All recent transactions failed - possible drainer victim",
    "Multiple failed outgoing transfers - possible drainer attack"
  ]
}
```

## Environment Variables (Already Set)

✅ No new environment variables required
✅ Existing `TONAPI_KEY` is sufficient

## Breaking Changes

⚠️ **NONE** - This is a backward-compatible update

### Added Fields (Non-Breaking)
```json
{
  "transaction_analysis": {
    "total_analyzed": number,
    "suspicious_patterns": string[],
    "risk_indicators": string[]
  }
}
```

Старые клиенты могут игнорировать новое поле без проблем.

## Performance Impact

- **Latency**: +100-200ms (один дополнительный API вызов)
- **TON API Calls**: +1 per address check
- **Memory**: Negligible
- **CPU**: <50ms pattern analysis

## Rollback (если нужно)

```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

Или через Render Dashboard:
1. Go to **Deploys** tab
2. Find previous successful deploy
3. Click **Redeploy**

## Frontend Integration

### Update TypeScript Types
```typescript
interface AddressAnalysisResponse {
  address: string;
  risk_level: 'SAFE' | 'WARNING' | 'CRITICAL';
  risk_score: number;
  signals: string[];
  account: AccountInfo | null;
  recent_transactions: Transaction[];
  transaction_analysis: {  // NEW
    total_analyzed: number;
    suspicious_patterns: string[];
    risk_indicators: string[];
  };
  ai_explanation: string;
}
```

### Display Patterns
```tsx
function AddressCheck({ address }: { address: string }) {
  const { data } = useQuery(['address', address], () =>
    fetch(`https://ton-shield.onrender.com/analyze/address/${address}`)
      .then(r => r.json())
  );

  const { transaction_analysis, risk_level } = data?.data || {};

  return (
    <div>
      <RiskBadge level={risk_level} />
      
      {transaction_analysis?.suspicious_patterns.length > 0 && (
        <Alert severity="warning">
          <strong>⚠️ Suspicious Patterns Detected</strong>
          <ul>
            {transaction_analysis.risk_indicators.map((indicator, i) => (
              <li key={i}>{indicator}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  );
}
```

## Monitoring

### Check Render Logs
```bash
# Via Render Dashboard
1. Go to https://dashboard.render.com
2. Select ton-shield service
3. Click "Logs" tab
4. Search for "analyzeTransactionPatterns"
```

### Key Metrics to Watch
- **Failed TON API calls**: Look for "Failed to fetch recent transactions"
- **Pattern detection rate**: How many addresses trigger patterns
- **Response times**: Should remain <2s for address checks

## Support

### If something goes wrong:

1. **Check Logs**:
   - Render Dashboard → Logs
   - Look for errors in `RiskEngine.analyzeTransactionPatterns()`

2. **Verify TON API**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TONAPI_KEY" \
     https://tonapi.io/v2/accounts/UQB2T1kMgDeXo0PY6vTK76iufMYUwWZX_Xi9g2hTwS_CBtuk/events?limit=10
   ```

3. **Test Locally**:
   ```bash
   node src/app.js
   curl http://localhost:3000/analyze/address/ADDRESS
   ```

4. **Rollback** (see above)

---

**Update Date**: December 9, 2025  
**Version**: Backend v1.1.0  
**Deploy Time**: ~3 minutes
