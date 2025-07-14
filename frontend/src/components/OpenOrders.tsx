import React, { useState } from "react";
import type { Order } from "../hooks/useApi";

interface OpenOrdersProps {
  orders: Order[];
  onCancelOrder: (orderId: string) => void;
  onCancelAllOrders: () => void;
  onRefresh?: () => void;
}

const OpenOrders: React.FC<OpenOrdersProps> = ({ orders, onCancelOrder, onCancelAllOrders, onRefresh }) => {
  const [cancelingOrders, setCancelingOrders] = useState<Set<string>>(new Set());
  const [cancelingAll, setCancelingAll] = useState(false);

  const handleCancelOrder = async (orderId: string) => {
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

  const handleCancelAllOrders = async () => {
    setCancelingAll(true);
    try {
      await onCancelAllOrders();
    } finally {
      setCancelingAll(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getOrderTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "limit":
        return "text-blue-400";
      case "market":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getSideColor = (side: string) => {
    switch (side.toLowerCase()) {
      case "buy":
      case "buy_to_open":
        return "text-green-400";
      case "sell":
      case "sell_to_close":
      case "sell_to_open":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getAssetClassIcon = (assetClass?: string) => {
    if (assetClass === "us_option") {
      return "📊";
    }
    return "📈";
  };

  const openOrders = orders.filter((order) => order.status === "accepted" || order.status === "pending_new" || order.status === "pending_cancel");

  if (openOrders.length === 0) {
    return (
      <div className='bg-gray-800 rounded-lg border border-gray-600 p-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-white font-bold text-lg'>Open Orders</h3>
          {onRefresh && (
            <button onClick={onRefresh} className='text-blue-400 hover:text-blue-300 text-sm'>
              🔄 Refresh
            </button>
          )}
        </div>
        <div className='text-gray-400 text-center py-8'>
          <p>No open orders</p>
          <p className='text-sm mt-2'>Place orders using the bid/ask ladder</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gray-800 rounded-lg border border-gray-600 p-4'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-white font-bold text-lg'>Open Orders ({openOrders.length})</h3>
        <div className='flex items-center gap-2'>
          <button
            onClick={handleCancelAllOrders}
            disabled={cancelingAll}
            className='px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors flex items-center gap-1'
          >
            {cancelingAll ? (
              <>
                <div className='animate-spin rounded-full h-3 w-3 border-b border-white'></div>
                Canceling...
              </>
            ) : (
              "Cancel All"
            )}
          </button>
          {onRefresh && (
            <button onClick={onRefresh} className='text-blue-400 hover:text-blue-300 text-sm'>
              🔄 Refresh
            </button>
          )}
        </div>
      </div>

      <div className='space-y-2 max-h-96 overflow-y-auto'>
        {openOrders.map((order) => (
          <div key={order.id} className='bg-gray-700 rounded border border-gray-600 p-3 hover:bg-gray-650 transition-colors'>
            <div className='flex justify-between items-start'>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='text-sm'>{getAssetClassIcon(order.asset_class)}</span>
                  <span className='text-white font-semibold'>{order.symbol}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getSideColor(order.side)}`}>{order.side.replace("_", " ").toUpperCase()}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getOrderTypeColor(order.type)}`}>{order.type.toUpperCase()}</span>
                </div>

                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-400'>Qty: </span>
                    <span className='text-white'>{order.qty}</span>
                    {order.filled_qty && order.filled_qty !== "0" && <span className='text-green-400 ml-1'>({order.filled_qty} filled)</span>}
                  </div>
                  <div>
                    <span className='text-gray-400'>Price: </span>
                    <span className='text-white'>{order.limit_price ? `$${parseFloat(order.limit_price).toFixed(2)}` : "Market"}</span>
                  </div>
                </div>

                <div className='text-xs text-gray-500 mt-1'>
                  {formatTime(order.created_at)}
                  {order.position_intent && <span className='ml-2 text-blue-400'>{order.position_intent.replace("_", " ")}</span>}
                </div>
              </div>

              <button
                onClick={() => handleCancelOrder(order.id)}
                disabled={cancelingOrders.has(order.id)}
                className='ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors flex items-center gap-1'
              >
                {cancelingOrders.has(order.id) ? (
                  <>
                    <div className='animate-spin rounded-full h-2 w-2 border-b border-white'></div>
                    Canceling...
                  </>
                ) : (
                  "Cancel"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OpenOrders;
