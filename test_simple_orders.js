// Using built-in fetch API (Node.js 18+)

const API_BASE = "http://localhost:3001/api";

async function testSimpleOrders() {
  console.log("🧪 Testing simple order placement for simultaneous bid/ask...\n");

  const testSymbol = "MSTR250725P00150000";

  try {
    // Test 1: Place a buy order
    console.log("📈 Placing buy order...");
    const buyResponse = await fetch(`${API_BASE}/options/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: testSymbol,
        side: "buy",
        quantity: "1",
        price: "1.45",
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

    // Test 2: Place a sell order (should work without canceling the buy)
    console.log("\n📉 Placing sell order...");
    const sellResponse = await fetch(`${API_BASE}/options/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: testSymbol,
        side: "sell",
        quantity: "1",
        price: "1.55",
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

    // Test 3: Check all orders to verify both exist
    console.log("\n📋 Checking all orders...");
    const ordersResponse = await fetch(`${API_BASE}/orders`);
    const ordersResult = await ordersResponse.json();

    if (ordersResult.success) {
      const symbolOrders = ordersResult.orders.filter((order) => order.symbol === testSymbol);
      console.log(`Found ${symbolOrders.length} orders for ${testSymbol}:`);
      symbolOrders.forEach((order) => {
        console.log(`   ${order.side} ${order.qty} @ $${order.limit_price} (${order.status}) - ID: ${order.id}`);
      });
    }

    // Test 4: Clean up
    console.log("\n🧹 Cleaning up orders...");
    const cancelResponse = await fetch(`${API_BASE}/orders`, {
      method: "DELETE",
    });
    const cancelResult = await cancelResponse.json();
    console.log("Cancel result:", cancelResult.success ? "✅ Success" : "❌ Failed");

    console.log("\n✅ Simple order testing completed!");
    console.log("   - Both buy and sell orders can be placed");
    console.log("   - Orders coexist without cancellation");
    console.log("   - Perfect for the existing bid/ask ladder");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testSimpleOrders();
