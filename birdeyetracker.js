import 'dotenv/config';
import fetch from "node-fetch";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
const API_KEY = process.env.BIRDEYE_API_KEY;

if (!API_KEY) {
  console.error("❌ Dodaj BIRDEYE_API_KEY do pliku .env");
  process.exit(1);
}

console.log("🚀 Uruchamiam tracker (Birdeye New Listings)...");
console.log(`Filtr: minLiquidityUSD=${config.minLiquidityUSD}, minVolumeUSD=${config.minVolumeUSD}`);

const API_URL = "https://public-api.birdeye.so/defi/v2/tokens/new_listing?chain=solana&limit=20";

let seen = new Set();

async function fetchNew() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        "accept": "application/json",
        "X-API-KEY": API_KEY
      }
    });
    const json = await res.json();

    const tokens = json?.data?.items || [];

    if (!Array.isArray(tokens) || tokens.length === 0) {
      console.log("⚠️ Brak nowych tokenów w odpowiedzi API");
      return;
    }

    for (const token of tokens) {
      const liquidityUSD = token?.liquidity?.usd || 0;
      const volumeUSD = token?.volume?.h24 || 0;
      const price = token?.priceUsd || "?";
      const created = token?.createdTime
        ? new Date(token.createdTime).toLocaleString()
        : "brak danych";

      if (liquidityUSD < config.minLiquidityUSD) continue;
      if (volumeUSD < config.minVolumeUSD) continue;
      if (seen.has(token.address)) continue;

      seen.add(token.address);

      console.log("\n==============================");
      console.log(`🆕 Symbol: ${token.symbol}`);
      console.log(`📜 Adres: ${token.address}`);
      console.log(`💧 Płynność: $${liquidityUSD.toLocaleString()}`);
      console.log(`📊 Wolumen 24h: $${volumeUSD.toLocaleString()}`);
      console.log(`📈 Cena: $${price}`);
      console.log(`⏰ Dodano: ${created}`);
      console.log("==============================");
    }
  } catch (err) {
    console.error("❌ Błąd fetch:", err);
  }
}

setInterval(fetchNew, 15_000);
fetchNew();