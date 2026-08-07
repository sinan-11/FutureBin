import WebSocket from "ws";
const url = "wss://futurebin.duckdns.org/socket.io/?EIO=4&transport=websocket";
const ws = new WebSocket(url, { headers: { Origin: "https://future-bin-seven.vercel.app" }, handshakeTimeout: 15000 });
ws.on("open", () => {
  console.log("OPEN - websocket connected");
  ws.send("40");  // socket.io connect packet (no auth)
});
ws.on("message", (d) => {
  console.log("MSG:", d.toString());
  if (d.toString().startsWith("4")) process.exit(0);
});
ws.on("upgrade", () => console.log("UPGRADE OK"));
ws.on("error", (e) => { console.log("WS ERROR:", e.message); process.exit(1); });
ws.on("close", (c) => { console.log("CLOSE", c); process.exit(0); });
setTimeout(() => { console.log("TIMEOUT"); process.exit(2); }, 20000);
