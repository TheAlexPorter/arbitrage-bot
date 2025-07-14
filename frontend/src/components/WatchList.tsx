import React, { useState } from "react";
import { useToast } from "../hooks/useToast";

import { useQuote, useOptionQuote } from "../hooks/useApi";

interface WatchListItem {
  id: string;
  symbol: string;
  addedAt: Date;
  isActive: boolean;
  lastPrice?: number;
  change?: number;
  changePercent?: number;
}

interface WatchListProps {
  activeInstrument: string;
  onInstrumentSelect: (symbol: string) => void;
  onNewOptionAdded?: (symbol: string) => void;
}

const WatchList: React.FC<WatchListProps> = ({ activeInstrument, onInstrumentSelect, onNewOptionAdded }) => {
  const toast = useToast();
  const [newSymbol, setNewSymbol] = useState("");
  const [showPasteHelper, setShowPasteHelper] = useState(false);

  // Use localStorage for watchlist persistence
  const [watchList, setWatchList] = useState<WatchListItem[]>(() => {
    const saved = localStorage.getItem("optionsWatchList");
    if (saved) {
      try {
        return JSON.parse(saved).map((item: Record<string, unknown>) => ({
          ...item,
          addedAt: new Date(item.addedAt as string),
        }));
      } catch (error) {
        console.error("Error loading watchlist:", error);
      }
    }
    return [];
  });

  // Update active status when activeInstrument changes
  React.useEffect(() => {
    setWatchList((prev) =>
      prev.map((item) => ({
        ...item,
        isActive: item.symbol === activeInstrument,
      }))
    );
  }, [activeInstrument]);

  // Save to localStorage whenever watchlist changes
  React.useEffect(() => {
    localStorage.setItem("optionsWatchList", JSON.stringify(watchList));
  }, [watchList]);

  // Add new symbol to watchlist
  const addSymbol = (symbol: string) => {
    const trimmedSymbol = symbol.trim().toUpperCase();

    if (!trimmedSymbol) return;

    // Check if symbol already exists
    if (watchList.some((item) => item.symbol === trimmedSymbol)) {
      toast.warning("Already Added", `${trimmedSymbol} is already in your watchlist`);
      return;
    }

    const newItem: WatchListItem = {
      id: `${trimmedSymbol}-${Date.now()}`,
      symbol: trimmedSymbol,
      addedAt: new Date(),
      isActive: false,
    };

    setWatchList((prev) => [newItem, ...prev]);
    setNewSymbol("");

    if (onNewOptionAdded) {
      onNewOptionAdded(trimmedSymbol);
    }
  };

  // Remove symbol from watchlist
  const removeSymbol = (id: string) => {
    setWatchList((prev) => prev.filter((item) => item.id !== id));
  };

  // Handle manual input
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSymbol(newSymbol);
  };

  // Handle paste functionality
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        addSymbol(text);
        setShowPasteHelper(false);
      }
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      toast.error("Clipboard Error", "Failed to paste from clipboard. Please paste manually.");
    }
  };

  // Handle clicking on watchlist item
  const handleItemClick = (symbol: string) => {
    onInstrumentSelect(symbol);
  };

  // Check if symbol looks like an option
  const isOptionSymbol = (symbol: string) => {
    // Options typically have format like: AAPL240119C00150000
    return /^[A-Z]+\d{6}[CP]\d{8}$/.test(symbol);
  };

  // Format option symbol for display
  const formatOptionDisplay = (symbol: string) => {
    if (!isOptionSymbol(symbol)) return symbol;

    // Extract parts of option symbol
    const match = symbol.match(/^([A-Z]+)(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/);
    if (!match) return symbol;

    const [, ticker, year, month, day, type, strikeRaw] = match;
    const strike = parseInt(strikeRaw) / 1000;
    const expiry = `${month}/${day}/${year}`;
    const optionType = type === "C" ? "Call" : "Put";

    return {
      ticker,
      expiry,
      type: optionType,
      strike: `$${strike}`,
      display: `${ticker} ${expiry} ${strike}${type}`,
    };
  };

  // Clear all items
  const clearWatchList = () => {
    if (confirm("Clear all items from watchlist?")) {
      setWatchList([]);
      toast.success("Watchlist Cleared", "All items have been removed from your watchlist");
    }
  };

  return (
    <div className='bg-gray-800 border border-gray-600 rounded-lg overflow-hidden h-full flex flex-col'>
      {/* Header */}
      <div className='bg-gray-700 p-4 border-b border-gray-600'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-white font-bold text-lg'>Watch List</h3>
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setShowPasteHelper(!showPasteHelper)}
              className='px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700'
              title='Paste from clipboard'
            >
              📋 Paste
            </button>
            {watchList.length > 0 && (
              <button onClick={clearWatchList} className='px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700' title='Clear all'>
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Paste Helper */}
        {showPasteHelper && (
          <div className='mb-4 p-3 bg-blue-900/30 border border-blue-500 rounded'>
            <p className='text-blue-200 text-sm mb-2'>Paste option symbol from clipboard:</p>
            <button onClick={handlePaste} className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full'>
              Paste from Clipboard
            </button>
          </div>
        )}

        {/* Manual Input */}
        <form onSubmit={handleSubmit} className='flex gap-2'>
          <input
            type='text'
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder='Enter option symbol...'
            className='flex-1 px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none text-sm'
          />
          <button type='submit' className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm'>
            Add
          </button>
        </form>
      </div>

      {/* Watch List Items */}
      <div className='flex-1 overflow-y-auto'>
        {watchList.length === 0 ? (
          <div className='p-8 text-center text-gray-400'>
            <p>No symbols in watchlist</p>
            <p className='text-sm mt-2'>Add symbols to track their prices</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-600'>
            {watchList.map((item) => (
              <WatchListItem
                key={item.id}
                item={item}
                onRemove={removeSymbol}
                onClick={handleItemClick}
                formatOptionDisplay={formatOptionDisplay}
                isOptionSymbol={isOptionSymbol}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Separate component for watchlist items with price data
interface WatchListItemProps {
  item: WatchListItem;
  onRemove: (id: string) => void;
  onClick: (symbol: string) => void;
  formatOptionDisplay: (symbol: string) => string | { ticker: string; expiry: string; type: string; strike: string; display: string };
  isOptionSymbol: (symbol: string) => boolean;
}

const WatchListItem: React.FC<WatchListItemProps> = ({ item, onRemove, onClick, formatOptionDisplay, isOptionSymbol }) => {
  const isOption = isOptionSymbol(item.symbol);

  // Use TanStack Query for price data
  const quoteQuery = useQuote(isOption ? "" : item.symbol);
  const optionQuoteQuery = useOptionQuote(isOption ? item.symbol : "");

  const priceData = isOption ? optionQuoteQuery.data : quoteQuery.data;
  const isLoading = isOption ? optionQuoteQuery.isLoading : quoteQuery.isLoading;
  const error = isOption ? optionQuoteQuery.error : quoteQuery.error;

  const currentPrice = priceData ? (isOption ? (priceData.bid + priceData.ask) / 2 : (parseFloat(priceData.bid) + parseFloat(priceData.ask)) / 2) : undefined;

  const displayInfo = isOption ? formatOptionDisplay(item.symbol) : { display: item.symbol };

  // Type guard for option display info
  const isOptionDisplay = (
    info: string | { ticker: string; expiry: string; type: string; strike: string; display: string }
  ): info is { ticker: string; expiry: string; type: string; strike: string; display: string } => {
    return typeof info === "object" && info !== null && "ticker" in info;
  };

  return (
    <div
      className={`p-3 cursor-pointer transition-colors ${item.isActive ? "bg-blue-600/20 border-l-4 border-blue-500" : "hover:bg-gray-700"}`}
      onClick={() => onClick(item.symbol)}
    >
      <div className='flex justify-between items-start'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center space-x-2'>
            <span className='text-white font-medium truncate'>{isOptionDisplay(displayInfo) ? displayInfo.display : displayInfo}</span>
            {isOption && isOptionDisplay(displayInfo) && (
              <span className={`text-xs px-1 py-0.5 rounded ${displayInfo.type === "Call" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
                {displayInfo.type}
              </span>
            )}
          </div>
          {isOption && isOptionDisplay(displayInfo) && (
            <div className='text-xs text-gray-400 mt-1'>
              {displayInfo.expiry} • {displayInfo.strike}
            </div>
          )}
          {isLoading ? (
            <div className='text-xs text-gray-400 mt-1'>Loading...</div>
          ) : error ? (
            <div className='text-xs text-red-400 mt-1'>Error loading price</div>
          ) : currentPrice ? (
            <div className='text-sm text-green-400 mt-1'>${currentPrice.toFixed(2)}</div>
          ) : (
            <div className='text-xs text-gray-400 mt-1'>No price data</div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className='ml-2 text-gray-400 hover:text-red-400 transition-colors'
          title='Remove from watchlist'
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default WatchList;
