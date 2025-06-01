import { WebSocketServer } from "ws";

// Random Program Generator

const programs = [
    { program: "Payment Gateway", url_path: "/payment-gateway", process_id: "1146" },
    { program: "User Service", url_path: "/user-service", process_id: "48356" },
    { program: "Order Processor", url_path: "/order-processor", process_id: "48357" },
    { program: "Inventory Manager", url_path: "/inventory-manager", process_id: "48358", },
    { program: "Notification Service", url_path: "/notification-service", process_id: "48359" },
    { program: "Analytics Engine", url_path: "/analytics-engine", process_id: "48360" },
    { program: "Authentication Service", url_path: "/auth-service", process_id: "48362" },
    { program: "Device Interface", url_path: "/device-interface", process_id: "5660" },
    { program: "Switch", url_path: "/switch", process_id: "48360" },
    { program: "Monitoring Portal", url_path: "/dashboard/monitoring-portal", process_id: "18221" },
    { program: "Reporting Engine", url_path: "/dashboard/reporting", process_id: "89004" }
];

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generateMessage(id, address) {
    const process_id = getRandomElement(programs).process_id;
    const status = getRandomElement(["running", "stopped"]);
    const start_time = new Date().toISOString();
    const end_time = status === "running" ? null : new Date().toISOString();

    return {id, address, payload: {process_id, status, start_time, end_time}};
}


// WebSocket Server Setup

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
    let interval = null;
    let environments = [];

    ws.on("message", (message) => {
        if (interval) clearInterval(interval);

        try {
            environments = JSON.parse(message.toString());

            if (Array.isArray(environments) && environments.every((item) => item.id)) {
                environments.forEach(({id}) => ws.send(JSON.stringify({ id, payload: programs })));
                
                interval = setInterval(() => {
                    environments.forEach(({ id, address }) => {
                        try {
                            const msg = generateMessage(id, address);
                            ws.send(JSON.stringify(msg));
                        }
                        catch (error) {
                            ws.send(JSON.stringify({ error: "Failed to generate message : " + error.message }));
                        }
                    });
                }, 5000);
            }
            else {
                ws.send(JSON.stringify({ error: "Invalid Message Format" }));
            }
        }
        catch (error) {
            ws.send(JSON.stringify({ error: "Invalid JSON Format : " + error.message }));
        }
  });

    ws.on("close", () => {
        if (interval) clearInterval(interval);
    });
});

console.log("WebSocket server running on ws://localhost:8080");
