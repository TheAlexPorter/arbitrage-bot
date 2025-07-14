# Arbitrage Bot Backend

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your Alpaca API credentials:

```env
ALPACA_API_KEY=your_alpaca_api_key_here
ALPACA_SECRET_KEY=your_alpaca_secret_key_here
PORT=3001
```

3. Run in development mode:

```bash
npm run dev
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/account` - Get account information
- `GET /api/positions` - Get current positions
- `GET /api/quote/:symbol` - Get latest quote for a symbol

## Getting Alpaca API Keys

1. Sign up for an Alpaca account at https://alpaca.markets/
2. Go to your dashboard and generate API keys
3. Make sure to use paper trading keys for testing
4. Add the keys to your `.env` file
