import { WebSocketServer } from 'ws';

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

    return {
        id,
        address,
        payload: {
            ...programInfo,
            status,
            start_time,
            end_time
        }
    };
}

wss.on('connection', function connection(ws) {
    let interval = null;
    let idAddressList = [];

    ws.once('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            if (
                Array.isArray(data) &&
                data.length > 0 &&
                data.every(
                    item =>
                        typeof item === 'object' &&
                        item !== null &&
                        typeof item.id === 'number' &&
                        typeof item.address === 'string'
                )
            ) {
                idAddressList = data;
                interval = setInterval(() => {
                    idAddressList.forEach(({ id, address }) => {
                        const msg = generateMessage(id, address);
                        ws.send(JSON.stringify(msg));
                    });
                }, 5000);
                
            } else {
                ws.send(JSON.stringify({ error: "Expected array of { id, address } objects" }));
            }
        } catch (e) {
            ws.send(JSON.stringify({ error: "Invalid JSON" }));
        }
    });

    ws.on('close', () => {
        if (interval) clearInterval(interval);
    });
});

console.log('WebSocket server running on ws://localhost:8080');