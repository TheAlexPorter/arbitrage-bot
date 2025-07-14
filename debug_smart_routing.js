// Using built-in fetch API (Node.js 18+)

const API_BASE = "http://localhost:3001/api";

async function debugSmartRouting() {
  console.log("🔍 Debugging smart routing logic...\n");

  const testSymbol = "MSTR250725P00150000";

  try {
    // Step 1: Check current positions
    console.log("📊 Checking current positions...");
    const positionsResponse = await fetch(`${API_BASE}/positions`);
    const positionsResult = await positionsResponse.json();

    if (positionsResult.success) {
      const symbolPosition = positionsResult.positions.find((pos) => pos.symbol === testSymbol);
      if (symbolPosition) {
        console.log(`Found position for ${testSymbol}:`);
        console.log(`   Quantity: ${symbolPosition.qty}`);
        console.log(`   Side: ${symbolPosition.side}`);
        console.log(`   Market Value: ${symbolPosition.market_value}`);
      } else {
        console.log(`No position found for ${testSymbol}`);
      }
    }

    // Step 2: Check current orders
    console.log("\n📋 Checking current orders...");
    const ordersResponse = await fetch(`${API_BASE}/orders`);
    const ordersResult = await ordersResponse.json();

    if (ordersResult.success) {
      const symbolOrders = ordersResult.orders.filter((order) => order.symbol === testSymbol);
      console.log(`Found ${symbolOrders.length} orders for ${testSymbol}:`);
      symbolOrders.forEach((order) => {
        console.log(`   ${order.side} ${order.qty} @ $${order.limit_price} (${order.status}) - ID: ${order.id}`);
      });
    }

    // Step 3: Test buy order with explicit order type
    console.log("\n🧪 Testing buy order with explicit buy_to_open...");
    const buyResponse = await fetch(`${API_BASE}/options/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: testSymbol,
        side: "buy_to_open", // Explicitly use buy_to_open
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
      console.log(`   Smart side: ${buyResult.smart_side}`);
    } else {
      console.log(`   Error: ${buyResult.error}`);
    }

    // Step 4: Test sell order with explicit order type
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
        price: "1.56",
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
    }

    // Step 5: Check final state
    console.log("\n📋 Checking final orders...");
    const finalOrdersResponse = await fetch(`${API_BASE}/orders`);
    const finalOrdersResult = await finalOrdersResponse.json();

    if (finalOrdersResult.success) {
      const finalSymbolOrders = finalOrdersResult.orders.filter((order) => order.symbol === testSymbol);
      console.log(`Found ${finalSymbolOrders.length} orders for ${testSymbol}:`);
      finalSymbolOrders.forEach((order) => {
        console.log(`   ${order.side} ${order.qty} @ $${order.limit_price} (${order.status}) - ID: ${order.id}`);
      });
    }

    // Step 6: Clean up
    console.log("\n🧹 Cleaning up orders...");
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
debugSmartRouting();
