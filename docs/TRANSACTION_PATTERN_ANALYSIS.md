# Transaction Pattern Analysis

## Overview

TON Shield automatically analyzes the last 10 transactions of any wallet address to detect suspicious patterns that may indicate:
- **Drainer attacks** (failed outgoing transfers)
- **Bot/spam activity** (rapid transaction bursts)
- **Compromised wallets** (high outgoing volume)
- **Automated behavior** (single counterparty interactions)
- **Scam tokens** (jetton transfer activity)

## Detected Patterns

### 1. High Failure Rate
**Pattern**: `high_failure_rate`  
**Trigger**: ≥50% of transactions failed (minimum 5 transactions)  
**Risk Score**: +30  
**Signal Example**: `"High transaction failure rate: 80%"`

**What it means**: The wallet is experiencing frequent transaction failures, which could indicate:
- Insufficient gas/fees
- Interacting with malicious contracts
- Victim of a drainer attack

---

### 2. All Failed Transactions
**Pattern**: `all_failed`  
**Trigger**: 100% failure rate (minimum 3 transactions)  
**Risk Score**: +50  
**Signal Example**: `"All recent transactions failed - possible drainer victim"`

**What it means**: Every recent transaction has failed - strong indicator of:
- **Drainer victim**: Wallet connected to malicious dApp
- **Misconfigured wallet**: Wrong network or corrupted state
- **Blocked account**: Frozen or blacklisted

---

### 3. Rapid Transaction Burst
**Pattern**: `rapid_burst`  
**Trigger**: >60 transactions per hour  
**Risk Score**: +25  
**Signal Example**: `"Rapid transaction burst detected (possible bot activity)"`

**What it means**: Transactions happening at inhuman speeds:
- **Bot activity**: Automated trading/arbitrage
- **Spam behavior**: Airdrop farming
- **Flash loan attacks**: DeFi exploitation

---

### 4. Failed Outgoing Transfers
**Pattern**: `failed_outgoing_transfers`  
**Trigger**: ≥3 failed outgoing TON transfers  
**Risk Score**: +60  
**Signal Example**: `"Multiple failed outgoing transfers - possible drainer attack"`

**What it means**: **CRITICAL INDICATOR** of drainer attack:
- User connected wallet to malicious site
- Drainer trying to drain funds but failing (insufficient balance, gas issues)
- Wallet may already be compromised

**Action**: Immediately disconnect from suspicious dApps and transfer remaining funds to new wallet.

---

### 5. High Outgoing Volume
**Pattern**: `high_outgoing_volume`  
**Trigger**: >10 TON sent in recent transactions (≥2 transfers)  
**Risk Score**: +35  
**Signal Example**: `"High outgoing volume: 15.50 TON in recent transactions"`

**What it means**: Large amounts leaving the wallet:
- **Possible compromise**: Funds being drained
- **Legitimate transfer**: User moving funds
- **DeFi activity**: Providing liquidity or staking

---

### 6. Single Counterparty
**Pattern**: `single_counterparty`  
**Trigger**: ≥5 transactions, all with same address  
**Risk Score**: +20  
**Signal Example**: `"All transactions with single address - possible automated interaction"`

**What it means**: Wallet only interacting with one contract/address:
- **Automated bot**: Trading bot or script
- **Staking contract**: Repeated deposits/withdrawals
- **Suspicious**: Could be interacting with scam contract

---

### 7. Only Contract Executions
**Pattern**: `only_contract_exec`  
**Trigger**: ≥3 transactions, all `SmartContractExec` type  
**Risk Score**: +25  
**Signal Example**: `"Only smart contract executions - review contract interactions carefully"`

**What it means**: No normal transfers, only contract calls:
- **DeFi interactions**: Swaps, stakes, yields
- **NFT minting**: Bulk minting operations
- **Suspicious**: Could be interacting with malicious contracts

---

### 8. Jetton Activity
**Pattern**: `jetton_activity`  
**Trigger**: ≥3 jetton transfers  
**Risk Score**: +15  
**Signal Example**: `"3 jetton transfers detected - verify token legitimacy"`

**What it means**: Wallet transferring tokens:
- **Token trading**: Buying/selling jettons
- **Scam tokens**: Receiving worthless airdrop tokens
- **Legitimate**: Normal token activity

