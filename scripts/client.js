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
            $details.addEventListener("click", () => alert(`Program ${prog.process_id} is ${$status.dataset.status}`));

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
