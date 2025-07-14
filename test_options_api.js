// Using built-in fetch (Node.js 18+)

const API_BASE = "http://localhost:3001/api";

async function testOptionsAPI() {
  console.log("🔍 Testing Options API Endpoints\n");

  const testSymbol = "SPY";

  try {
    // Test 1: Get expiration dates
    console.log("1. Testing expiration dates...");
    const expirationsResponse = await fetch(`${API_BASE}/options/expirations/${testSymbol}`);
    const expirationsData = await expirationsResponse.json();

    if (expirationsData.success) {
      console.log(`✅ Found ${expirationsData.expirations.length} expiration dates:`);
      expirationsData.expirations.slice(0, 5).forEach((exp) => console.log(`   - ${exp}`));
      if (expirationsData.expirations.length > 5) {
        console.log(`   ... and ${expirationsData.expirations.length - 5} more`);
      }
    } else {
      console.log("❌ Failed to get expiration dates:", expirationsData.error);
    }

    // Test 2: Get options chain for first expiration
    if (expirationsData.success && expirationsData.expirations.length > 0) {
      const firstExpiration = expirationsData.expirations[0];
      console.log(`\n2. Testing options chain for expiration: ${firstExpiration}`);

      const chainResponse = await fetch(`${API_BASE}/options/chain/${testSymbol}?expiration=${firstExpiration}`);
      const chainData = await chainResponse.json();

      if (chainData.success) {
        console.log(`✅ Found ${chainData.options.length} options contracts`);
        console.log(`📊 Pricing source: ${chainData.pricing_source}`);
        console.log(`📝 Note: ${chainData.note}`);

        // Show first few options with their bid/ask values
        console.log("\n📋 Sample options data:");
        chainData.options.slice(0, 5).forEach((option) => {
          console.log(`   ${option.symbol}: Strike $${option.strike}, Bid $${option.bid}, Ask $${option.ask}, Type ${option.type}`);
        });

        // Check for duplicate bid/ask values
        const bidValues = chainData.options.map((o) => o.bid);
        const askValues = chainData.options.map((o) => o.ask);
        const uniqueBids = new Set(bidValues);
        const uniqueAsks = new Set(askValues);

        console.log(`\n🔍 Data Quality Check:`);
        console.log(`   - Unique bid values: ${uniqueBids.size}/${bidValues.length}`);
        console.log(`   - Unique ask values: ${uniqueAsks.size}/${askValues.length}`);

        if (uniqueBids.size === 1 || uniqueAsks.size === 1) {
          console.log("⚠️  WARNING: All options have the same bid/ask values - this indicates simulated data");
        } else {
          console.log("✅ Bid/ask values appear to be unique");
        }
      } else {
        console.log("❌ Failed to get options chain:", chainData.error);
      }
    }

    // Test 3: Test individual option quote
    console.log("\n3. Testing individual option quote...");
    const testOptionSymbol = "AAPL240315C00150000"; // Example option symbol
    const quoteResponse = await fetch(`${API_BASE}/options/quote/${testOptionSymbol}`);
    const quoteData = await quoteResponse.json();

    if (quoteData.success) {
      console.log(`✅ Option quote for ${testOptionSymbol}:`);
      console.log(`   Bid: $${quoteData.quote.bid}, Ask: $${quoteData.quote.ask}`);
      console.log(`   Pricing source: ${quoteData.quote.pricing_source}`);
      console.log(`   Note: ${quoteData.quote.note}`);
    } else {
      console.log("❌ Failed to get option quote:", quoteData.error);
    }

    // Test 4: Test live options quotes (bulk)
    console.log("\n4. Testing live options quotes (bulk)...");
    const testOptions = ["AAPL250725C00210000", "AAPL250725P00210000", "SPY250721C00630000"];
    const liveQuotesResponse = await fetch(`${API_BASE}/options/quotes/live?symbols=${testOptions.join(",")}`);
    const liveQuotesData = await liveQuotesResponse.json();

    if (liveQuotesData.success) {
      console.log(`✅ Live quotes response:`);
      console.log(`   Pricing source: ${liveQuotesData.pricing_source}`);
      console.log(`   Note: ${liveQuotesData.note}`);
      console.log(`   Found ${liveQuotesData.quotes.length} quotes out of ${testOptions.length} requested`);

      if (liveQuotesData.quotes.length > 0) {
        console.log("\n📋 Live quotes data:");
        liveQuotesData.quotes.forEach((quote) => {
          console.log(`   ${quote.symbol}: Bid $${quote.bid}, Ask $${quote.ask}, Last $${quote.last}`);
        });
      }
    } else {
      console.log("❌ Failed to get live quotes:", liveQuotesData.error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testOptionsAPI();
