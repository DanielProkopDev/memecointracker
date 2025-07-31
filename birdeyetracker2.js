import 'dotenv/config';
import fetch from "node-fetch";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
const API_KEY = process.env.BIRDEYE_API_KEY;

if (!API_KEY) {
  console.error("❌ Dodaj BIRDEYE_API_KEY do pliku .env");
  process.exit(1);
}

console.log("🚀 Uruchamiam tracker (Birdeye New Listings + szczegóły)...");
console.log(`Filtr: minLiquidityUSD=${config.minLiquidityUSD}, minVolumeUSD=${config.minVolumeUSD}`);

const LISTING_URL = "https://public-api.birdeye.so/defi/v2/tokens/new_listing?chain=solana&limit=5";
const DETAILS_URL = "https://public-api.birdeye.so/defi/token_overview?chain=solana&address=";

async function getTokenDetails(address) {
  try {
    console.log(`🔍 Pobieram szczegóły dla: ${address}`);
    const res = await fetch(DETAILS_URL + address, {
      headers: {
        "accept": "application/json",
        "X-API-KEY": API_KEY
      }
    });
    const json = await res.json();
    return json?.data || null;
  } catch (err) {
    console.error(`❌ Błąd pobierania szczegółów dla ${address}`, err);
    return null;
  }
}

async function fetchNew() {
  try {
    console.log("📡 Pobieram listę nowych tokenów...");
    const res = await fetch(LISTING_URL, {
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

    console.log(`📋 Znaleziono ${tokens.length} nowych tokenów`);

    for (const token of tokens) {
      const details = await getTokenDetails(token.address);
      if (!details) continue;

      const liquidityUSD = details?.liquidity || 0;
      const volumeUSD = details?.v24hUsd || 0;
      const price = details?.priceUsd || "?";
      const created = details?.createdAt
        ? new Date(details.createdAt * 1000).toLocaleString()
        : "brak danych";

      if (liquidityUSD < config.minLiquidityUSD) continue;
      if (volumeUSD < config.minVolumeUSD) continue;

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

setInterval(fetchNew, 20_000);
fetchNew();