import React, { useState, useEffect } from "react";
import { useOrders, usePositions } from "../hooks/useApi";

interface LadderRow {
  price: number;
  bidSize: number;
  askSize: number;
  volume?: number;
  isCurrentBid?: boolean;
  isCurrentAsk?: boolean;
  filledQuantity?: number;
  avgFillPrice?: number;
}

interface BidAskLadderProps {
  symbol: string;
  currentPrice: number;
  onBuyClick: (price: number, orderType: "market" | "limit") => void;
  onSellClick: (price: number, orderType: "market" | "limit") => void;
  onCancelOrder?: (orderId: string) => void;
}

const BidAskLadder: React.FC<BidAskLadderProps> = ({ symbol, currentPrice, onBuyClick, onSellClick, onCancelOrder }) => {
  const [ladderData, setLadderData] = useState<LadderRow[]>([]);
  const [cancelingOrders, setCancelingOrders] = useState<Set<string>>(new Set());
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [currentAsk, setCurrentAsk] = useState<number>(0);

  // Use TanStack Query hooks for data
  const { data: orders = [] } = useOrders();
  const { data: positions = [] } = usePositions();

  // Debug logging for orders
  useEffect(() => {
    if (orders.length > 0) {
      const symbolOrders = orders.filter((o) => o.symbol === symbol);
      const activeSymbolOrders = symbolOrders.filter((o) => o.status === "accepted" || o.status === "new" || o.status === "pending_new");

      if (activeSymbolOrders.length > 0) {
        console.log(
          `📋 Active orders for ${symbol}:`,
          activeSymbolOrders.map((o) => ({
            id: o.id,
            side: o.side,
            status: o.status,
            limit_price: o.limit_price,
            qty: o.qty,
          }))
        );
      }
    }
  }, [orders, symbol]);

  // Check if symbol is an option
  const isOptionSymbol = (sym: string) => {
    return sym.length > 10 && /^[A-Z]+\d{6}[CP]\d{8}$/.test(sym);
  };

  // Parse option symbol to get details
  const parseOptionSymbol = (optionSymbol: string) => {
    const match = optionSymbol.match(/^([A-Z]+)(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/);
    if (!match) return null;

    const [, ticker, year, month, day, type, strikeRaw] = match;
    const strike = parseInt(strikeRaw) / 1000;
    const expiry = `20${year}-${month}-${day}`;
    const optionType = type === "C" ? "Call" : "Put";

    return {
      ticker,
      expiry,
      type: optionType,
      strike,
      display: `${ticker} ${month}/${day}/${year} $${strike} ${optionType}`,
    };
  };

  // Determine price increment for options
  const getPriceIncrement = (): number => {
    // Use 1 cent intervals for all options
    return 0.01;
  };

  // Get filled quantity at a specific price level
  const getFilledQuantityAtPrice = (price: number) => {
    // Look for filled orders at this price
    const filledOrders = orders.filter((o) => o.symbol === symbol && o.status === "filled" && Math.abs(parseFloat(o.limit_price) - price) < 0.005);

    const totalQuantity = filledOrders.reduce((sum, order) => sum + parseInt(order.filled_qty || order.qty), 0);

    const avgPrice = filledOrders.length > 0 ? filledOrders.reduce((sum, order) => sum + parseFloat(order.limit_price), 0) / filledOrders.length : 0;

    return { quantity: totalQuantity, avgPrice };
  };

  // Generate ladder data for a single option contract
  const generateOptionLadder = (bid: number, ask: number) => {
    const increment = getPriceIncrement();
    const rows: LadderRow[] = [];
    const numLevels = 25; // More levels for 1 cent increments

    // Get all order prices for this symbol
    const orderPrices = new Set<number>();
    orders
      .filter((o) => o.symbol === symbol && o.limit_price)
      .forEach((o) => {
        const orderPrice = Math.round(parseFloat(o.limit_price) / increment) * increment;
        orderPrices.add(orderPrice);
      });

    // Start from a price well below the current bid
    const startPrice = Math.max(0.01, bid - numLevels * increment);

    for (let i = 0; i <= numLevels * 2; i++) {
      const price = startPrice + i * increment;

      // Round to proper increment
      const roundedPrice = Math.round(price / increment) * increment;

      if (roundedPrice <= 0) continue;

      // Calculate filled quantities from positions at this price
      const filledAtPrice = getFilledQuantityAtPrice(roundedPrice);

      const row: LadderRow = {
        price: roundedPrice,
        bidSize: Math.floor(Math.random() * 50) + 10, // Simulated market depth
        askSize: Math.floor(Math.random() * 50) + 10,
        volume: Math.floor(Math.random() * 100),
        isCurrentBid: Math.abs(roundedPrice - bid) < increment / 2,
        isCurrentAsk: Math.abs(roundedPrice - ask) < increment / 2,
        filledQuantity: filledAtPrice.quantity,
        avgFillPrice: filledAtPrice.avgPrice,
      };

      rows.push(row);
    }

    // Add any order prices that aren't already in the ladder
    orderPrices.forEach((orderPrice) => {
      const exists = rows.some((row) => Math.abs(row.price - orderPrice) < increment / 2);
      if (!exists) {
        const filledAtPrice = getFilledQuantityAtPrice(orderPrice);
        rows.push({
          price: orderPrice,
          bidSize: Math.floor(Math.random() * 50) + 10,
          askSize: Math.floor(Math.random() * 50) + 10,
          volume: Math.floor(Math.random() * 100),
          isCurrentBid: Math.abs(orderPrice - bid) < increment / 2,
          isCurrentAsk: Math.abs(orderPrice - ask) < increment / 2,
          filledQuantity: filledAtPrice.quantity,
          avgFillPrice: filledAtPrice.avgPrice,
        });
      }
    });

    // Sort by price (highest to lowest for typical ladder display)
    const sortedRows = rows.sort((a, b) => b.price - a.price);

    // Log ladder generation summary
    const optionOrderPrices = new Set<number>();
    orders
      .filter((o) => o.symbol === symbol && o.limit_price && (o.status === "accepted" || o.status === "new" || o.status === "pending_new"))
      .forEach((o) => {
        const orderPrice = Math.round(parseFloat(o.limit_price) / increment) * increment;
        optionOrderPrices.add(orderPrice);
      });

    if (optionOrderPrices.size > 0) {
      console.log(`🏗️  Generated options ladder for ${symbol} with ${sortedRows.length} price levels`);
      console.log(
        `   Order prices: ${Array.from(optionOrderPrices)
          .sort((a, b) => b - a)
          .map((p) => p.toFixed(2))
          .join(", ")}`
      );
      console.log(`   Ladder range: $${sortedRows[sortedRows.length - 1].price.toFixed(2)} to $${sortedRows[0].price.toFixed(2)}`);
    }

    return sortedRows;
  };

  // Generate stock ladder data
  const generateStockLadder = (price: number) => {
    const increment = 0.01; // 1 cent increments for stocks
    const rows: LadderRow[] = [];
    const numLevels = 25;

    // Get all order prices for this symbol
    const orderPrices = new Set<number>();
    orders
      .filter((o) => o.symbol === symbol && o.limit_price)
      .forEach((o) => {
        const orderPrice = Math.round(parseFloat(o.limit_price) * 100) / 100;
        orderPrices.add(orderPrice);
      });

    // Generate standard ladder levels
    for (let i = numLevels; i >= -numLevels; i--) {
      const ladderPrice = price + i * increment;
      const roundedPrice = Math.round(ladderPrice * 100) / 100;

      if (roundedPrice <= 0) continue;

      rows.push({
        price: roundedPrice,
        bidSize: Math.floor(Math.random() * 100) + 10,
        askSize: Math.floor(Math.random() * 100) + 10,
        volume: Math.floor(Math.random() * 1000),
      });
    }

    // Add any order prices that aren't already in the ladder
    orderPrices.forEach((orderPrice) => {
      const exists = rows.some((row) => Math.abs(row.price - orderPrice) < 0.001);
      if (!exists) {
        rows.push({
          price: orderPrice,
          bidSize: Math.floor(Math.random() * 100) + 10,
          askSize: Math.floor(Math.random() * 100) + 10,
          volume: Math.floor(Math.random() * 1000),
        });
      }
    });

    // Sort by price (highest to lowest)
    const sortedRows = rows.sort((a, b) => b.price - a.price);

    // Log ladder generation summary
    const stockOrderPrices = new Set<number>();
    orders
      .filter((o) => o.symbol === symbol && o.limit_price && (o.status === "accepted" || o.status === "new" || o.status === "pending_new"))
      .forEach((o) => {
        const orderPrice = Math.round(parseFloat(o.limit_price) * 100) / 100;
        stockOrderPrices.add(orderPrice);
      });

    if (stockOrderPrices.size > 0) {
      console.log(`🏗️  Generated stock ladder for ${symbol} with ${sortedRows.length} price levels`);
      console.log(
        `   Order prices: ${Array.from(stockOrderPrices)
          .sort((a, b) => b - a)
          .map((p) => p.toFixed(2))
          .join(", ")}`
      );
      console.log(`   Ladder range: $${sortedRows[sortedRows.length - 1].price.toFixed(2)} to $${sortedRows[0].price.toFixed(2)}`);
    }

    return sortedRows;
  };

  // Fetch option data and generate ladder
  const fetchOptionData = async () => {
    if (!isOptionSymbol(symbol)) return;

    try {
      const parsed = parseOptionSymbol(symbol);
      if (!parsed) return;

      // Fetch options chain to get current bid/ask for this specific option
      const response = await fetch(`http://localhost:3001/api/options/chain/${parsed.ticker}?expiration=${parsed.expiry}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.options) {
          // Find our specific option in the chain
          const option = data.options.find(
            (opt: { strike: number; type: string; bid: number; ask: number }) => opt.strike === parsed.strike && opt.type === parsed.type.toLowerCase()
          );

          if (option) {
            setCurrentBid(option.bid || 0);
            setCurrentAsk(option.ask || 0);

            const ladder = generateOptionLadder(option.bid, option.ask);
            setLadderData(ladder);

            console.log(`Generated options ladder for ${symbol}: Bid=${option.bid}, Ask=${option.ask}`);
            return;
          }
        }
      }

      // Fallback to generated data if API fails
      const fallbackBid = Math.max(0.05, currentPrice - 0.1);
      const fallbackAsk = currentPrice + 0.1;
      setCurrentBid(fallbackBid);
      setCurrentAsk(fallbackAsk);

      const ladder = generateOptionLadder(fallbackBid, fallbackAsk);
      setLadderData(ladder);
    } catch (error) {
      console.error("Error fetching option data:", error);

      // Fallback to generated data
      const fallbackBid = Math.max(0.05, currentPrice - 0.1);
      const fallbackAsk = currentPrice + 0.1;
      setCurrentBid(fallbackBid);
      setCurrentAsk(fallbackAsk);

      const ladder = generateOptionLadder(fallbackBid, fallbackAsk);
      setLadderData(ladder);
    }
  };

  // Fetch data when symbol changes or orders change
  useEffect(() => {
    if (symbol) {
      if (isOptionSymbol(symbol)) {
        fetchOptionData();
      } else {
        // For stocks, generate ladder around current price
        const ladder = generateStockLadder(currentPrice);
        setLadderData(ladder);
      }
    }
  }, [symbol, currentPrice, orders]); // Added orders dependency

  // Handle clicking on a price level to place limit order
  const handlePriceClick = (price: number, side: "buy" | "sell") => {
    if (side === "buy") {
      onBuyClick(price, "limit");
    } else {
      onSellClick(price, "limit");
    }
  };

  // Handle market orders
  const handleMarketBuy = () => {
    const price = isOptionSymbol(symbol) ? currentAsk : currentPrice;
    onBuyClick(price, "market");
  };

  const handleMarketSell = () => {
    const price = isOptionSymbol(symbol) ? currentBid : currentPrice;
    onSellClick(price, "market");
  };

  // Get orders at specific price
  const getOrdersAtPrice = (price: number, side: "buy" | "sell") => {
    const filteredOrders = orders.filter(
      (o) =>
        o.symbol === symbol &&
        o.side === side &&
        (o.status === "accepted" || o.status === "new" || o.status === "pending_new" || o.status === "pending_cancel") &&
        Math.abs(parseFloat(o.limit_price) - price) < 0.005 // Slightly more lenient price matching
    );

    // Debug logging for troubleshooting
    if (filteredOrders.length > 0) {
      console.log(
        `🎯 Orders at price ${price.toFixed(2)} for ${side}:`,
        filteredOrders.map((o) => ({
          id: o.id,
          price: o.limit_price,
          status: o.status,
          qty: o.qty,
          symbol: o.symbol,
        }))
      );
    }

    return filteredOrders;
  };

  // Cancel all orders for this symbol
  const handleCancelAll = async () => {
    if (!onCancelOrder) return;

    try {
      const symbolOrders = orders.filter((o) => o.symbol === symbol && (o.status === "accepted" || o.status === "new" || o.status === "pending_new"));
      await Promise.all(symbolOrders.map((order) => onCancelOrder(order.id)));
    } catch (error) {
      console.error("Error cancelling orders:", error);
    }
  };

  // Cancel individual order
  const handleCancelOrder = async (orderId: string) => {
    if (!onCancelOrder) return;

    setCancelingOrders((prev) => new Set(prev).add(orderId));
    try {
      await onCancelOrder(orderId);
    } finally {
      setCancelingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Flatten position
  const handleFlatten = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/positions/${symbol}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // TanStack Query will automatically refetch positions
      }
    } catch (error) {
      console.error("Error flattening position:", error);
    }
  };

  // Get current position
  const currentPosition = positions.find((p) => p.symbol === symbol);
  const netPosition = currentPosition ? parseInt(currentPosition.qty) * (currentPosition.side === "long" ? 1 : -1) : 0;

  // Generate contract display
  const contractDisplay = isOptionSymbol(symbol) ? parseOptionSymbol(symbol)?.display || symbol : symbol;

  const displayPrice = isOptionSymbol(symbol) ? (currentBid + currentAsk) / 2 || currentPrice : currentPrice;

  const spread = isOptionSymbol(symbol) ? currentAsk - currentBid : 0.01;

  return (
    <div className='bg-gray-900 border border-gray-600 rounded-lg overflow-hidden shadow-lg'>
      {/* Header */}
      <div className='bg-gray-800 p-4 border-b border-gray-600'>
        <div className='flex justify-between items-center mb-4'>
          <div className='text-gray-300 text-sm font-mono tracking-wider'>{contractDisplay}</div>
          <div className='flex items-center space-x-6'>
            {isOptionSymbol(symbol) ? (
              <div className='text-center'>
                <div className='text-yellow-400 font-bold text-2xl'>${displayPrice.toFixed(2)}</div>
                <div className='text-xs text-gray-400'>
                  Bid: ${currentBid.toFixed(2)} | Ask: ${currentAsk.toFixed(2)} | Spread: ${spread.toFixed(2)}
                </div>
              </div>
            ) : (
              <div className='text-yellow-400 font-bold text-2xl'>${displayPrice.toFixed(2)}</div>
            )}
            <div className='text-sm'>
              <div
                className={`font-semibold ${
                  currentPosition ? (parseFloat(currentPosition.unrealized_pl) >= 0 ? "text-green-400" : "text-red-400") : "text-gray-400"
                }`}
              >
                {currentPosition ? (parseFloat(currentPosition.unrealized_pl) >= 0 ? "+" : "") + parseFloat(currentPosition.unrealized_pl).toFixed(2) : "+0.00"}
              </div>
              <div className='text-gray-400'>Net: {netPosition}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex space-x-3'>
          <button
            onClick={handleMarketBuy}
            className='px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors shadow-md'
          >
            {isOptionSymbol(symbol) ? "Buy to Open" : "Buy MKT"}
          </button>
          <button onClick={handleMarketSell} className='px-6 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors shadow-md'>
            {isOptionSymbol(symbol) ? "Sell to Close" : "Sell MKT"}
          </button>
          <button
            onClick={handleFlatten}
            disabled={!currentPosition}
            className='px-6 py-2 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-md'
          >
            Flatten
          </button>
          <button
            onClick={handleCancelAll}
            className='px-6 py-2 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-700 transition-colors shadow-md flex items-center gap-2'
          >
            Cancel All
          </button>
        </div>
      </div>

      {/* Current Market Display */}
      {isOptionSymbol(symbol) && (
        <div className='bg-gray-800 border-b border-gray-600 p-3'>
          <div className='flex justify-center items-center space-x-8 text-sm'>
            <div className='flex items-center space-x-2'>
              <span className='text-gray-400'>Current Bid:</span>
              <span className='text-green-400 font-bold text-lg'>${currentBid.toFixed(2)}</span>
              <span className='text-gray-400 text-xs'>x 100</span>
            </div>
            <div className='text-gray-500'>|</div>
            <div className='flex items-center space-x-2'>
              <span className='text-gray-400'>Current Ask:</span>
              <span className='text-red-400 font-bold text-lg'>${currentAsk.toFixed(2)}</span>
              <span className='text-gray-400 text-xs'>x 100</span>
            </div>
            <div className='text-gray-500'>|</div>
            <div className='flex items-center space-x-2'>
              <span className='text-gray-400'>Spread:</span>
              <span className='text-yellow-400 font-bold'>${(currentAsk - currentBid).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Column Headers */}
      <div className='bg-gray-800 border-b border-gray-600'>
        <div className='grid grid-cols-5 text-gray-300 font-semibold text-sm'>
          <div className='p-3 text-center border-r border-gray-600 bg-green-900/30'>
            Buy Orders
            {orders.filter((o) => o.symbol === symbol && o.side === "buy" && (o.status === "accepted" || o.status === "new" || o.status === "pending_new"))
              .length > 0 && (
              <div className='text-green-400 text-xs mt-1'>
                {
                  orders.filter((o) => o.symbol === symbol && o.side === "buy" && (o.status === "accepted" || o.status === "new" || o.status === "pending_new"))
                    .length
                }{" "}
                active
              </div>
            )}
          </div>
          <div className='p-3 text-center border-r border-gray-600'>Bid Size</div>
          <div className='p-3 text-center border-r border-gray-600 bg-gray-700'>Price</div>
          <div className='p-3 text-center border-r border-gray-600'>Ask Size</div>
          <div className='p-3 text-center bg-red-900/30'>
            Sell Orders
            {orders.filter((o) => o.symbol === symbol && o.side === "sell" && (o.status === "accepted" || o.status === "new" || o.status === "pending_new"))
              .length > 0 && (
              <div className='text-red-400 text-xs mt-1'>
                {
                  orders.filter(
                    (o) => o.symbol === symbol && o.side === "sell" && (o.status === "accepted" || o.status === "new" || o.status === "pending_new")
                  ).length
                }{" "}
                active
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Ladder */}
      <div className='max-h-96 overflow-y-auto bg-gray-900'>
        {ladderData.map((row, index) => {
          const buyOrdersAtPrice = getOrdersAtPrice(row.price, "buy");
          const sellOrdersAtPrice = getOrdersAtPrice(row.price, "sell");
          const isNearCurrentPrice = isOptionSymbol(symbol) ? row.isCurrentBid || row.isCurrentAsk : Math.abs(row.price - currentPrice) < 0.025;
          const hasFills = row.filledQuantity && row.filledQuantity > 0;
          const hasOrders = buyOrdersAtPrice.length > 0 || sellOrdersAtPrice.length > 0;

          return (
            <div
              key={index}
              className={`grid grid-cols-5 border-b border-gray-700 text-sm hover:bg-gray-800/50 transition-colors
                  ${row.isCurrentBid ? "bg-green-900/40 border-green-500/50 shadow-lg" : ""}
                  ${row.isCurrentAsk ? "bg-red-900/40 border-red-500/50 shadow-lg" : ""}
                  ${hasFills ? "bg-blue-900/30 border-blue-500/30" : ""}
                  ${hasOrders ? "bg-purple-900/20 border-purple-500/30" : ""}
                  ${isNearCurrentPrice && !row.isCurrentBid && !row.isCurrentAsk ? "bg-yellow-900/20" : ""}`}
            >
              {/* Buy Orders */}
              <div className='p-2 text-center border-r border-gray-700 bg-green-900/20'>
                {buyOrdersAtPrice.map((order, i) => (
                  <div key={i} className='bg-green-600 text-white px-2 py-1 rounded text-xs font-bold mb-1 relative group'>
                    <span>{order.qty}</span>
                    {onCancelOrder && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOrder(order.id);
                        }}
                        disabled={cancelingOrders.has(order.id)}
                        className='absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs rounded-full w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'
                        title='Cancel order'
                      >
                        {cancelingOrders.has(order.id) ? <div className='animate-spin rounded-full h-2 w-2 border-b border-white'></div> : "×"}
                      </button>
                    )}
                  </div>
                ))}
                {/* Show filled buys */}
                {hasFills && <div className='bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold mb-1'>FILLED: {row.filledQuantity}</div>}
              </div>

              {/* Bid Size & Current Bid Indicator */}
              <div
                className={`p-2 text-center border-r border-gray-700 cursor-pointer hover:bg-green-900/40 transition-colors
                    ${row.isCurrentBid ? "bg-green-600/60 border-green-400" : ""}`}
                onClick={() => handlePriceClick(row.price, "buy")}
                title={`Click to place buy limit order at $${row.price.toFixed(2)}`}
              >
                {row.isCurrentBid && <div className='text-green-200 text-xs font-bold mb-1'>CURRENT BID</div>}
                <div className={`font-bold ${row.isCurrentBid ? "text-white text-lg" : "text-green-400"}`}>{row.bidSize}</div>
              </div>

              {/* Price */}
              <div
                className={`p-2 text-center border-r border-gray-700 font-mono font-bold
                  ${
                    row.isCurrentBid || row.isCurrentAsk
                      ? "text-yellow-200 text-xl bg-gray-600/50"
                      : hasFills
                      ? "text-blue-200 text-lg"
                      : hasOrders
                      ? "text-purple-200 text-lg"
                      : "text-white text-lg"
                  }`}
              >
                ${row.price.toFixed(2)}
                {hasFills && <div className='text-blue-300 text-xs font-normal'>Avg: ${row.avgFillPrice?.toFixed(2)}</div>}
                {hasOrders && !hasFills && (
                  <div className='text-purple-300 text-xs font-normal'>Orders: {buyOrdersAtPrice.length + sellOrdersAtPrice.length}</div>
                )}
              </div>

              {/* Ask Size & Current Ask Indicator */}
              <div
                className={`p-2 text-center border-r border-gray-700 cursor-pointer hover:bg-red-900/40 transition-colors
                    ${row.isCurrentAsk ? "bg-red-600/60 border-red-400" : ""}`}
                onClick={() => handlePriceClick(row.price, "sell")}
                title={`Click to place sell limit order at $${row.price.toFixed(2)}`}
              >
                {row.isCurrentAsk && <div className='text-red-200 text-xs font-bold mb-1'>CURRENT ASK</div>}
                <div className={`font-bold ${row.isCurrentAsk ? "text-white text-lg" : "text-red-400"}`}>{row.askSize}</div>
              </div>

              {/* Sell Orders */}
              <div className='p-2 text-center bg-red-900/20'>
                {sellOrdersAtPrice.map((order, i) => (
                  <div key={i} className='bg-red-600 text-white px-2 py-1 rounded text-xs font-bold mb-1 relative group'>
                    <span>{order.qty}</span>
                    {onCancelOrder && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOrder(order.id);
                        }}
                        disabled={cancelingOrders.has(order.id)}
                        className='absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs rounded-full w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'
                        title='Cancel order'
                      >
                        {cancelingOrders.has(order.id) ? <div className='animate-spin rounded-full h-2 w-2 border-b border-white'></div> : "×"}
                      </button>
                    )}
                  </div>
                ))}
                {/* Show filled sells */}
                {hasFills && <div className='bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold mb-1'>FILLED: {row.filledQuantity}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className='bg-gray-800 p-3 border-t border-gray-600 text-sm text-gray-400'>
        <div className='flex justify-between items-center'>
          <span>
            {isOptionSymbol(symbol)
              ? `Click price levels to place limit orders • Increment: ${getPriceIncrement().toFixed(2)}`
              : "Click bid to BUY • Click ask to SELL"}
          </span>
          <span>
            Orders: {orders.filter((o) => o.symbol === symbol && (o.status === "accepted" || o.status === "new" || o.status === "pending_new")).length} |
            Position: {currentPosition ? currentPosition.qty : "0"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BidAskLadder;
