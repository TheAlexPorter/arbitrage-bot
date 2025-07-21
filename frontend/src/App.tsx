import { useState, useEffect } from "react";
import BidAskLadder from "./components/BidAskLadder";
import CollapsibleOptionsChain from "./components/CollapsibleOptionsChain";
import WatchList from "./components/WatchList";
import TradingModeToggle from "./components/TradingModeToggle";
import AccountStats from "./components/AccountStats";
import OpenOrders from "./components/OpenOrders";
import { ToastProvider } from "./components/Toast";
import { useToast } from "./hooks/useToast";
import { useLocalStorage } from "./hooks/useLocalStorage";
import {
  useOrders,
  useQuote,
  useOptionQuote,
  usePlaceOrder,
  usePlaceOptionsOrder,
  useCancelOrder,
  useCancelAllOrders,
  useSetTradingMode,
  useTradingMode,
} from "./hooks/useApi";

const POPULAR_SYMBOLS = ["MSTR", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX", "NIO", "SPY", "QQQ", "IWM", "AMD", "PLTR", "GME", "AMC"];

function AppInner() {
  const toast = useToast();

  // Use localStorage for persisting active instrument
  const [activeInstrument, setActiveInstrument] = useLocalStorage("activeInstrument", "MSTR");
  const [instrumentType, setInstrumentType] = useState<"stock" | "option">("stock");
  const [isOptionsChainCollapsed, setIsOptionsChainCollapsed] = useState(false);

  // Initialize instrument type based on active instrument
  useEffect(() => {
    if (activeInstrument) {
      const isOption = isOptionSymbol(activeInstrument);
      setInstrumentType(isOption ? "option" : "stock");
    }
  }, [activeInstrument]);

  // TanStack Query hooks
  const { data: orders = [] } = useOrders();
  const { data: tradingMode } = useTradingMode();

  // Price queries
  const quoteQuery = useQuote(instrumentType === "stock" ? activeInstrument : "");
  const optionQuoteQuery = useOptionQuote(instrumentType === "option" ? activeInstrument : "");

  // Mutations
  const placeOrderMutation = usePlaceOrder();
  const placeOptionsOrderMutation = usePlaceOptionsOrder();
  const cancelOrderMutation = useCancelOrder();
  const cancelAllOrdersMutation = useCancelAllOrders();
  const setTradingModeMutation = useSetTradingMode();

  // Calculate current price from queries
  const currentPrice =
    instrumentType === "option"
      ? optionQuoteQuery.data
        ? (optionQuoteQuery.data.bid + optionQuoteQuery.data.ask) / 2
        : 4.89
      : quoteQuery.data
      ? (parseFloat(quoteQuery.data.bid) + parseFloat(quoteQuery.data.ask)) / 2
      : 4.89;

  // Check if symbol is an option
  const isOptionSymbol = (sym: string) => {
    return sym.length > 10 && /^[A-Z]+\d{6}[CP]\d{8}$/.test(sym);
  };

  // Get the underlying stock symbol for options
  const getUnderlyingStock = (optionSymbol: string) => {
    // Extract the stock symbol from option symbol (e.g., "MSTR240315C00100000" -> "MSTR")
    const match = optionSymbol.match(/^([A-Z]+)\d{6}[CP]\d{8}$/);
    return match ? match[1] : optionSymbol;
  };

  // Place order (handles both stocks and options)
  const placeOrder = async (side: "buy" | "sell", price: number, orderType: "market" | "limit") => {
    try {
      const isOption = instrumentType === "option";

      if (isOption) {
        // Place options order - let the backend handle smart order routing
        const orderData = {
          symbol: activeInstrument,
          side: side, // Use simple buy/sell, backend will determine appropriate order type
          quantity: "1", // Default to 1 contract
          price: orderType === "limit" ? price.toString() : currentPrice.toString(),
          orderType: orderType,
        };

        const result = await placeOptionsOrderMutation.mutateAsync(orderData);

        // Show enhanced success message with smart routing info
        if (result.smart_side && result.smart_side !== result.original_side) {
          toast.success("Order Placed", `Options ${side} order placed successfully (smart routing: ${result.smart_side})`);
        } else {
          toast.success("Order Placed", `Options ${side} order placed successfully`);
        }
      } else {
        // Place stock order
        const orderData = {
          symbol: activeInstrument,
          side,
          quantity: "1",
          price: orderType === "limit" ? price.toString() : currentPrice.toString(),
          orderType: orderType,
        };

        await placeOrderMutation.mutateAsync(orderData);
        toast.success("Order Placed", `Stock ${side} order placed successfully`);
      }
    } catch (error: unknown) {
      console.error("Error placing order:", error);

      // Enhanced error handling with specific messages
      let errorMessage = "Failed to place order. Please try again.";

      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as { response?: { data?: { error?: string } } };
        if (apiError.response?.data?.error) {
          errorMessage = apiError.response.data.error;
        }
      } else if (error && typeof error === "object" && "message" in error) {
        const messageError = error as { message: string };
        errorMessage = messageError.message;
      }

      // Check for specific broker restrictions and provide helpful guidance
      if (errorMessage.includes("cannot open a short sell while a long buy order is open")) {
        toast.error(
          "Alpaca Restriction",
          "Alpaca's paper trading prevents simultaneous buy/sell orders. For arbitrage strategies, consider: 1) Using live trading, 2) Placing orders with 5+ second delays, or 3) Using bracket orders."
        );
      } else if (errorMessage.includes("potential wash trade detected")) {
        toast.error(
          "Wash Trade Detection",
          "Alpaca detected potential wash trading. For day trading, try placing orders with delays or use different order types."
        );
      } else {
        toast.error("Order Failed", errorMessage);
      }
    }
  };

  const handleBuyClick = (price: number, orderType: "market" | "limit") => {
    placeOrder("buy", price, orderType);
  };

  const handleSellClick = (price: number, orderType: "market" | "limit") => {
    placeOrder("sell", price, orderType);
  };

  const handleSymbolChange = (newSymbol: string) => {
    setActiveInstrument(newSymbol);
    setInstrumentType("stock");
  };

  const handleOptionSelect = (optionSymbol: string) => {
    setActiveInstrument(optionSymbol);
    setInstrumentType("option");
  };

  const handleInstrumentSelect = (instrumentSymbol: string) => {
    const isOption = isOptionSymbol(instrumentSymbol);
    setActiveInstrument(instrumentSymbol);
    setInstrumentType(isOption ? "option" : "stock");
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await cancelOrderMutation.mutateAsync(orderId);
      toast.success("Order Cancelled", "Order has been cancelled successfully");
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Cancellation Failed", "Failed to cancel order. Please try again.");
    }
  };

  const cancelAllOrders = async () => {
    try {
      await cancelAllOrdersMutation.mutateAsync();
      toast.success("Orders Cancelled", "All orders have been cancelled successfully");
    } catch (error) {
      console.error("Error cancelling all orders:", error);
      toast.error("Cancellation Failed", "Failed to cancel all orders. Please try again.");
    }
  };

  const handleTradingModeChange = async (mode: "paper" | "live") => {
    try {
      await setTradingModeMutation.mutateAsync(mode);
      toast.success("Trading Mode Changed", `Switched to ${mode} trading mode`);
    } catch (error) {
      console.error("Error changing trading mode:", error);
      toast.error("Mode Change Failed", "Failed to change trading mode. Please try again.");
    }
  };

  // Determine which stock symbol to show in options chain
  const optionsChainSymbol = instrumentType === "option" ? getUnderlyingStock(activeInstrument) : activeInstrument;

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col'>
      {/* Trading Mode Banner - Fixed at top */}
      <div className='bg-gray-800 border-b border-gray-700 h-16 flex items-center justify-center w-full'>
        <div className='w-full max-w-7xl px-4'>
          <TradingModeToggle onModeChange={handleTradingModeChange} />
        </div>
      </div>

      {/* Data Source Indicator */}
      <div className='bg-gray-700 border-b border-gray-600 p-2'>
        <div className='mx-auto max-w-7xl'>
          <div className='flex items-center justify-center space-x-4 text-sm'>
            <div className='flex items-center space-x-2'>
              <span className='text-gray-300'>Data Source:</span>
              <span className='text-yellow-400 font-semibold'>Contract Data Only</span>
              <span className='text-gray-500'>•</span>
              <span className='text-gray-300'>Live pricing requires market data subscription</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Takes remaining space */}
      <div className='flex-1 mx-auto p-4 w-full'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-4 h-full'>
          {/* Left Column - Watch List */}
          <div className='lg:col-span-1'>
            <WatchList activeInstrument={activeInstrument} onInstrumentSelect={handleInstrumentSelect} onNewOptionAdded={handleOptionSelect} />
          </div>

          {/* Center Column - Main Trading Interface */}
          <div className='lg:col-span-2 space-y-4'>
            {/* Symbol Selection */}
            <div className='bg-gray-800 border border-gray-600 rounded-lg p-4'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-semibold'>Active Instrument</h2>
                <div className='flex items-center space-x-2'>
                  <span className={`px-2 py-1 rounded text-xs ${instrumentType === "option" ? "bg-purple-600" : "bg-green-600"}`}>
                    {instrumentType.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className='flex flex-wrap gap-2 mb-4'>
                {POPULAR_SYMBOLS.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handleSymbolChange(sym)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      activeInstrument === sym && instrumentType === "stock" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>

              <div className='text-center'>
                <div className='text-3xl font-bold text-green-400 mb-2'>${currentPrice.toFixed(2)}</div>
                <div className='text-sm text-gray-400'>
                  {activeInstrument} • {instrumentType === "option" ? "Option" : "Stock"}
                </div>
              </div>
            </div>

            {/* Bid/Ask Ladder */}
            <BidAskLadder
              symbol={activeInstrument}
              currentPrice={currentPrice}
              onBuyClick={handleBuyClick}
              onSellClick={handleSellClick}
              onCancelOrder={cancelOrder}
            />
          </div>

          {/* Right Column - Account Info & Orders */}
          <div className='lg:col-span-1 space-y-4'>
            <AccountStats tradingMode={tradingMode || "paper"} />
            <OpenOrders orders={orders} onCancelOrder={cancelOrder} onCancelAllOrders={cancelAllOrders} onRefresh={() => {}} />
          </div>
        </div>
      </div>

      {/* Options Chain - Fixed at bottom */}
      <div className='w-full border-t border-gray-700'>
        <CollapsibleOptionsChain
          symbol={optionsChainSymbol}
          isCollapsed={isOptionsChainCollapsed}
          onToggleCollapse={() => setIsOptionsChainCollapsed(!isOptionsChainCollapsed)}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

export default App;
