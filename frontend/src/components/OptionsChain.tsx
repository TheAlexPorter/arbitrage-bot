import React, { useState, useEffect } from "react";
import { useOptionsChain, useOptionsExpirations, type Option } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";

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
}

interface OptionsChainProps {
  symbol: string;
  contractQuantity?: number;
  setContractQuantity?: (quantity: number) => void;
}

const OptionsChain: React.FC<OptionsChainProps> = ({ symbol, contractQuantity = 1, setContractQuantity }) => {
  const toast = useToast();
  const [selectedExpiration, setSelectedExpiration] = useState<string>("");

  // Use TanStack Query hooks
  const { data: expirations = [] } = useOptionsExpirations(symbol);
  const { data: optionsData = [], isLoading, error } = useOptionsChain(symbol, selectedExpiration);

  // Set initial expiration when expirations are loaded
  useEffect(() => {
    if (expirations.length > 0 && !selectedExpiration) {
      setSelectedExpiration(expirations[0]);
    }
  }, [expirations, selectedExpiration]);

  // Transform options data to our format
  const transformedOptions: OptionContract[] = optionsData.map((option: Option) => ({
    symbol: option.symbol,
    strike: option.strike,
    expiration: option.expiration || "",
    type: option.type as "call" | "put",
    bid: option.bid || 0,
    ask: option.ask || 0,
    last: option.last || 0,
    volume: option.volume || 0,
    openInterest: option.open_interest || 0,
    impliedVolatility: option.implied_volatility || 0,
  }));

  // Group options by strike price
  const groupedOptions = transformedOptions.reduce((acc, option) => {
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

  const handleOptionClick = async (option: OptionContract) => {
    try {
      // Copy option symbol to clipboard
      await navigator.clipboard.writeText(option.symbol);

      // Show success notification
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
    return price.toFixed(2);
  };

  const formatVolume = (volume: number) => {
    return volume.toLocaleString();
  };

  if (!symbol) {
    return (
      <div className='bg-gray-800 border border-gray-600 rounded-lg p-4'>
        <div className='text-gray-400 text-center py-8'>
          <p>Select a stock symbol to view options chain</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='bg-gray-800 border border-gray-600 rounded-lg p-4'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-600 rounded w-1/3 mb-4'></div>
          <div className='space-y-2'>
            <div className='h-3 bg-gray-600 rounded'></div>
            <div className='h-3 bg-gray-600 rounded w-5/6'></div>
            <div className='h-3 bg-gray-600 rounded w-4/6'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-gray-800 border border-red-600 rounded-lg p-4'>
        <div className='text-red-400'>
          <div className='font-semibold'>Error Loading Options Chain</div>
          <div className='text-sm mt-1'>Failed to load options data for {symbol}</div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gray-800 border border-gray-600 rounded-lg p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-white font-bold text-lg'>Options Chain - {symbol}</h3>
        <div className='flex items-center space-x-4'>
          {/* Contract Quantity Control */}
          {setContractQuantity && (
            <div className='flex items-center space-x-2'>
              <label className='text-gray-400 text-sm'>Contracts:</label>
              <div className='flex items-center space-x-1'>
                <button
                  onClick={() => setContractQuantity(Math.max(1, contractQuantity - 1))}
                  className='px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm'
                >
                  -
                </button>
                <span className='px-2 py-1 bg-gray-700 text-white text-sm min-w-[2rem] text-center'>{contractQuantity}</span>
                <button
                  onClick={() => setContractQuantity(contractQuantity + 1)}
                  className='px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm'
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className='flex items-center space-x-2'>
            <label className='text-gray-400 text-sm'>Expiration:</label>
            <select
              value={selectedExpiration}
              onChange={(e) => setSelectedExpiration(e.target.value)}
              className='bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none'
            >
              {expirations.map((exp) => (
                <option key={exp} value={exp}>
                  {formatExpiration(exp)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {strikes.length === 0 ? (
        <div className='text-gray-400 text-center py-8'>
          <p>No options data available for {symbol}</p>
          <p className='text-sm mt-2'>Try selecting a different expiration date</p>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-gray-700 border-b border-gray-600'>
              <tr>
                <th className='text-left p-3 text-gray-300'>Calls</th>
                <th className='text-center p-3 text-gray-300'>Bid</th>
                <th className='text-center p-3 text-gray-300'>Ask</th>
                <th className='text-center p-3 text-gray-300'>Last</th>
                <th className='text-center p-3 text-gray-300'>Vol</th>
                <th className='text-center p-3 text-gray-300 bg-yellow-900/30 font-bold'>Strike</th>
                <th className='text-center p-3 text-gray-300'>Vol</th>
                <th className='text-center p-3 text-gray-300'>Last</th>
                <th className='text-center p-3 text-gray-300'>Ask</th>
                <th className='text-center p-3 text-gray-300'>Bid</th>
                <th className='text-right p-3 text-gray-300'>Puts</th>
              </tr>
            </thead>
            <tbody>
              {strikes.map((strike) => {
                const callOption = groupedOptions[strike].calls[0];
                const putOption = groupedOptions[strike].puts[0];

                return (
                  <tr key={strike} className='border-b border-gray-700 hover:bg-gray-700/50'>
                    {/* Call Side */}
                    <td className='p-2'>
                      {callOption && (
                        <button
                          onClick={() => handleOptionClick(callOption)}
                          className='text-green-400 hover:text-green-300 font-mono text-xs transition-all duration-200 hover:bg-green-900/30 px-2 py-1 rounded w-full text-left cursor-pointer'
                          title={`Click to copy: ${callOption.symbol}`}
                        >
                          {callOption.symbol.slice(-15)}
                        </button>
                      )}
                    </td>
                    <td className='text-center p-2 text-green-400'>{callOption ? `$${formatPrice(callOption.bid)}` : "-"}</td>
                    <td className='text-center p-2 text-green-400'>{callOption ? `$${formatPrice(callOption.ask)}` : "-"}</td>
                    <td className='text-center p-2 text-white'>{callOption ? `$${formatPrice(callOption.last)}` : "-"}</td>
                    <td className='text-center p-2 text-gray-400'>{callOption ? formatVolume(callOption.volume) : "-"}</td>

                    {/* Strike Price */}
                    <td className='text-center p-2 bg-yellow-900/20 text-yellow-200 font-bold'>${strike}</td>

                    {/* Put Side */}
                    <td className='text-center p-2 text-gray-400'>{putOption ? formatVolume(putOption.volume) : "-"}</td>
                    <td className='text-center p-2 text-white'>{putOption ? `$${formatPrice(putOption.last)}` : "-"}</td>
                    <td className='text-center p-2 text-red-400'>{putOption ? `$${formatPrice(putOption.ask)}` : "-"}</td>
                    <td className='text-center p-2 text-red-400'>{putOption ? `$${formatPrice(putOption.bid)}` : "-"}</td>
                    <td className='p-2'>
                      {putOption && (
                        <button
                          onClick={() => handleOptionClick(putOption)}
                          className='text-red-400 hover:text-red-300 font-mono text-xs transition-all duration-200 hover:bg-red-900/30 px-2 py-1 rounded w-full text-right cursor-pointer'
                          title={`Click to copy: ${putOption.symbol}`}
                        >
                          {putOption.symbol.slice(-15)}
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

      <div className='mt-4 text-xs text-gray-500'>
        <p>💡 Click on any option symbol to copy it to clipboard and add it to your watchlist</p>
        <p className='mt-1'>OI = Open Interest • IV = Implied Volatility • Data updates automatically</p>
      </div>
    </div>
  );
};

export default OptionsChain;
