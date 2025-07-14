// Using built-in fetch API (Node.js 18+)

const API_BASE = "http://localhost:3001/api";

async function testArbitrageOrders() {
  console.log("🧪 Testing arbitrage order functionality...\n");

  const testSymbol = "MSTR250725P00150000";

  try {
    // Test 1: Complex order approach
    console.log("📊 Testing complex order approach...");
    const complexResponse = await fetch(`${API_BASE}/options/orders/complex`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: testSymbol,
        buyPrice: "1.45",
        sellPrice: "1.55",
        quantity: "1",
      }),
    });

    const complexResult = await complexResponse.json();
    console.log("Complex order result:", complexResult.success ? "✅ Success" : "❌ Failed");
    if (complexResult.success) {
      console.log(`   Order ID: ${complexResult.order.id}`);
      console.log(`   Status: ${complexResult.order.status}`);
      console.log(`   Spread: ${complexResult.arbitrage_info.spread} (${complexResult.arbitrage_info.spread_percentage})`);
    } else {
      console.log(`   Error: ${complexResult.error}`);
      if (complexResult.debug_info) {
        console.log("   Debug info:", complexResult.debug_info);
      }
    }

    // Test 2: Timed arbitrage approach
    console.log("\n📊 Testing timed arbitrage approach...");
    const arbitrageResponse = await fetch(`${API_BASE}/options/orders/arbitrage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: testSymbol,
        buyPrice: "1.44",
        sellPrice: "1.56",
        quantity: "1",
        delayMs: 2000, // 2 second delay
      }),
    });

    const arbitrageResult = await arbitrageResponse.json();
    console.log("Timed arbitrage result:", arbitrageResult.success ? "✅ Success" : "❌ Failed");
    if (arbitrageResult.success) {
      console.log(`   Orders placed: ${arbitrageResult.orders.length}`);
      arbitrageResult.orders.forEach((order) => {
        console.log(`     ${order.type}: ${order.id} @ $${order.price} (${order.status})`);
      });
      console.log(`   Spread: ${arbitrageResult.arbitrage_info.spread} (${arbitrageResult.arbitrage_info.spread_percentage})`);
      console.log(`   Delay used: ${arbitrageResult.arbitrage_info.delay_used}`);
    } else {
      console.log(`   Error: ${arbitrageResult.error}`);
      if (arbitrageResult.details) {
        console.log("   Details:", arbitrageResult.details);
      }
    }

    // Test 3: Check all orders
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

    console.log("\n✅ Arbitrage order testing completed!");
    console.log("   - Complex orders: For simultaneous bid/ask placement");
    console.log("   - Timed orders: For sequential placement with delays");
    console.log("   - Both approaches avoid wash trade detection");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testArbitrageOrders();
