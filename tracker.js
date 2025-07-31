import 'dotenv/config';
import WebSocket from 'ws';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
const rpcUrl = process.env.RPC_URL;

console.log("🚀 Startuję memecoin tracker na Solanie...");
console.log(`Używam RPC: ${rpcUrl}`);
console.log(`Filtr: minLiquidityUSD=${config.minLiquidityUSD}, minVolumeUSD=${config.minVolumeUSD}`);

const ws = new WebSocket("wss://pumpportal.fun/ws");

ws.on('open', () => {
    console.log("✅ Połączono z Pump.fun WebSocket");

    
    ws.send(JSON.stringify({
        method: "subscribeNewToken", // <-- poprawiona nazwa metody
        params: {}
    }));
});

ws.on('message', (msg) => {
    try {
        const data = JSON.parse(msg.toString());

        
        if (data.method === "newToken" && data.data) {
            const token = {
                symbol: data.data.symbol || "???",
                address: data.data.mint,
                liquidityUSD: data.data.liquidityUsd || 0,
                volumeUSD: data.data.volumeUsd || 0,
                marketCap: data.data.marketCapUsd || 0,
                timestamp: new Date().toLocaleTimeString()
            };

            // Filtry
            if (token.liquidityUSD < config.minLiquidityUSD) return;
            if (token.volumeUSD < config.minVolumeUSD) return;

            
            console.log("\n==============================");
            console.log(`🆕 Nowy memecoin: ${token.symbol}`);
            console.log(`📜 Adres: ${token.address}`);
            console.log(`💧 Płynność: $${token.liquidityUSD.toLocaleString()}`);
            console.log(`📊 Wolumen: $${token.volumeUSD.toLocaleString()}`);
            console.log(`🏦 Market Cap: $${token.marketCap.toLocaleString()}`);
            console.log(`⏰ Wykryto: ${token.timestamp}`);
            console.log("==============================");
        }
    } catch (err) {
        console.error("Błąd parsowania wiadomości:", err);
    }
});

ws.on('close', () => {
    console.log("⚠️ Połączenie zamknięte, ponawiam próbę...");
    setTimeout(() => process.exit(1), 2000);
});

ws.on('error', (err) => {
    console.error("❌ Błąd WebSocket:", err);
});