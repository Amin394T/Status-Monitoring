import { WebSocketServer } from "ws";

const programs = [
    { program: "Payment Gateway", url_path: "/payment-gateway", process_id: "1146" },
    { program: "User Service", url_path: "/user-service", process_id: "48356" },
    { program: "Order Processor", url_path: "/order-processor", process_id: "48357" },
    { program: "Inventory Manager", url_path: "/inventory-manager", process_id: "48358", },
    { program: "Notification Service", url_path: "/notification-service", process_id: "48359" },
    { program: "Analytics Engine", url_path: "/analytics-engine", process_id: "48360" },
    { program: "Authentication Service", url_path: "/auth-service", process_id: "48362" },
    { program: "Device Interface", url_path: "/device-interface", process_id: "5660" },
    { program: "Switch Interface", url_path: "/switch-interface", process_id: "77855" },
    { program: "Monitoring Portal", url_path: "/dashboard/monitoring-portal", process_id: "18221" },
    { program: "Reporting Engine", url_path: "/dashboard/reporting", process_id: "89004" }
];
const processIDs = programs.map(prg => prg.process_id);


const wss = new WebSocketServer({ port: 8002, path: '/ws' });

wss.on("connection", (ws) => {
    console.log("CONNECTION = OPENED");
    let interval = null;
    let object;

    ws.on("message", (msg) => {
        try {
            msg = JSON.parse(msg);
            console.log('INCOMING :', msg);

            switch (msg.type) {
                case 'list':
                    object = { ...msg, value: processIDs };
                    break;

                case 'details':
                    const program = programs.find(prg => prg.process_id == msg.target);
                    if (msg.target && !program) return;
                    object = { ...msg, value: program };
                    break;

                case 'toggle':
                    const status = msg.value == 'run' ? 'running' : msg.value == 'stop' ? 'stopped' : 'unknown';
                    object = { ...msg, value: status };
                    break;

                case 'random':
                    if (interval) {
                        clearInterval(interval);
                        interval = null;
                        console.log({ ...msg, value: 'randomizer stopped' });
                    }
                    else {
                        interval = setInterval(() => {
                            const status = Math.random() < 0.5 ? 'running' : 'stopped';
                            const processID = processIDs[Math.floor(Math.random() * processIDs.length)];
                            ws.send(JSON.stringify({ type: 'toggle', target: processID,  value: status }));
                            console.log('OUTGOING :', { type: 'random', target: processID,  value: status });
                        }, 3000);
                        console.log({ ...msg, value: 'randomizer running' });
                    }
                    return;

                default:
                    object = { ...msg, value: 'command unknown' };
            }

            ws.send(JSON.stringify(object));
            console.log('OUTGOING :', object);
        }
        catch (error) {
            object = { type: 'error', value: 'syntax error' };
            ws.send(JSON.stringify(object));
            console.log('OUTGOING :', object);
        }
    });

    ws.on("close", () => {
        console.log("CONNECTION = CLOSED");
        if (interval) clearInterval(interval);
    });
});

wss.on("close", () => {
    ws.send(JSON.stringify({ type: 'delete' }));
}
);