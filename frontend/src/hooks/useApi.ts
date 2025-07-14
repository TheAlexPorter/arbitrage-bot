import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface AccountInfo {
  status: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  max_margin_multiplier: string;
  regt_buying_power: string;
  daytrading_buying_power: string;
  effective_buying_power: string;
  options_buying_power: string;
  options_trading_level: string;
}

export interface Order {
  id: string;
  symbol: string;
  side: string;
  qty: string;
  type: string;
  status: string;
  limit_price: string;
  filled_qty: string;
  created_at: string;
  asset_class?: string;
  position_intent?: string;
}

export interface Position {
  symbol: string;
  side: string;
  qty: string;
  unrealized_pl: string;
  current_price: string;
}

export interface PortfolioData {
  total_pl: string;
  positions: string;
  open_orders: string;
  account: {
    equity: string;
  };
}

export interface Quote {
  bid: string;
  ask: string;
  last: string;
  volume: string;
}

export interface OptionQuote {
  bid: number;
  ask: number;
  last: number;
  volume: number;
}

export interface Option {
  symbol: string;
  strike: number;
  type: string;
  expiration: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  open_interest: number;
  implied_volatility: number;
}

// API functions
const API_BASE = "http://localhost:3001/api";

const fetchApi = async (endpoint: string) => {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
};

const postApi = async (endpoint: string, data: Record<string, unknown>) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
};

const deleteApi = async (endpoint: string) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
};

// Query keys
export const queryKeys = {
  account: ["account"] as const,
  positions: ["positions"] as const,
  orders: ["orders"] as const,
  portfolio: ["portfolio"] as const,
  quote: (symbol: string) => ["quote", symbol] as const,
  optionQuote: (symbol: string) => ["optionQuote", symbol] as const,
  optionsChain: (symbol: string, expiration?: string) => ["optionsChain", symbol, expiration] as const,
  optionsExpirations: (symbol: string) => ["optionsExpirations", symbol] as const,
  tradingMode: ["tradingMode"] as const,
  activity: ["activity"] as const,
};

// Hooks
export const useAccount = () => {
  return useQuery({
    queryKey: queryKeys.account,
    queryFn: () => fetchApi("/account"),
    select: (data) => data.account as AccountInfo,
  });
};

export const usePositions = () => {
  return useQuery({
    queryKey: queryKeys.positions,
    queryFn: () => fetchApi("/positions"),
    select: (data) => data.positions as Position[],
    refetchInterval: 2000, // Refresh every 2 seconds
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => fetchApi("/orders"),
    select: (data) => data.orders as Order[],
    refetchInterval: 2000, // Refresh every 2 seconds
  });
};

export const usePortfolio = () => {
  return useQuery({
    queryKey: queryKeys.portfolio,
    queryFn: () => fetchApi("/portfolio"),
    select: (data) => data.portfolio as PortfolioData,
    refetchInterval: 2000, // Refresh every 2 seconds
  });
};

export const useQuote = (symbol: string) => {
  return useQuery({
    queryKey: queryKeys.quote(symbol),
    queryFn: () => fetchApi(`/quote/${symbol}`),
    select: (data) => data.quote as Quote,
    enabled: !!symbol,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};

export const useOptionQuote = (symbol: string) => {
  return useQuery({
    queryKey: queryKeys.optionQuote(symbol),
    queryFn: () => fetchApi(`/options/quote/${symbol}`),
    select: (data) => data.quote as OptionQuote,
    enabled: !!symbol,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};

export const useOptionsChain = (symbol: string, expiration?: string) => {
  return useQuery({
    queryKey: queryKeys.optionsChain(symbol, expiration),
    queryFn: () => {
      const url = expiration ? `/options/chain/${symbol}?expiration=${expiration}` : `/options/chain/${symbol}`;
      return fetchApi(url);
    },
    select: (data) => data.options as Option[],
    enabled: !!symbol,
  });
};

export const useAllOptions = (symbol: string) => {
  return useQuery({
    queryKey: ["allOptions", symbol],
    queryFn: () => fetchApi(`/options/all/${symbol}`),
    enabled: !!symbol,
  });
};

export const useOptionsExpirations = (symbol: string) => {
  return useQuery({
    queryKey: queryKeys.optionsExpirations(symbol),
    queryFn: () => fetchApi(`/options/expirations/${symbol}`),
    select: (data) => data.expirations as string[],
    enabled: !!symbol,
  });
};

export const useTradingMode = () => {
  return useQuery({
    queryKey: queryKeys.tradingMode,
    queryFn: () => fetchApi("/trading-mode"),
    select: (data) => data.mode as "paper" | "live",
  });
};

export const useActivity = () => {
  return useQuery({
    queryKey: queryKeys.activity,
    queryFn: () => fetchApi("/activity"),
    select: (data) => data.activity,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};

// Mutations
export const usePlaceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: Record<string, unknown>) => postApi("/orders", orderData),
    onSuccess: () => {
      // Invalidate and refetch orders and positions
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.positions });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio });
    },
  });
};

export const usePlaceOptionsOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: Record<string, unknown>) => postApi("/options/orders", orderData),
    onSuccess: () => {
      // Invalidate and refetch orders and positions
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.positions });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => deleteApi(`/orders/${orderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
};

export const useCancelAllOrders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteApi("/orders"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
};

export const useClosePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (symbol: string) => deleteApi(`/positions/${symbol}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.positions });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio });
    },
  });
};

export const useSetTradingMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mode: "paper" | "live") => postApi("/trading-mode", { mode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tradingMode });
    },
  });
};
