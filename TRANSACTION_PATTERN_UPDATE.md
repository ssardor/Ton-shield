# Transaction Pattern Analysis - Update Summary

## Что добавлено

### Новая функциональность
✅ **Автоматический анализ паттернов транзакций** в эндпоинте `/analyze/address`

Теперь при проверке адреса система:
1. Загружает последние 10 транзакций из TON API
2. Анализирует паттерны подозрительной активности
3. Увеличивает риск-скор при обнаружении угроз
4. Добавляет детальные сигналы в ответ

### Обнаруживаемые паттерны (8 типов)

| # | Паттерн | Риск | Описание |
|---|---------|------|----------|
| 1 | `high_failure_rate` | +30 | ≥50% транзакций неудачны |
| 2 | `all_failed` | +50 | Все транзакции провалились |
| 3 | `rapid_burst` | +25 | >60 транзакций/час (бот) |
| 4 | `failed_outgoing_transfers` | +60 | ≥3 неудачных исходящих перевода (drainer) |
| 5 | `high_outgoing_volume` | +35 | >10 TON отправлено |
| 6 | `single_counterparty` | +20 | Все транзакции с одним адресом |
| 7 | `only_contract_exec` | +25 | Только вызовы контрактов |
| 8 | `jetton_activity` | +15 | ≥3 перевода токенов |

### Пример ответа API

```json
{
  "address": "UQB2T1kMgDeXo0PY6vTK76iufMYUwWZX_Xi9g2hTwS_CBtuk",
  "risk_level": "WARNING",
  "risk_score": 60,
  "signals": [
    "Balance below 0.01 TON",
    "High transaction failure rate: 100%",
    "All recent transactions failed - possible drainer victim",
    "Multiple failed outgoing transfers - possible drainer attack"
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
  "recent_transactions": [
    {
      "event_id": "c61e05e310f4508f...",
      "timestamp": 1759340530,
      "direction": "outgoing",
      "counterparty": "0:AE597C52BD2A4AAA...",
      "amount": "0.05",
      "action_type": "TonTransfer",
      "success": false,
      "fee": "0"
    }
  ]
}
```

## Изменённые файлы

### src/core/RiskEngine.js
**Метод `analyzeAddress()`**:
- Добавлен вызов `analyzeTransactionPatterns()` 
- Интеграция результатов анализа в риск-скор
- Добавление сигналов паттернов в общий список

**Новый метод `analyzeTransactionPatterns()`**:
- Анализ 10 последних транзакций
- Обнаружение 8 типов подозрительных паттернов
- Расчёт дополнительного риск-скора
- Возврат детальной информации

### Структура ответа
Добавлено новое поле `transaction_analysis`:
```json
{
  "total_analyzed": 10,
  "suspicious_patterns": ["high_failure_rate", "all_failed"],
  "risk_indicators": ["Signal 1", "Signal 2"]
}
```

## Документация

### Создано
- **docs/TRANSACTION_PATTERN_ANALYSIS.md** (6KB)
  - Описание всех 8 паттернов
  - Примеры реальных случаев
  - Руководство по интеграции для фронтенда
  - cURL примеры для тестирования

### Обновлено
- **README.md** - добавлена информация о новой функциональности

## Практические примеры

### Пример 1: Drainer Attack 🚨
```bash
curl http://localhost:3000/analyze/address/UQB2T1kMgDeXo0PY6vTK76iufMYUwWZX_Xi9g2hTwS_CBtuk
```

**Результат**:
- `risk_level`: `WARNING`
- `risk_score`: 60
- **Паттерны**: `high_failure_rate`, `all_failed`, `failed_outgoing_transfers`
- **Сигналы**: 
  - "High transaction failure rate: 100%"
  - "All recent transactions failed - possible drainer victim"
  - "Multiple failed outgoing transfers - possible drainer attack"

**Интерпретация**: Кошелёк скорее всего подключился к вредоносному dApp, который пытается украсть средства. Все попытки переводов провалились из-за низкого баланса.