---

## API Response Structure

### Example Response

```json
{
  "status": "ok",
  "data": {
    "address": "UQB2T1kMgDeXo0PY6vTK76iufMYUwWZX_Xi9g2hTwS_CBtuk",
    "risk_level": "WARNING",
    "risk_score": 60,
    "signals": [
      "Balance below 0.01 TON",
      "High transaction failure rate: 100%",
      "All recent transactions failed - possible drainer victim",
      "Multiple failed outgoing transfers - possible drainer attack"
    ],
    "account": {
      "status": "active",
      "balance": "0.0043",
      "balance_nanoton": 4338923,
      "interfaces": ["wallet_v4r2"]
    },
    "recent_transactions": [
      {
        "event_id": "c61e05e310f4508f586d7647042942d38023519e1089d461743a8f4d9a42b7df",
        "timestamp": 1759340530,
        "direction": "outgoing",
        "counterparty": "0:AE597C52BD2A4AAAB419E7FB88798542BD5DE901E6DA81923F43DB27F5D7706A",
        "amount": "0.05",
        "action_type": "TonTransfer",
        "success": false,
        "fee": "0"
      }
      // ... more transactions
    ],
    "transaction_analysis": {
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
    },
    "ai_explanation": "Risk level WARNING. Key signals: Balance below 0.01 TON; High transaction failure rate: 100%; All recent transactions failed - possible drainer victim."
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `transaction_analysis.total_analyzed` | number | Number of transactions analyzed (max 10) |
| `transaction_analysis.suspicious_patterns` | string[] | Array of pattern codes detected |
| `transaction_analysis.risk_indicators` | string[] | Human-readable descriptions of risks found |
| `signals` | string[] | All risk signals including transaction patterns |
| `risk_score` | number | Overall risk score (0-100), increased by pattern analysis |
| `risk_level` | string | `SAFE` (0-39), `WARNING` (40-79), `CRITICAL` (80-100) |

---

## Risk Score Impact

Transaction patterns contribute to the overall risk score:

| Pattern | Risk Score Addition |
|---------|---------------------|
| High Failure Rate | +30 |
| All Failed | +50 |
| Rapid Burst | +25 |
| Failed Outgoing Transfers | +60 (CRITICAL) |
| High Outgoing Volume | +35 |
| Single Counterparty | +20 |
| Only Contract Exec | +25 |
| Jetton Activity | +15 |

**Note**: Final `risk_score` is the maximum of:
1. Base address risk score
2. Transaction pattern risk scores

Example:
- Base risk: 15 (low balance)
- Transaction pattern: 60 (failed outgoing transfers)
- **Final risk_score**: 60

---

## Real-World Examples

### Example 1: Drainer Victim
```json
{
  "risk_level": "WARNING",
  "risk_score": 60,
  "signals": [
    "Balance below 0.01 TON",
    "High transaction failure rate: 100%",
    "All recent transactions failed - possible drainer victim",
    "Multiple failed outgoing transfers - possible drainer attack"
  ],
  "transaction_analysis": {
    "suspicious_patterns": ["high_failure_rate", "all_failed", "failed_outgoing_transfers"]
  }
}
```

**Interpretation**: 🚨 **DRAINER ATTACK DETECTED**
- All 10 transactions failed
- Multiple attempts to send TON failed
- Wallet likely connected to malicious dApp
- Drainer trying to steal funds but failing due to low balance

**Recommendation**: Disconnect all dApps, transfer funds to new wallet immediately.

---

### Example 2: Bot Trading Activity
```json
{
  "risk_level": "SAFE",
  "risk_score": 25,
  "signals": [
    "Rapid transaction burst detected (possible bot activity)",
    "All transactions with single address - possible automated interaction"
  ],
  "transaction_analysis": {
    "suspicious_patterns": ["rapid_burst", "single_counterparty"]
  }
}
```

**Interpretation**: ✅ **Likely Legitimate Bot**
- High transaction frequency (>60/hour)
- All interactions with known DEX contract
- Automated trading bot or arbitrage

**Recommendation**: Normal DeFi activity, low risk.

---

### Example 3: Jetton Scam Tokens
```json
{
  "risk_level": "SAFE",
  "risk_score": 20,
  "signals": [
    "3 jetton transfers detected - verify token legitimacy"
  ],
  "transaction_analysis": {
    "suspicious_patterns": ["jetton_activity"]
  }
}
```

**Interpretation**: ⚠️ **Token Activity Detected**
- Multiple jetton transfers
- Could be scam airdrop tokens or legitimate trading
- Verify each token separately using `/analyze/jetton` endpoint

**Recommendation**: Check jetton contracts before interacting.

---

## Testing

### cURL Examples

```bash
# Test with known drainer victim
curl http://localhost:3000/analyze/address/UQB2T1kMgDeXo0PY6vTK76iufMYUwWZX_Xi9g2hTwS_CBtuk

