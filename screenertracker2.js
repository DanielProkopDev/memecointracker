import fetch from "node-fetch";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

console.log("🚀 Startuję memecoin tracker (DEX Screener)...");
console.log(`Filtr: minLiquidityUSD=${config.minLiquidityUSD}, minVolumeUSD=${config.minVolumeUSD}`);

const API_URL = "https://api.dexscreener.com/latest/dex/pairs/solana";

async function fetchNewTokens() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        if (!data.pairs) {
            console.log("❌ Brak danych z API");
            return;
        }

        
        const sorted = data.pairs.sort((a, b) => b.pairCreatedAt - a.pairCreatedAt);

        for (const pair of sorted.slice(0, 10)) { // tylko 10 najnowszych
            const liquidityUSD = pair.liquidity?.usd || 0;
            const volumeUSD = pair.volume?.h24 || 0;

            if (liquidityUSD < config.minLiquidityUSD) continue;
            if (volumeUSD < config.minVolumeUSD) continue;

            console.log("\n==============================");
            console.log(`🆕 Token: ${pair.baseToken.symbol}`);
            console.log(`📜 Adres: ${pair.baseToken.address}`);
            console.log(`💧 Płynność: $${liquidityUSD.toLocaleString()}`);
            console.log(`📊 Wolumen 24h: $${volumeUSD.toLocaleString()}`);
            console.log(`📈 Cena: $${pair.priceUsd}`);
            console.log(`⏰ Dodano: ${new Date(pair.pairCreatedAt).toLocaleTimeString()}`);
            console.log("==============================");
        }
    } catch (err) {
        console.error("❌ Błąd pobierania danych:", err);
    }
}


setInterval(fetchNewTokens, 15_000);
fetchNewTokens();