import { useState } from "react";
import { useAccount, usePortfolio, usePositions, useClosePosition } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";

interface AccountStatsProps {
  tradingMode?: "paper" | "live";
}

const AccountStats: React.FC<AccountStatsProps> = ({ tradingMode = "paper" }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Use TanStack Query hooks
  const { data: accountData, isLoading: accountLoading } = useAccount();
  const { data: portfolioData, isLoading: portfolioLoading } = usePortfolio();
  const { data: positions = [], isLoading: positionsLoading } = usePositions();
  const closePositionMutation = useClosePosition();

  const isLoading = accountLoading || portfolioLoading || positionsLoading;

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const handleClosePosition = async (symbol: string) => {
    setLoading(true);
    try {
      await closePositionMutation.mutateAsync(symbol);
      toast.success("Position Closed", `Position for ${symbol} has been closed successfully`);
    } catch (error) {
      console.error("Error closing position:", error);
      toast.error("Close Failed", "Failed to close position. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading && !accountData) {
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

  return (
    <div className='bg-gray-800 border border-gray-600 rounded-lg p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-white font-bold text-sm sm:text-base'>Account Overview</h3>
        <div className='flex items-center space-x-2'>
          <div className={`px-2 py-1 rounded text-xs font-medium ${tradingMode === "paper" ? "bg-blue-900 text-blue-200" : "bg-red-900 text-red-200"}`}>
            {tradingMode === "paper" ? "📄 Paper" : "💰 Live"}
          </div>
          {loading && <div className='text-gray-400 text-xs'>🔄</div>}
        </div>
      </div>

      {accountData && (
        <div className='grid grid-cols-1 gap-3 mb-4'>
          {/* Buying Power */}
          <div className='bg-gray-700 p-3 rounded'>
            <div className='text-gray-400 text-xs font-medium'>Buying Power</div>
            <div className='text-white text-sm sm:text-base font-bold'>{formatCurrency(accountData.buying_power)}</div>
          </div>

          {/* Portfolio Value */}
          <div className='bg-gray-700 p-3 rounded'>
            <div className='text-gray-400 text-xs font-medium'>Portfolio Value</div>
            <div className='text-white text-sm sm:text-base font-bold'>{formatCurrency(accountData.portfolio_value)}</div>
            {portfolioData && (
              <div className={`text-xs ${parseFloat(portfolioData.total_pl) >= 0 ? "text-green-400" : "text-red-400"}`}>
                P&L: {formatCurrency(portfolioData.total_pl)}
              </div>
            )}
          </div>

          {/* Account Status */}
          <div className='bg-gray-700 p-3 rounded'>
            <div className='text-gray-400 text-xs font-medium'>Status</div>
            <div className={`text-sm sm:text-base font-bold ${accountData.status === "ACTIVE" ? "text-green-400" : "text-red-400"}`}>{accountData.status}</div>
          </div>

          {/* Options Level */}
          <div className='bg-gray-700 p-3 rounded'>
            <div className='text-gray-400 text-xs font-medium'>Options Level</div>
            <div className='text-white text-sm sm:text-base font-bold'>Level {accountData.options_trading_level}</div>
          </div>
        </div>
      )}

      {/* Current Positions - Simplified */}
      {positions.length > 0 && (
        <div className='bg-gray-700 border border-gray-600 rounded-lg p-3'>
          <h4 className='text-white font-bold text-sm mb-2'>Positions ({positions.length})</h4>
          <div className='space-y-2 max-h-32 overflow-y-auto'>
            {positions.map((position, index) => (
              <div key={index} className='bg-gray-600 p-2 rounded text-xs'>
                <div className='flex justify-between items-center'>
                  <span className='text-white font-bold font-mono'>{position.symbol}</span>
                  <span className={`text-xs px-2 py-1 rounded ${position.side === "long" ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"}`}>
                    {position.side.toUpperCase()} {position.qty}
                  </span>
                </div>
                <div className='flex justify-between text-gray-400 mt-1'>
                  <span>
                    P&L: <span className={parseFloat(position.unrealized_pl) >= 0 ? "text-green-400" : "text-red-400"}>${position.unrealized_pl}</span>
                  </span>
                  <button
                    onClick={() => handleClosePosition(position.symbol)}
                    disabled={loading}
                    className='px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed'
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountStats;
