import { useState } from "react";
import { useToast } from "../hooks/useToast";
import { useTradingMode, useSetTradingMode } from "../hooks/useApi";

interface TradingModeToggleProps {
  onModeChange?: (mode: "paper" | "live") => void;
}

const TradingModeToggle: React.FC<TradingModeToggleProps> = ({ onModeChange }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Use TanStack Query hooks
  const { data: tradingMode = "paper" } = useTradingMode();
  const setTradingModeMutation = useSetTradingMode();

  // Toggle trading mode
  const handleToggle = async () => {
    const newMode = tradingMode === "paper" ? "live" : "paper";

    setLoading(true);
    try {
      await setTradingModeMutation.mutateAsync(newMode);

      // Show success notification
      toast.success("Trading Mode Changed", `Successfully switched to ${newMode} trading`);

      // Notify parent component
      if (onModeChange) {
        onModeChange(newMode);
      }
    } catch (error) {
      console.error("Error changing trading mode:", error);
      toast.error("Mode Change Failed", error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-between w-full max-w-md mx-auto'>
      <div className='flex items-center space-x-3'>
        <div className='text-white font-semibold text-sm sm:text-base'>Trading Mode</div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${tradingMode === "paper" ? "bg-blue-900 text-blue-200" : "bg-red-900 text-red-200"}`}>
          {tradingMode === "paper" ? "📄 Paper" : "💰 Live"}
        </div>
      </div>

      <div className='flex items-center space-x-2 sm:space-x-3'>
        {/* Warning for live trading */}
        {tradingMode === "live" && <div className='text-red-400 text-xs font-medium hidden sm:block'>⚠️ REAL MONEY</div>}

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
            tradingMode === "live" ? "bg-red-600" : "bg-blue-600"
          } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
              tradingMode === "live" ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>

        {/* Labels */}
        <div className='flex flex-col text-xs text-gray-400'>
          <span className={tradingMode === "paper" ? "text-blue-400 font-medium" : ""}>Paper</span>
          <span className={tradingMode === "live" ? "text-red-400 font-medium" : ""}>Live</span>
        </div>
      </div>

      {loading && (
        <div className='absolute inset-0 bg-gray-800/50 flex items-center justify-center rounded-lg'>
          <div className='text-gray-400 text-xs'>🔄</div>
        </div>
      )}
    </div>
  );
};

export default TradingModeToggle;
