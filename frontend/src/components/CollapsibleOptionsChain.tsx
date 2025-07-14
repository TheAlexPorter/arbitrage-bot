import React, { useState } from "react";
import { useAllOptions } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";

interface CollapsibleOptionsChainProps {
  symbol: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface OptionContract {
  symbol: string;
  strike: number;
  expiration: string;
  type: "call" | "put";
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  pricingSource: string;
}

const CollapsibleOptionsChain: React.FC<CollapsibleOptionsChainProps> = ({ symbol, isCollapsed = false, onToggleCollapse }) => {
  const toast = useToast();
  const [expandedExpirations, setExpandedExpirations] = useState<Set<string>>(new Set());

  // Use the new API hook to get all options for all expirations
  const { data: optionsData, isLoading, error } = useAllOptions(symbol);

  const handleExpirationToggle = (expiration: string) => {
    const newExpanded = new Set(expandedExpirations);
    if (newExpanded.has(expiration)) {
      newExpanded.delete(expiration);
    } else {
      newExpanded.add(expiration);
    }
    setExpandedExpirations(newExpanded);
  };

  const handleOptionClick = async (option: OptionContract) => {
    try {
      // Copy option symbol to clipboard
      await navigator.clipboard.writeText(option.symbol);
      toast.success("Option Copied", `${option.symbol} copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      toast.error("Copy Failed", "Failed to copy option symbol to clipboard");
    }
  };

  const formatExpiration = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return price > 0 ? price.toFixed(2) : "N/A";
  };

  const formatVolume = (volume: number) => {
    return volume > 0 ? volume.toLocaleString() : "N/A";
  };

  const getPricingSourceColor = (source: string) => {
    switch (source) {
      case "live_market_data":
        return "text-green-400";
      case "contract_data_only":
        return "text-yellow-400";
      case "no_data":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getPricingSourceText = (source: string) => {
    switch (source) {
      case "live_market_data":
        return "Live Data";
      case "contract_data_only":
        return "Contract Data Only";
      case "no_data":
        return "No Data";
      default:
        return "Unknown";
    }
  };

  if (!symbol) {
    return (
      <div className='bg-gray-800 border-t border-gray-700'>
        <div className='flex items-center justify-between p-3'>
          <h3 className='text-white font-bold text-sm sm:text-base'>Options Chain</h3>
          {onToggleCollapse && (
            <button onClick={onToggleCollapse} className='text-gray-400 hover:text-white transition-colors'>
              {isCollapsed ? "▼" : "▲"}
            </button>
          )}
        </div>
        {!isCollapsed && (
          <div className='p-4'>
            <div className='text-gray-400 text-center py-4'>
              <p>Select a stock symbol to view options chain</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='bg-gray-800 border-t border-gray-700'>
        <div className='flex items-center justify-between p-3'>
          <h3 className='text-white font-bold text-sm sm:text-base'>Options Chain - {symbol}</h3>
          {onToggleCollapse && (
            <button onClick={onToggleCollapse} className='text-gray-400 hover:text-white transition-colors'>
              {isCollapsed ? "▼" : "▲"}
            </button>
          )}
        </div>
        {!isCollapsed && (
          <div className='p-4'>
            <div className='animate-pulse'>
              <div className='h-4 bg-gray-600 rounded w-1/3 mb-4'></div>
              <div className='space-y-2'>
                <div className='h-3 bg-gray-600 rounded'></div>
                <div className='h-3 bg-gray-600 rounded w-5/6'></div>
                <div className='h-3 bg-gray-600 rounded w-4/6'></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-gray-800 border-t border-gray-700'>
        <div className='flex items-center justify-between p-3'>
          <h3 className='text-white font-bold text-sm sm:text-base'>Options Chain - {symbol}</h3>
          {onToggleCollapse && (
            <button onClick={onToggleCollapse} className='text-gray-400 hover:text-white transition-colors'>
              {isCollapsed ? "▼" : "▲"}
            </button>
          )}
        </div>
        {!isCollapsed && (
          <div className='p-4'>
            <div className='text-red-400'>
              <div className='font-semibold text-sm'>Error Loading Options Chain</div>
              <div className='text-xs mt-1'>Failed to load options data for {symbol}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const expirations = optionsData?.expirations || {};
  const expirationDates = Object.keys(expirations).sort();

  return (
    <div className='bg-gray-800 border-t border-gray-700'>
      {/* Header */}
      <div className='flex items-center justify-between p-3'>
        <div className='flex items-center space-x-3'>
          <h3 className='text-white font-bold text-sm sm:text-base'>Options Chain - {symbol}</h3>
          <div className={`text-xs ${getPricingSourceColor(optionsData?.pricing_source || "no_data")}`}>
            {getPricingSourceText(optionsData?.pricing_source || "no_data")}
          </div>
        </div>
        {onToggleCollapse && (
          <button onClick={onToggleCollapse} className='text-gray-400 hover:text-white transition-colors'>
            {isCollapsed ? "▼" : "▲"}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className='p-3 max-h-96 overflow-y-auto'>
          {expirationDates.length === 0 ? (
            <div className='text-gray-400 text-center py-4'>
              <p>No options data available for {symbol}</p>
              <p className='text-xs mt-2'>{optionsData?.note}</p>
            </div>
          ) : (
            <div className='space-y-2'>
              {expirationDates.map((expiration) => {
                const options = expirations[expiration] as OptionContract[];
                const isExpanded = expandedExpirations.has(expiration);

                // Group options by strike price
                const groupedOptions = options.reduce((acc, option) => {
                  if (!acc[option.strike]) {
                    acc[option.strike] = { calls: [], puts: [] };
                  }
                  if (option.type === "call") {
                    acc[option.strike].calls.push(option);
                  } else {
                    acc[option.strike].puts.push(option);
                  }
                  return acc;
                }, {} as Record<number, { calls: OptionContract[]; puts: OptionContract[] }>);

                const strikes = Object.keys(groupedOptions)
                  .map(Number)
                  .sort((a, b) => a - b);

                return (
                  <div key={expiration} className='border border-gray-600 rounded-lg'>
                    {/* Expiration Header */}
                    <button
                      onClick={() => handleExpirationToggle(expiration)}
                      className='w-full p-2 text-left bg-gray-700 hover:bg-gray-600 transition-colors rounded-t-lg flex items-center justify-between'
                    >
                      <div className='flex items-center space-x-3'>
                        <span className='text-white font-semibold text-sm'>{formatExpiration(expiration)}</span>
                        <span className='text-gray-400 text-xs'>{options.length} contracts</span>
                      </div>
                      <span className='text-gray-400 text-sm'>{isExpanded ? "▼" : "▶"}</span>
                    </button>

                    {/* Options Table */}
                    {isExpanded && (
                      <div className='overflow-x-auto'>
                        <table className='w-full text-xs'>
                          <thead className='bg-gray-700 border-b border-gray-600'>
                            <tr>
                              <th className='text-left p-1 text-gray-300'>Calls</th>
                              <th className='text-center p-1 text-gray-300'>Bid</th>
                              <th className='text-center p-1 text-gray-300'>Ask</th>
                              <th className='text-center p-1 text-gray-300'>Last</th>
                              <th className='text-center p-1 text-gray-300'>Vol</th>
                              <th className='text-center p-1 bg-yellow-900/30 font-bold'>Strike</th>
                              <th className='text-center p-1 text-gray-300'>Vol</th>
                              <th className='text-center p-1 text-gray-300'>Last</th>
                              <th className='text-center p-1 text-gray-300'>Ask</th>
                              <th className='text-center p-1 text-gray-300'>Bid</th>
                              <th className='text-right p-1 text-gray-300'>Puts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {strikes.map((strike) => {
                              const callOption = groupedOptions[strike].calls[0];
                              const putOption = groupedOptions[strike].puts[0];

                              return (
                                <tr key={strike} className='border-b border-gray-700 hover:bg-gray-700/50'>
                                  {/* Call Side */}
                                  <td className='p-1'>
                                    {callOption && (
                                      <button
                                        onClick={() => handleOptionClick(callOption)}
                                        className='text-green-400 hover:text-green-300 font-mono text-xs transition-all duration-200 hover:bg-green-900/30 px-1 py-1 rounded w-full text-left cursor-pointer'
                                        title={`Click to copy: ${callOption.symbol}`}
                                      >
                                        {callOption.symbol.slice(-12)}
                                      </button>
                                    )}
                                  </td>
                                  <td className='text-center p-1 text-green-400'>{callOption ? `$${formatPrice(callOption.bid)}` : "-"}</td>
                                  <td className='text-center p-1 text-green-400'>{callOption ? `$${formatPrice(callOption.ask)}` : "-"}</td>
                                  <td className='text-center p-1 text-white'>{callOption ? `$${formatPrice(callOption.last)}` : "-"}</td>
                                  <td className='text-center p-1 text-gray-400'>{callOption ? formatVolume(callOption.volume) : "-"}</td>

                                  {/* Strike Price */}
                                  <td className='text-center p-1 bg-yellow-900/20 text-yellow-200 font-bold'>${strike}</td>

                                  {/* Put Side */}
                                  <td className='text-center p-1 text-gray-400'>{putOption ? formatVolume(putOption.volume) : "-"}</td>
                                  <td className='text-center p-1 text-white'>{putOption ? `$${formatPrice(putOption.last)}` : "-"}</td>
                                  <td className='text-center p-1 text-red-400'>{putOption ? `$${formatPrice(putOption.ask)}` : "-"}</td>
                                  <td className='text-center p-1 text-red-400'>{putOption ? `$${formatPrice(putOption.bid)}` : "-"}</td>
                                  <td className='p-1'>
                                    {putOption && (
                                      <button
                                        onClick={() => handleOptionClick(putOption)}
                                        className='text-red-400 hover:text-red-300 font-mono text-xs transition-all duration-200 hover:bg-red-900/30 px-1 py-1 rounded w-full text-right cursor-pointer'
                                        title={`Click to copy: ${putOption.symbol}`}
                                      >
                                        {putOption.symbol.slice(-12)}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollapsibleOptionsChain;
