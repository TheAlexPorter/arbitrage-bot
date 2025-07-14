# Options Trading Arbitrage Tool

A React-based trading interface inspired by ThinkOrSwim's Active Trader, integrated with Alpaca's paper trading API.

## 🚀 Current Progress

### ✅ Phase 1 Complete: Foundation & Basic Interface

- **Frontend**: React + Vite + TypeScript with Tailwind CSS
- **Backend**: Node.js + Express + TypeScript with Alpaca API integration
- **Trading Interface**: Bid/Ask ladder component similar to ThinkOrSwim Active Trader
- **Live Data**: Real-time price simulation (WebSocket integration next)
- **Paper Trading**: Connected to Alpaca paper trading API

### 🎯 Key Features Working

- **Bid/Ask Ladder**: Price ladder with buy/sell order columns
- **Account Integration**: Live account info from Alpaca
- **Order Placement**: Click-to-buy/sell interface (alerts for now)
- **Real-time Updates**: Price updates every 2 seconds
- **Trading Theme**: Dark theme matching professional trading platforms

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18+)
- Alpaca Paper Trading Account

### 1. Backend Setup

```bash
cd backend
npm install

# Create .env file with your Alpaca keys
echo "ALPACA_API_KEY=your_paper_trading_key_here" > .env
echo "ALPACA_SECRET_KEY=your_paper_trading_secret_here" >> .env
echo "PORT=3001" >> .env

# Start backend server
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start frontend development server
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🔧 API Endpoints

- `GET /api/health` - Health check
- `GET /api/account` - Account information
- `GET /api/positions` - Current positions
- `GET /api/quote/:symbol` - Get quote for symbol

## 🎨 Interface Features

### Current Ladder Components

- **Volume**: Shows trading volume
- **Buy Orders**: Green column for buy orders (clickable)
- **Bid Size**: Current bid sizes
- **Price**: Center price column (highlighted for current price)
- **Ask Size**: Current ask sizes
- **Sell Orders**: Red column for sell orders (clickable)
- **P/L Open**: Profit/Loss display

### Visual Elements

- **Dark Trading Theme**: Professional trading platform look
- **Color Coding**: Green for buys, red for sells
- **Current Price Highlight**: Yellow highlighting for current market price
- **Order Indicators**: Visual indicators for pending orders

## 📋 Next Steps

### Phase 2: Order Placement & WebSocket

- [ ] Real order placement via Alpaca API
- [ ] WebSocket connection for live price updates
- [ ] Order status tracking and management

### Phase 3: Trade Memory System

- [ ] Automatically save successful round-trip trades
- [ ] Trade template creation from successful trades
- [ ] Auto-replay functionality with configurable intervals

### Phase 4: Multiple Ladders

- [ ] Support for multiple option contracts simultaneously
- [ ] Tabbed or side-by-side ladder views
- [ ] Options chain integration

## 🧪 Testing with Paper Trading

1. **Get Alpaca Keys**: Sign up at https://alpaca.markets/ and generate paper trading keys
2. **Add to Environment**: Update your `backend/.env` file with real keys
3. **Test Account**: Visit `http://localhost:3001/api/account` to verify connection
4. **Use Interface**: Click buy/sell buttons in the ladder to test order placement

## 📊 Current Status

The foundation is complete! You now have a working bid/ask ladder interface connected to Alpaca's paper trading API. The interface mimics ThinkOrSwim's Active Trader and is ready for order placement integration.

**Ready for the next phase**: WebSocket integration and real order placement.
