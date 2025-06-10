import WebSocket, { WebSocketServer } from 'ws';

const supervisorConns = {};
const connectorTasks = {};
const wss = new WebSocketServer({ port: 8000, path: '/ws' });

async function connector(id, url) {
    while (true) {
        try {
            const ws = new WebSocket(url, { agent: { rejectUnauthorized: false } });
            await new Promise((resolve, reject) => {
                ws.once('open', resolve);
                ws.once('error', reject);
            });
            supervisorConns[id] = ws;

            ws.send(JSON.stringify({ Object: '/Db', Event: 'Reg' }));
            ws.send(JSON.stringify({ Object: '/Infs', Event: 'Reg' }));

            ws.on('message', (raw) => {
                let msg;
                try { msg = JSON.parse(raw) } catch { return };
                console.log('INCOMING < SERVER :', msg);

                if (msg.Object == '/Infs' && msg.Event == 'List') {
                    for (let code of msg.Value || []) {
                        ws.send(JSON.stringify({ Object: `/Infs/${code}`, Event: 'Reg' }));
                        console.log('OUTGOING > SERVER :', { id, code });
                    }
                }
                
                for (let client of wss.clients) {
                    if (client.readyState == WebSocket.OPEN) {
                        client.send(JSON.stringify({ id, payload: msg }));
                        console.log('OUTGOING > CLIENT :', { id, payload: msg })
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
            await new Promise(() => setTimeout(() => {
                console.log('CONNECTION = RETRY :', { id, url });
            }, 2000));
        }
    }
}

wss.on('connection', (ws) => {
    ws.on('message', async (raw) => {
        let msg;
        try { msg = JSON.parse(raw) } catch { return };
        console.log('INCOMING < CLIENT :', msg);
    
        if (msg.cmd == 'CONFIG') {
            for (let sup of msg.supervisors) {
                const conn = supervisorConns[sup.id];

                if (!conn && !connectorTasks[sup.id]) {
                    connectorTasks[sup.id] = connector(sup.id, sup.url);
                    console.log('CONNECTION = OPENED :', { id: sup.id, url: sup.url });
                }
                else {
                    conn.send(JSON.stringify({ Object: '/Db', Event: 'Reg' }));
                    conn.send(JSON.stringify({ Object: '/Infs', Event: 'Reg' }));
                    console.log('CONNECTION = EXISTS :', { id: sup.id, url: sup.url });
                }
            }
        }
        else if (msg.id && msg.payload) {
            const conn = supervisorConns[msg.id];
            
            if (conn) {
                conn.send(JSON.stringify(msg.payload));
                console.log('OUTGOING > SERVER :', msg.payload);
            }
            else {
                console.log('CONNECTION = ERROR :', { id: msg.id, url: 'NOT FOUND' })
            }
        }
    });
});