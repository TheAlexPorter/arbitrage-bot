import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import AlpacaApi from "@alpacahq/alpaca-trade-api";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Alpaca API for paper trading
const alpaca = new AlpacaApi({
  keyId: process.env.ALPACA_API_KEY || "",
  secretKey: process.env.ALPACA_SECRET_KEY || "",
  paper: true, // Always use paper trading for now
  usePolygon: false,
});

// Test route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Arbitrage Bot API is running" });
});

// Alpaca account info route
app.get("/api/account", async (req, res) => {
  try {
    const account = await alpaca.getAccount();
    res.json({
      success: true,
      account: {
        id: account.id,
        status: account.status,
        currency: account.currency,
        buying_power: account.buying_power,
        cash: account.cash,
        portfolio_value: account.portfolio_value,
        pattern_day_trader: account.pattern_day_trader,
        trading_blocked: account.trading_blocked,
        transfers_blocked: account.transfers_blocked,
        account_blocked: account.account_blocked,
      },
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch account information",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get positions
app.get("/api/positions", async (req, res) => {
  try {
    const positions = await alpaca.getPositions();
    res.json({
      success: true,
      positions: positions.map((pos: any) => ({
        symbol: pos.symbol,
        qty: pos.qty,
        side: pos.side,
        market_value: pos.market_value,
        cost_basis: pos.cost_basis,
        unrealized_pl: pos.unrealized_pl,
        unrealized_plpc: pos.unrealized_plpc,
        current_price: pos.current_price,
      })),
    });
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch positions",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Basic quote endpoint to test market data
app.get("/api/quote/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    // Get latest quote for the symbol
    const quote = await alpaca.getLatestQuote(symbol);

    res.json({
      success: true,
      symbol,
      quote: {
        bid: quote.BidPrice,
        ask: quote.AskPrice,
        bid_size: quote.BidSize,
        ask_size: quote.AskSize,
        timestamp: quote.Timestamp,
      },
    });
  } catch (error) {
    console.error("Error fetching quote:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch quote",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Arbitrage Bot API server running on port ${PORT}`);
  console.log(`📊 Paper trading mode: ENABLED`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET /api/health - Health check`);
  console.log(`   GET /api/account - Account info`);
  console.log(`   GET /api/positions - Current positions`);
  console.log(`   GET /api/quote/:symbol - Get quote for symbol`);
});

export default app;
