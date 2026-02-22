---
name: stock-api
description: Use this skill when the user wants to add stock market data using Finnhub. Provides integration guidance for real-time quotes, company data, and financial metrics.
---

# Finnhub Stock API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Access real-time stock market data, company information, and financial metrics using Finnhub.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://finnhub.io/api/v1`

**Main Endpoints:**
- `/quote` - Real-time stock quote
- `/search` - Search for stock symbols
- `/stock/profile2` - Company profile
- `/stock/candle` - Historical price data (OHLC)
- `/news` - Market news

## Environment Variable

- **Variable name:** `FINNHUB_API_KEY`
- **Used via:** `config.finnhubApiKey`
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Rate limit strict** - Implement caching and exponential backoff to avoid rate limiting
2. **Symbol format matters** - Use correct exchange symbol (e.g., `AAPL` not `AAPL.US`)
3. **Data delays** - Check your plan's data delay; real-time data requires paid plans
4. **WebSocket for real-time** - REST API is delayed; use WebSocket connection for live prices
5. **Market hours only** - Data updates only during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
6. **Cache aggressively** - Stock prices don't change every second; 1-5 min cache recommended
7. **API key in query or header** - Pass as `?token=YOUR_API_KEY` or `X-Finnhub-Token` header

## Response Structure

```typescript
// Quote response
interface StockQuote {
  c: number;  // Current price
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

// Company profile
interface CompanyProfile {
  name: string;
  ticker: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  shareOutstanding: number;
  logo: string;
  phone: string;
  weburl: string;
  finnhubIndustry: string;
}

// Search result
interface SymbolSearch {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}
```

## Example API Call

```bash
# Get stock quote
curl "https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_API_KEY"

# Search for symbol
curl "https://finnhub.io/api/v1/search?q=apple&token=YOUR_API_KEY"

# Company profile
curl "https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=YOUR_API_KEY"

# Historical candles (daily, last month)
curl "https://finnhub.io/api/v1/stock/candle?symbol=AAPL&resolution=D&from=1633024800&to=1635703200&token=YOUR_API_KEY"

# Market news
curl "https://finnhub.io/api/v1/news?category=general&token=YOUR_API_KEY"
```

## WebSocket for Real-Time Data

```javascript
// Connect to WebSocket
const socket = new WebSocket(`wss://ws.finnhub.io?token=YOUR_API_KEY`);

// Subscribe to symbols
socket.addEventListener('open', () => {
  socket.send(JSON.stringify({type: 'subscribe', symbol: 'AAPL'}));
  socket.send(JSON.stringify({type: 'subscribe', symbol: 'GOOGL'}));
});

// Receive updates
socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  // data.data contains array of trades
});
```

## Use Cases

- **Portfolio tracker** - Track user stock holdings
- **Stock screener** - Filter stocks by criteria
- **Market dashboard** - Display market overview
- **Trading simulator** - Paper trading app
- **Financial news** - Aggregate market news

## Caching Strategy

```typescript
// Cache quotes for 1-5 minutes depending on tier
const QUOTE_CACHE_TTL = 60; // seconds

// Cache company profiles for 24 hours (rarely changes)
const PROFILE_CACHE_TTL = 86400;

// Cache search results for 1 hour
const SEARCH_CACHE_TTL = 3600;
```

## Alternative Recommendations

- **Alpha Vantage** - Better documentation
- **IEX Cloud** - More reliable, better historical data
- **Yahoo Finance** (unofficial) - Free but no official API

Use Finnhub when:
- Need comprehensive testing capabilities
- US stocks sufficient
- 15-minute delay acceptable
- WebSocket real-time available on paid tier

---

**For complete implementation patterns (edge functions, CORS, frontend integration, caching, WebSocket):**
→ See the `integration-patterns` skill

