// Using built-in fetch API (Node.js 18+)

const API_BASE = "http://localhost:3001/api";

async function debugMarginAccount() {
  console.log("🔍 Debugging margin account configuration...\n");

  try {
    // Step 1: Check account details
    console.log("📊 Checking account details...");
    const accountResponse = await fetch(`${API_BASE}/account`);
    const accountResult = await accountResponse.json();

    if (accountResult.success) {
      const account = accountResult.account;
      console.log("Account Information:");
      console.log(`   ID: ${account.id}`);
      console.log(`   Status: ${account.status}`);
      console.log(`   Trading Blocked: ${account.trading_blocked}`);
      console.log(`   Pattern Day Trader: ${account.pattern_day_trader}`);
      console.log(`   Options Trading Level: ${account.options_trading_level}`);
      console.log(`   Options Buying Power: ${account.options_buying_power}`);
      console.log(`   Buying Power: ${account.buying_power}`);
      console.log(`   Cash: ${account.cash}`);
      console.log(`   Portfolio Value: ${account.portfolio_value}`);
      console.log(`   Equity: ${account.equity}`);
    } else {
      console.log("❌ Failed to get account details:", accountResult.error);
    }

    // Step 2: Check current positions
    console.log("\n📋 Checking current positions...");
    const positionsResponse = await fetch(`${API_BASE}/positions`);
    const positionsResult = await positionsResponse.json();

    if (positionsResult.success) {
      const positions = positionsResult.positions;
      console.log(`Found ${positions.length} positions:`);
      positions.forEach((pos) => {
        console.log(`   ${pos.symbol}: ${pos.qty} shares (${pos.side}) - P&L: ${pos.unrealized_pl}`);
      });
    } else {
      console.log("❌ Failed to get positions:", positionsResult.error);
    }

    // Step 3: Check current orders
    console.log("\n📋 Checking current orders...");
    const ordersResponse = await fetch(`${API_BASE}/orders`);
    const ordersResult = await ordersResponse.json();

    if (ordersResult.success) {
      const orders = ordersResult.orders;
      console.log(`Found ${orders.length} orders:`);
      orders.forEach((order) => {
        console.log(`   ${order.symbol}: ${order.side} ${order.qty} @ $${order.limit_price} (${order.status})`);
      });
    } else {
      console.log("❌ Failed to get orders:", ordersResult.error);
    }

    // Step 4: Test a simple buy order first
    console.log("\n🧪 Testing simple buy order...");
    const testSymbol = "MSTR250725P00150000";

    const buyResponse = await fetch(`${API_BASE}/options/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: testSymbol,
        side: "buy",
        quantity: "1",
        price: "1.50",
        orderType: "limit",
      }),
    });

    const buyResult = await buyResponse.json();
    console.log("Buy order result:", buyResult.success ? "✅ Success" : "❌ Failed");
    if (buyResult.success) {
      console.log(`   Order ID: ${buyResult.order.id}`);
      console.log(`   Status: ${buyResult.order.status}`);
      console.log(`   Smart side: ${buyResult.smart_side}`);
    } else {
      console.log(`   Error: ${buyResult.error}`);
      if (buyResult.debug_info) {
        console.log("   Debug info:", buyResult.debug_info);
      }
    }

    // Step 5: Test sell order with explicit order type
    console.log("\n🧪 Testing sell order with explicit sell_to_open...");
    const sellResponse = await fetch(`${API_BASE}/options/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: testSymbol,
        side: "sell_to_open", // Explicitly use sell_to_open
        quantity: "1",
        price: "1.60",
        orderType: "limit",
      }),
    });

    const sellResult = await sellResponse.json();
    console.log("Sell order result:", sellResult.success ? "✅ Success" : "❌ Failed");
    if (sellResult.success) {
      console.log(`   Order ID: ${sellResult.order.id}`);
      console.log(`   Status: ${sellResult.order.status}`);
      console.log(`   Smart side: ${sellResult.smart_side}`);
    } else {
      console.log(`   Error: ${sellResult.error}`);
      if (sellResult.debug_info) {
        console.log("   Debug info:", sellResult.debug_info);
      }
      if (sellResult.suggestions) {
        console.log("   Suggestions:");
        sellResult.suggestions.forEach((suggestion) => {
          console.log(`     - ${suggestion}`);
        });
      }
    }

    // Step 6: Clean up
    console.log("\n🧹 Cleaning up...");
    const cancelResponse = await fetch(`${API_BASE}/orders`, {
      method: "DELETE",
    });
    const cancelResult = await cancelResponse.json();
    console.log("Cancel result:", cancelResult.success ? "✅ Success" : "❌ Failed");
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

// Run the debug
debugMarginAccount();
