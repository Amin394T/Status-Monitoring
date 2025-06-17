import { WebSocket, WebSocketServer } from 'ws';

const supervisorConns = {};
const connectorTasks = {};
const wss = new WebSocketServer({ port: 8001, path: '/ws' });

async function connector(id, url) {
    while (true) {
        try {
            const ws = new WebSocket(url, { rejectUnauthorized: false });
            await new Promise((resolve, reject) => {
                ws.once('open', resolve);
                ws.once('error', reject);
            });
            supervisorConns[id] = ws;
            ws.send(JSON.stringify({ type: 'list' }));

            ws.on('message', (msg) => {
                try { msg = JSON.parse(msg) } catch { return };
                console.log('INCOMING < SERVER :', msg);

                if (msg.type == 'list') {
                    for (let id of msg.value || []) {
                        ws.send(JSON.stringify({ type: 'details', target: id }));
                        console.log('OUTGOING > SERVER :', { type: 'details', target: id });
                    }
                }
                
                for (let client of wss.clients) {
                    if (client.readyState == WebSocket.OPEN) {
                        client.send(JSON.stringify({ target: id, value: msg }));
                        console.log('OUTGOING > CLIENT :', { target: id, value: msg })
                    }
                }
            });

            await new Promise((resolve) => {
                ws.once('close', resolve);
                ws.once('error', resolve);
            });
            
            delete supervisorConns[id];
            console.log('CONNECTION = CLOSED :', { id, url });
        }
        catch {
            await new Promise((resolve) => setTimeout(() => {
                console.log('CONNECTION = RETRY :', { id, url });
                resolve();
            }, 5000));
        }
    }
}

wss.on('connection', (ws) => {
    ws.on('message', async (raw) => {
        let msg;
        try { msg = JSON.parse(raw) } catch { return };
        console.log('INCOMING < CLIENT :', msg);

        if (msg.type == 'config') {
            for (let sup of msg.value || []) {
                const conn = supervisorConns[sup.id];

                if (!conn && !connectorTasks[sup.id]) {
                    connectorTasks[sup.id] = connector(sup.id, sup.url);
                    console.log('CONNECTION = OPENED :', { id: sup.id, url: sup.url });
                }
                else if (conn && conn.readyState == WebSocket.OPEN) {
                    conn.send(JSON.stringify({ type: 'list' }));
                    console.log('CONNECTION = EXISTS :', { id: sup.id, url: sup.url });
                }
                else {
                    console.log('CONNECTION = LOADING :', { id: sup.id, url: sup.url });
                }
            }
        }
        else {
            const conn = supervisorConns[msg.id];

            if (conn && conn.readyState == WebSocket.OPEN) {
                conn.send(JSON.stringify(msg.value));
                console.log('OUTGOING > SERVER :', msg.value);
            }
            else {
                console.log('CONNECTION = ERROR :', { id: msg.id, url: 'NOT FOUND' })
            }
        }
    });
});