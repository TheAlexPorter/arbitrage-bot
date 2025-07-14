// Using built-in fetch API (Node.js 18+)

const API_BASE = "http://localhost:3001/api";

async function checkAccountType() {
  console.log("🔍 Checking account type and margin settings...\n");

  try {
    // Check account details
    console.log("📊 Checking account details...");
    const accountResponse = await fetch(`${API_BASE}/account`);
    const accountResult = await accountResponse.json();

    if (accountResult.success) {
      const account = accountResult.account;
      console.log("Account Information:");
      console.log(`   ID: ${account.id}`);
      console.log(`   Status: ${account.status}`);
      console.log(`   Account Type: ${account.account_type || "Unknown"}`);
      console.log(`   Trading Blocked: ${account.trading_blocked}`);
      console.log(`   Pattern Day Trader: ${account.pattern_day_trader}`);
      console.log(`   Options Trading Level: ${account.options_trading_level}`);
      console.log(`   Options Buying Power: ${account.options_buying_power}`);
      console.log(`   Buying Power: ${account.buying_power}`);
      console.log(`   Cash: ${account.cash}`);
      console.log(`   Portfolio Value: ${account.portfolio_value}`);
      console.log(`   Equity: ${account.equity}`);
      console.log(`   Margin: ${account.margin || "N/A"}`);
      console.log(`   Shorting Enabled: ${account.shorting_enabled || "N/A"}`);
    } else {
      console.log("❌ Failed to get account details:", accountResult.error);
    }

    // Check current positions
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

    // Test a simple buy order to see what happens
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
        price: "1.44",
        orderType: "limit",
      }),
    });

    const buyResult = await buyResponse.json();
    console.log("Buy order result:", buyResult.success ? "✅ Success" : "❌ Failed");
    if (buyResult.success) {
      console.log(`   Order ID: ${buyResult.order.id}`);
      console.log(`   Status: ${buyResult.order.status}`);
      console.log(`   Side: ${buyResult.order.side}`);
      console.log(`   Smart side: ${buyResult.smart_side}`);
    } else {
      console.log(`   Error: ${buyResult.error}`);
    }

    // Clean up
    console.log("\n🧹 Cleaning up...");
    const cancelResponse = await fetch(`${API_BASE}/orders`, {
      method: "DELETE",
    });
    const cancelResult = await cancelResponse.json();
    console.log("Cancel result:", cancelResult.success ? "✅ Success" : "❌ Failed");
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

// Run the check
checkAccountType();
