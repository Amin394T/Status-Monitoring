import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

const programs = [
    { program: "Payment Gateway", url_path: "/payment-gateway", process_id: "48355" },
    { program: "User Service", url_path: "/user-service", process_id: "48356" },
    { program: "Order Processor", url_path: "/order-processor", process_id: "48357" },
    { program: "Inventory Manager", url_path: "/inventory-manager", process_id: "48358" }
];
const statuses = ["running", "stopped"];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateMessage(id, address) {
    const programInfo = getRandomElement(programs);
    const status = getRandomElement(statuses);
    const start_time = new Date().toISOString();
    const end_time = status === "running" ? null : new Date().toISOString();

    return {id, address, payload: {...programInfo, status, start_time, end_time}};
}

wss.on("connection", (ws) => {
  let interval = null;
  let environments = [];

  ws.on("message", (message) => {
    if (interval) clearInterval(interval);

    try {
      const data = JSON.parse(message.toString());
      if (
        Array.isArray(data) &&
        data.every((item) => item.id && item.address)
      ) {
        environments = data;
        interval = setInterval(() => {
          environments.forEach(({ id, address }) => {
            try {
              const msg = generateMessage(id, address);
              ws.send(JSON.stringify(msg));
            } catch (e) {
              ws.send(JSON.stringify({ error: "Failed to generate message" }));
            }
          });
        }, 5000);
      } else {
        ws.send(JSON.stringify({ error: "Invalid Message Format" }));
      }
    } catch (e) {
      ws.send(JSON.stringify({ error: "Invalid JSON Format" }));
    }
  });

  ws.on("close", () => {
    if (interval) clearInterval(interval);
  });
});

console.log("WebSocket server running on ws://localhost:8080");
