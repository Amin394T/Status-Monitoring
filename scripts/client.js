import "../style.css";
import "bootstrap-icons/font/bootstrap-icons.css";

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
    $envButton.className = "bi bi-gear";
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
            $status.innerHTML = prog.status == "running" ? '<i class="bi bi-check2"></i>' : '<i class="bi bi-x-lg"></i>';
            $status.className = "progStatus " + (prog.status == "running" ? "statusRunning" : "statusStopped");
            $status.dataset.status = prog.status;
            $card.appendChild($status);

            const $label = document.createElement("span");
            $label.className = "progLabel";
            $label.textContent = `[${prog.process_id}] ${prog.program}`;
            $card.appendChild($label);

            const $details = document.createElement("a");
            $details.className = "bi bi-chevron-right";
            $card.appendChild($details);

            const $menu = document.createElement("div");
            $menu.className = "context-menu";
            $menu.innerHTML = `
                <div class="context-menu-item" data-action="toggle"><i class="bi bi-toggle2-on"></i> Toggle Program</div>
                <div class="context-menu-item" data-action="console"><i class="bi bi-terminal"></i> View Console</div>
                <div class="context-menu-item" data-action="download"><i class="bi bi-download"></i> Download Logs</div>
            `;
            $card.appendChild($menu);

            $details.addEventListener("click", (e) => {
                e.stopPropagation();
                document.querySelectorAll('.context-menu').forEach(menu => {
                    menu.style.display = "none";
                });

                $menu.style.display = "block";
                $menu.dataset.envId = msg.id;
                $menu.dataset.progId = prog.process_id;
            });

            document.addEventListener("click", () => {
                $menu.style.display = "none";
            });

            $menu.addEventListener("click", (e) => {
                if (!e.target.classList.contains("context-menu-item")) return;
                const action = e.target.dataset.action;
                const envId = $menu.dataset.envId;
                const progId = $menu.dataset.progId;

                if (action === "toggle") {
                    ws.send(JSON.stringify({ id: envId, payload: { type: "toggle", target: progId, value: $status.dataset.status === "running" ? "stop" : "run" } }));
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
            $status.innerHTML = msg.payload.value == "running" ? '<i class="bi bi-check2"></i>' : '<i class="bi bi-x-lg"></i>';
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
