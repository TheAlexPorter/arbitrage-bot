// Using built-in fetch API (Node.js 18+)

const API_BASE = "http://localhost:3001/api";

async function test5SecondDelay() {
  console.log("🧪 Testing 5-second delay solution for simultaneous bid/ask...\n");

  const testSymbol = "MSTR250725P00150000";

  try {
    // Step 1: Clean up any existing orders first
    console.log("🧹 Cleaning up existing orders...");
    const cleanupResponse = await fetch(`${API_BASE}/orders`, {
      method: "DELETE",
    });
    const cleanupResult = await cleanupResponse.json();
    console.log("Cleanup result:", cleanupResult.success ? "✅ Success" : "❌ Failed");

    // Step 2: Place a buy order first
    console.log("\n📈 Placing buy order first...");
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

    // Step 3: Wait 5 seconds (as per Alpaca forum recommendation)
    console.log("\n⏰ Waiting 5 seconds as per Alpaca forum recommendation...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log("✅ 5-second delay completed");

    // Step 4: Place a sell order
    console.log("\n📉 Placing sell order after 5-second delay...");
    const sellResponse = await fetch(`${API_BASE}/options/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: testSymbol,
        side: "sell",
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
      console.log(`   Side: ${sellResult.order.side}`);
      console.log(`   Smart side: ${sellResult.smart_side}`);
    } else {
      console.log(`   Error: ${sellResult.error}`);
    }

    // Step 5: Check final orders
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
    console.log("\n🧹 Final cleanup...");
    const finalCleanupResponse = await fetch(`${API_BASE}/orders`, {
      method: "DELETE",
    });
    const finalCleanupResult = await finalCleanupResponse.json();
    console.log("Final cleanup result:", finalCleanupResult.success ? "✅ Success" : "❌ Failed");

    console.log("\n✅ 5-second delay testing completed!");
    console.log("   - Based on Alpaca forum: 'minimum safe delay between market orders is 5 seconds'");
    console.log("   - This should allow both buy and sell orders to coexist");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
test5SecondDelay();
