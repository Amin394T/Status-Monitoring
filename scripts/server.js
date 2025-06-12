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
const processIDs = programs.map(p => p.process_id);

// WebSocker Server Definition
const wss = new WebSocketServer({ port: 8001, path: '/ws' });

wss.on("connection", (ws) => {
    let interval = null;

    ws.on("message", (raw) => {
        if (interval) clearInterval(interval);

        try {
            let msg;
            try { msg = JSON.parse(raw) } catch { return };
            console.log('INCOMING :', msg)

            if(msg.Object == '/Infs') {
                ws.send(JSON.stringify({ Object: '/Infs', Event: 'List', Value: processIDs }));
                console.log('OUTGOING :', processIDs);
            }
            else if(msg.Object.startsWith('/Infs/')) {
                const code = msg.Object.split('/').pop();
                const program = programs.find(p => p.process_id == code);
                if (!program) return;

                if(msg.Event == 'List') {
                    interval = setInterval(() => {
                        const status = Math.random() < 0.8 ? 'running' : 'stopped';
                        ws.send(JSON.stringify({ Object: msg.Object, Event: 'Info', Value: {...program, status} }));
                    }, 5000);
                }
                else if(msg.Event == 'Action') {
                    const status = msg.Value == 'Start' ? 'running' : msg.Value == 'Stop' ? 'stopped' : 'unknown';
                    ws.send(JSON.stringify({ Object: msg.Object, Event: 'Status', Value: {...program, status} }));
                }
                else {
                    ws.send(JSON.stringify({ Object: msg.Object, Event: 'Error', Value: 'unknown event' }));
                }
                console.log('OUTGOING :', program);
            }
        }
        catch (error) {
            console.error('ERROR :', error);
        }
  });

    ws.on("close", () => {
        if (interval) clearInterval(interval);
    });
});