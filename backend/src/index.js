"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const alpaca_trade_api_1 = __importDefault(require("@alpacahq/alpaca-trade-api"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize Alpaca API for paper trading
const alpaca = new alpaca_trade_api_1.default({
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
app.get("/api/account", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const account = yield alpaca.getAccount();
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
    }
    catch (error) {
        console.error("Error fetching account:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch account information",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
// Get positions
app.get("/api/positions", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const positions = yield alpaca.getPositions();
        res.json({
            success: true,
            positions: positions.map((pos) => ({
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
    }
    catch (error) {
        console.error("Error fetching positions:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch positions",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
// Basic quote endpoint to test market data
app.get("/api/quote/:symbol", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { symbol } = req.params;
        // Get latest quote for the symbol
        const quote = yield alpaca.getLatestQuote(symbol);
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
    }
    catch (error) {
        console.error("Error fetching quote:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch quote",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
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
exports.default = app;