### Пример 2: Jetton Activity
**Паттерны**: `jetton_activity`
**Сигналы**: "4 jetton transfers detected - verify token legitimacy"

**Интерпретация**: Множественные переводы токенов. Может быть:
- Легитимная торговля токенами
- Получение скам airdrop токенов
- Взаимодействие с мошенническими контрактами

### Пример 3: Bot Trading
**Паттерны**: `rapid_burst`, `single_counterparty`
**Сигналы**: 
- "Rapid transaction burst detected (possible bot activity)"
- "All transactions with single address - possible automated interaction"

**Интерпретация**: Автоматизированная торговля или арбитраж. Низкий риск, если взаимодействие с известным DEX.

## Использование во фронтенде

### React Component Example
```typescript
function TransactionPatterns({ analysis }) {
  if (!analysis.suspicious_patterns.length) {
    return <Badge variant="success">✅ Clean History</Badge>;
  }
  
  const isCritical = analysis.suspicious_patterns.includes('failed_outgoing_transfers');
  
  return (
    <Alert severity={isCritical ? "error" : "warning"}>
      <AlertTitle>
        {analysis.suspicious_patterns.length} Suspicious Pattern(s) Detected
      </AlertTitle>
      
      <ul>
        {analysis.risk_indicators.map((indicator, i) => (
          <li key={i}>{indicator}</li>
        ))}
      </ul>
      
      {isCritical && (
        <div className="critical-alert">
          🚨 DRAINER ATTACK: Disconnect from dApps immediately!
        </div>
      )}
    </Alert>
  );
}
```

### Telegram Mini App Display
```javascript
function formatPatternAlert(patterns) {
  const alerts = {
    all_failed: '🚨 All transactions failed',
    failed_outgoing_transfers: '🚨 Drainer attack detected',
    high_outgoing_volume: '⚠️ High outgoing volume',
    rapid_burst: 'ℹ️ Bot activity detected'
  };
  
  return patterns
    .filter(p => alerts[p])
    .map(p => alerts[p])
    .join('\n');
}
```

## Производительность

- **API вызовы**: +1 запрос к TON API (`/accounts/{address}/events`)
- **Обработка**: <50ms для анализа 10 транзакций
- **Память**: Минимальное потребление (временный кэш 10 транзакций)

## Будущие улучшения

- [ ] Увеличить лимит до 50-100 транзакций
- [ ] ML-анализ аномалий на основе истории
- [ ] Репутационная оценка counterparty адресов
- [ ] Интеграция с базой известных скам-контрактов
- [ ] Real-time мониторинг подключённых кошельков
- [ ] Временные ряды для долгосрочных паттернов

## Тестирование

```bash
# Тест drainer жертвы
curl http://localhost:3000/analyze/address/UQB2T1kMgDeXo0PY6vTK76iufMYUwWZX_Xi9g2hTwS_CBtuk

# Тест DEX контракта
curl http://localhost:3000/analyze/address/EQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2Eml6y

# Форматирование с jq
curl http://localhost:3000/analyze/address/ADDRESS | jq '.data.transaction_analysis'
```

## Техническая реализация

**Файл**: `src/core/RiskEngine.js`

**Новые методы**:
1. `analyzeTransactionPatterns(transactions)` - анализ паттернов
2. Обновлённый `analyzeAddress(address)` - интеграция анализа

**Алгоритм**:
1. Получение последних 10 транзакций
2. Подсчёт процента неудач
3. Проверка rapid bursts (время между транзакциями)
4. Детектирование неудачных исходящих переводов
5. Измерение исходящего объёма
6. Определение одиночных counterparty
7. Классификация типов транзакций
8. Подсчёт jetton активности

**Возвращаемый объект**:
```javascript
{
  suspicious: boolean,
  signals: string[],
  riskScore: number,
  patterns: string[]
}
```

---

**Дата**: 9 декабря 2025  
**Версия**: 1.0.0  
**Автор**: TON Shield Team
