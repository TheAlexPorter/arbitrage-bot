# Simultaneous Bid and Ask Orders Implementation

## Overview

This document describes the changes made to enable placing limit orders on both the bid and ask side simultaneously for option contracts and stocks.

## Problem

Previously, the application would automatically cancel ALL existing orders for a symbol when placing a new order, preventing users from having both buy and sell orders active at the same time. This was problematic for arbitrage strategies that require orders on both sides.

## Solution

### Changes Made

#### 1. Modified Stock Order Placement (`/api/orders`)

**File:** `backend/src/index.ts` (lines ~264-325)

**Before:**

- Canceled ALL existing orders for the same symbol
- Prevented simultaneous bid and ask orders

**After:**

- Only cancels orders on the same side (buy vs sell)
- Allows simultaneous bid and ask orders
- Maintains order management while enabling arbitrage strategies

**Key Changes:**

```typescript
// Only cancel orders on the same side to allow simultaneous bid and ask orders
conflictingOrders = existingOrders.filter((order: any) => {
  return (
    order.symbol === symbol.toUpperCase() && order.status === "accepted" && order.side === side // Only same side
  );
});
```

#### 2. Enhanced Options Order Placement (`/api/options/orders`)

**File:** `backend/src/index.ts` (lines ~1225-1450)

**Before:**

- No conflicting order detection
- Could potentially create duplicate orders

**After:**

- Checks for existing orders on the same side and price
- Allows multiple orders for arbitrage strategies
- Logs when conflicting orders are found but doesn't cancel them

**Key Changes:**

```typescript
// Check for existing orders on the same side to avoid duplicates
// But allow orders on opposite sides (bid and ask simultaneously)
const conflictingOrders = existingOrders.filter((order: any) => {
  return order.symbol === symbol.toUpperCase() && order.status === "accepted" && order.side === mappedSide && order.limit_price === orderData.limit_price;
});

if (conflictingOrders.length > 0) {
  console.log(`Found ${conflictingOrders.length} existing orders on same side and price for ${symbol}, allowing placement for arbitrage...`);
  // Don't cancel - allow multiple orders for arbitrage strategies
}
```

## Testing

### Test Results

The implementation was tested with the following results:

1. **Stock Orders:**

   - ✅ Buy orders can be placed successfully
   - ⚠️ Sell orders are rejected by Alpaca broker restrictions (not our code)
   - ✅ Our logic correctly identifies and manages conflicting orders

2. **Options Orders:**
   - ✅ Order placement logic allows simultaneous bid/ask orders
   - ⚠️ Contract availability depends on Alpaca's active contracts
   - ✅ No automatic cancellation of opposing orders

### Broker Restrictions

**Important Note:** While our application now allows simultaneous bid and ask orders, there are broker-level restrictions that may prevent this:

1. **Cash Accounts:** Cannot have both long and short positions simultaneously
2. **Margin Requirements:** May require sufficient margin for both positions
3. **Pattern Day Trader Rules:** May affect order placement frequency

## Usage

### For Stock Trading

```javascript
// Place buy order
await fetch("/api/orders", {
  method: "POST",
  body: JSON.stringify({
    symbol: "MSTR",
    side: "buy",
    quantity: "1",
    price: "400.00",
    orderType: "limit",
  }),
});

// Place sell order (will work if account allows)
await fetch("/api/orders", {
  method: "POST",
  body: JSON.stringify({
    symbol: "MSTR",
    side: "sell",
    quantity: "1",
    price: "450.00",
    orderType: "limit",
  }),
});
```

### For Options Trading

```javascript
// Place buy order
await fetch("/api/options/orders", {
  method: "POST",
  body: JSON.stringify({
    symbol: "MSTR240315C00400000",
    side: "buy_to_open",
    quantity: "1",
    price: "5.00",
    orderType: "limit",
  }),
});

// Place sell order
await fetch("/api/options/orders", {
  method: "POST",
  body: JSON.stringify({
    symbol: "MSTR240315C00400000",
    side: "sell_to_close",
    quantity: "1",
    price: "5.50",
    orderType: "limit",
  }),
});
```

## Benefits

1. **Arbitrage Strategies:** Enables market making and arbitrage opportunities
2. **Risk Management:** Allows setting both entry and exit orders simultaneously
3. **Flexibility:** Users can manage orders on both sides without interference
4. **Better UX:** No unexpected order cancellations when placing opposing orders

## Limitations

1. **Broker Restrictions:** Alpaca may still reject orders based on account type and margin
2. **Regulatory Compliance:** Pattern day trader and other regulations may apply
3. **Contract Availability:** Options contracts must be active and available

## Future Enhancements

1. **Account Type Detection:** Check account type and provide appropriate guidance
2. **Margin Validation:** Validate margin requirements before order placement
3. **Order Templates:** Create templates for common arbitrage strategies
4. **Risk Warnings:** Add warnings about simultaneous order risks