# Test with active DEX contract
curl http://localhost:3000/analyze/address/EQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2Eml6y

# Test with normal wallet
curl http://localhost:3000/analyze/address/EQD__________________________________________0vo
```

---

## Integration Guide

### Frontend Display

```typescript
// Display transaction analysis results
function TransactionAnalysis({ data }) {
  const { transaction_analysis, risk_level } = data;
  
  if (transaction_analysis.suspicious_patterns.length === 0) {
    return <div>✅ No suspicious patterns detected</div>;
  }
  
  return (
    <div className={`alert ${risk_level.toLowerCase()}`}>
      <h3>⚠️ {transaction_analysis.suspicious_patterns.length} Suspicious Patterns Detected</h3>
      <ul>
        {transaction_analysis.risk_indicators.map((indicator, i) => (
          <li key={i}>{indicator}</li>
        ))}
      </ul>
      
      {transaction_analysis.suspicious_patterns.includes('failed_outgoing_transfers') && (
        <div className="critical-warning">
          🚨 DRAINER ATTACK DETECTED: Disconnect from all dApps immediately!
        </div>
      )}
    </div>
  );
}
```

### Pattern-Specific Alerts

```javascript
const patternAlerts = {
  all_failed: {
    severity: 'critical',
    message: '🚨 All transactions failed - wallet may be compromised',
    action: 'Disconnect from dApps and transfer funds to new wallet'
  },
  failed_outgoing_transfers: {
    severity: 'critical',
    message: '🚨 Drainer attack detected',
    action: 'Immediately disconnect from all websites and move funds'
  },
  high_outgoing_volume: {
    severity: 'warning',
    message: '⚠️ Large outgoing transfers detected',
    action: 'Verify these transactions are legitimate'
  },
  rapid_burst: {
    severity: 'info',
    message: 'ℹ️ Automated bot activity detected',
    action: 'Review if this is expected behavior'
  }
};
```

---

## Technical Implementation

### Code Location
- **File**: `src/core/RiskEngine.js`
- **Method**: `analyzeTransactionPatterns(transactions)`
- **Called from**: `analyzeAddress(address)`

### Algorithm
1. Fetch last 10 transactions using TON API
2. Calculate failure rate
3. Check for rapid bursts (time-based)
4. Detect outgoing transfer failures
5. Measure outgoing volume
6. Identify single counterparty interactions
7. Classify transaction types
8. Count jetton activity

### Performance
- **API Calls**: 1 additional call to `/accounts/{address}/events`
- **Processing Time**: <50ms for pattern analysis
- **Memory**: Minimal (10 transactions cached temporarily)

---

## Limitations

1. **Historical Data**: Only analyzes last 10 transactions (API limitation)
2. **False Positives**: Bot activity may trigger alerts on legitimate wallets
3. **Network Delays**: Recent transactions may not appear immediately
4. **Context Missing**: Cannot distinguish between legitimate high-volume and draining without additional context

---

## Future Enhancements

- [ ] Increase transaction history to 50-100 events
- [ ] Add ML-based anomaly detection
- [ ] Counterparty reputation scoring
- [ ] Time-series analysis for long-term patterns
- [ ] Integration with known scam contract database
- [ ] Real-time monitoring/alerts for connected wallets

---

## Support

For issues or questions about transaction pattern analysis:
- Review source code: `src/core/RiskEngine.js`
- Check API logs for transaction fetch errors
- Verify TONAPI_KEY is valid
- Test with known addresses first

---

**Last Updated**: December 9, 2025  
**Version**: 1.0.0
