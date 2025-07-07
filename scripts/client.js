import "../style.css";

let ws;
const switchURL = "ws://localhost:8001/ws";

async function fetchEnvironments() {
    const response = await fetch("data.json");
    const data = await response.json();
    return data || [];
}
let environments = await fetchEnvironments();


const $root = document.getElementById("root");

environments.forEach((env) => {
    const $envRegion = document.createElement("div");
    $envRegion.className = "envRegion";
    $envRegion.id = `environment-${env.id}`;

    const $envButton = document.createElement("a");
    $envButton.onclick = () => {
        ws.send(JSON.stringify({ id: env.id, payload: { type: 'random' } }));
        console.log('OUTGOING :', { id: env.id, payload: { type: 'random' } });
    };
    $envButton.innerHTML = '+';
    $envButton.className = "fa fa-circle-info";
    $envRegion.appendChild($envButton);

    const $envTitle = document.createElement("div");
    $envTitle.className = "title";
    $envTitle.textContent = env.name;
    $envRegion.appendChild($envTitle);

    const $envAddress = document.createElement("div");
    $envAddress.textContent = env.url;
    $envAddress.className = "address";
    $envRegion.appendChild($envAddress);

    $root.appendChild($envRegion);
});




function connectWebSocket() {
    ws = new WebSocket(switchURL);

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'config', payload: environments }));
        document.querySelector('.nav-status').style.color = "#35b511";
    };

    ws.onclose = () => {
        document.querySelectorAll('.envRegion').forEach($envRegion => {
            $envRegion.querySelectorAll('.progCard').forEach($card => $card.remove());
        });
        document.querySelector('.nav-status').style.color = "#b51111";
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => { ws.close() };

    ws.onmessage = (msg) => {
        msg = JSON.parse(msg.data);
        console.log('INCOMING :', msg)
        const $env = document.querySelector(`#environment-${msg.id}`);
        let $prog = $env.querySelector(`#program-${msg.payload.target}`);

        if (msg.payload.type == "details" && !$prog) {
            const prog = msg.payload.value;
        
            const $card = document.createElement("div");
            $card.className = "progCard";
            $card.id = `program-${prog.process_id}`;

            const $status = document.createElement("span");
            $status.innerHTML = prog.status == "running" ? 'R' : 'S';
            $status.className = "progStatus " + (prog.status == "running" ? "statusRunning" : "statusStopped");
            $status.dataset.status = prog.status;
            $card.appendChild($status);

            const $label = document.createElement("span");
            $label.className = "progLabel";
            $label.textContent = `[${prog.process_id}] ${prog.program}`;
            $card.appendChild($label);

            const $details = document.createElement("a");
            $details.className = "fa fa-chevron-right";
            $details.innerHTML = '>';
            $card.appendChild($details);

            // Context menu setup
            const $menu = document.createElement("div");
            $menu.className = "context-menu";
            $menu.style.display = "none";
            $menu.style.position = "absolute";
            $menu.style.zIndex = 1000;
            $menu.innerHTML = `
                <div class="context-menu-item" data-action="toggle">🔄 Toggle Program</div>
                <div class="context-menu-item" data-action="download">📥 Download Logs</div>
                <div class="context-menu-item" data-action="console">🖥️ View Console</div>
            `;
            document.body.appendChild($menu);

            $details.addEventListener("click", (e) => {
                e.stopPropagation();
                // Close all other context menus before opening this one
                document.querySelectorAll('.context-menu').forEach(menu => {
                    menu.style.display = "none";
                });
                // Position menu near the button
                const rect = $details.getBoundingClientRect();
                $menu.style.left = `${rect.right + window.scrollX}px`;
                $menu.style.top = `${rect.top + window.scrollY}px`;
                $menu.style.display = "block";

                // Store program/environment info for actions
                $menu.dataset.envId = env.id;
                $menu.dataset.progId = prog.process_id;
            });

            // Hide menu on click outside
            document.addEventListener("click", () => {
                $menu.style.display = "none";
            });

            // Handle menu actions
            $menu.addEventListener("click", (e) => {
                if (!e.target.classList.contains("context-menu-item")) return;
                const action = e.target.dataset.action;
                const envId = $menu.dataset.envId;
                const progId = $menu.dataset.progId;

                if (action === "toggle") {
                    ws.send(JSON.stringify({ id: envId, payload: { type: "toggle", target: progId } }));
                } else if (action === "download") {
                    ws.send(JSON.stringify({ id: envId, payload: { type: "download_logs", target: progId } }));
                } else if (action === "console") {
                    ws.send(JSON.stringify({ id: envId, payload: { type: "view_console", target: progId } }));
                }
                $menu.style.display = "none";
            });

            $env.appendChild($card);
            
        }
        else if (msg.payload.type == "toggle") {
            let $card = $env.querySelector(`#program-${msg.payload.target}`);
            const $status = $card.querySelector(".progStatus");
            $status.innerHTML = msg.payload.value == "running" ? 'R' : 'S';
            $status.className = "progStatus " + (msg.payload.value == "running" ? "statusRunning" : "statusStopped");
            $status.dataset.status = msg.payload.value;
        }
        else if (msg.payload.type == "delete") {
            $env.querySelectorAll(".progCard").forEach($card => {
                $card.remove();
            });
        }
    };
}

connectWebSocket();



const $searchEnv = document.getElementById("search-env");
const $searchProg = document.getElementById("search-prog");

function filterView() {
    const envFilter = $searchEnv.value.toLowerCase();
    const progFilter = $searchProg.value.toLowerCase();

    document.querySelectorAll(".envRegion").forEach($env => {
        const envName = $env.querySelector(".title")?.textContent.toLowerCase() || "";
        const envAddress = $env.querySelector(".address")?.textContent.toLowerCase() || "";
        const envMatches = envName.includes(envFilter) || envAddress.includes(envFilter);

        let anyProgMatches = false;
        $env.querySelectorAll(".progCard").forEach($prog => {
            const label = $prog.querySelector(".progLabel")?.textContent.toLowerCase() || "";
            const status = $prog.querySelector(".progStatus")?.dataset.status.toLowerCase() || "";
            const progMatches = label.includes(progFilter) || status.includes(progFilter);

            $prog.style.display = progMatches ? "flex" : "none";
            if (progMatches) anyProgMatches = true;
        });

        $env.style.display = (envMatches && anyProgMatches) || (!progFilter && envMatches) || (!envFilter && anyProgMatches) ? "block" : "none";
    });
}

$searchEnv.addEventListener("input", filterView);
$searchProg.addEventListener("input", filterView);
