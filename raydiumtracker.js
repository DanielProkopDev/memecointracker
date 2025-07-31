import fetch from "node-fetch";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

console.log("🚀 Startuję tracker nowych memecoinów (Raydium Fresh Pools)...");
console.log(`Filtr: minLiquidityUSD=${config.minLiquidityUSD}, minVolumeUSD=${config.minVolumeUSD}`);

const API_URL = "https://api.raydium.io/v2/main/pairs";
let seen = new Set();


const MAX_AGE_MINUTES = 5;

async function fetchNewPools() {
    try {
        const res = await fetch(API_URL);
        const json = await res.json();

        if (!json || !Array.isArray(json)) {
            console.log("❌ Brak danych z Raydium API");
            return;
        }

        const now = Date.now();
        let count = 0;

        
        const sorted = json.sort((a, b) => b.poolCreatedTime - a.poolCreatedTime);

        for (const pool of sorted) {
            if (!pool?.base?.symbol || !pool?.quote?.symbol) continue;

            // Tylko świeże pule (ostatnie X minut)
            if (!pool.poolCreatedTime) continue;
            const ageMinutes = (now - pool.poolCreatedTime) / 60000;
            if (ageMinutes > MAX_AGE_MINUTES) break; 

            const liquidityUSD = pool.liquidity || 0;
            const volumeUSD = pool.volume24h || 0;

            if (liquidityUSD < config.minLiquidityUSD) continue;
            if (volumeUSD < config.minVolumeUSD) continue;
            if (seen.has(pool.ammId)) continue;

            seen.add(pool.ammId);
            count++;

            console.log("\n==============================");
            console.log(`🆕 Token: ${pool.base.symbol} (${pool.base.address})`);
            console.log(`💱 Para: ${pool.base.symbol} / ${pool.quote.symbol}`);
            console.log(`📜 Pool ID: ${pool.ammId}`);
            console.log(`💧 Płynność: $${liquidityUSD.toLocaleString()}`);
            console.log(`📊 Wolumen 24h: $${volumeUSD.toLocaleString()}`);
            console.log(`📈 Cena: $${pool.price}`);
            console.log(`⏰ Dodano: ${new Date(pool.poolCreatedTime).toLocaleString()}`);
            console.log("==============================");

            if (count >= 20) break; // maksymalnie 20 świeżych
        }

        if (count === 0) {
            console.log("⚠️ Brak nowych memecoinów w ostatnich 5 minutach");
        }
    } catch (err) {
        console.error("❌ Błąd pobierania danych:", err);
    }
}

setInterval(fetchNewPools, 15_000);
fetchNewPools();