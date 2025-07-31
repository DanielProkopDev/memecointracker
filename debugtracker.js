import 'dotenv/config';
import WebSocket from 'ws';

console.log("🚀 Startuję debug tracker...");
const ws = new WebSocket("wss://pumpportal.fun/ws");

ws.on('open', () => {
    console.log("✅ Połączono z Pump.fun WebSocket");

    
    ws.send(JSON.stringify({
        method: "subscribeNewTokens",
        params: {}
    }));

    
    ws.send(JSON.stringify({
        method: "subscribe",
        params: {}
    }));
});

ws.on('message', (msg) => {
    console.log("📩 Surowa wiadomość z serwera:");
    console.log(msg.toString());
});

ws.on('close', () => {
    console.log("⚠️ Połączenie zamknięte");
});

ws.on('error', (err) => {
    console.error("❌ Błąd WebSocket:", err);
});