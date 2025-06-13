import "./style.css";


// Fetch Environments
async function fetchEnvironments() {
    const response = await fetch("data.json");
    const data = await response.json();
    return data || [];
}
let environments = await fetchEnvironments();


// Render Environments
const $root = document.getElementById("root");

environments.forEach((env) => {
    const $envRegion = document.createElement("div");
    $envRegion.className = "envRegion";
    $envRegion.id = `environment-${env.id}`;

    const $envButton = document.createElement("a");
    $envButton.href = "#";
    $envButton.className = "fa fa-circle-info";
    $envRegion.appendChild($envButton);

    const $envTitle = document.createElement("div");
    $envTitle.className = "title";
    $envTitle.textContent = env.name;
    $envRegion.appendChild($envTitle);

    const $envAddress = document.createElement("div");
    $envAddress.textContent = env.address;
    $envAddress.className = "address";
    $envRegion.appendChild($envAddress);

    $root.appendChild($envRegion);
});


// Handle Connection
let ws;
const switchURL = "ws://localhost:8001/ws";

function connectWebSocket() {
    ws = new WebSocket(switchURL);

    ws.onopen = () => {
        ws.send(JSON.stringify(environments));
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

    ws.onmessage = (raw) => {
        const msg = JSON.parse(raw.data);
        console.log('INCOMING :', msg)
        const $env = document.querySelector(`#environment-${msg.id}`);
        const code = msg.payload.Object.startsWith("/Infs/") && msg.payload.Object.replace("/Infs/", "");
        let $inter = $env.querySelector(`#interface-${code}`);

        // List event received => render programs list
        if (msg.payload.Event == "List" && code && !$inter) {
            msg.payload.forEach((prog) => {
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
                $card.appendChild($details);
                $details.addEventListener("click", () => alert(`Program ${prog.process_id} is ${$status.dataset.status}`));

                $env.appendChild($card);
            });
        }
        // Change event received => update existing program
        else if (msg.payload.Event == "Change" && msg.payload.Prop == "State") {
            let $card = $env.querySelector(`#program-${msg.payload.process_id}`);
            const $status = $card.querySelector(".progStatus");
            $status.innerHTML = msg.payload.status == "running" ? 'R' : 'S';
            $status.className = "progStatus " + (msg.payload.status == "running" ? "statusRunning" : "statusStopped");
            $status.dataset.status = msg.payload.status;
        }
        // Delete event received => remove existing program
        else if (msg.payload.Event == "Delete") {
            $inter = $env.querySelector(`#interface-${msg.payload.Prop}`);
            $inter.remove();
        }
    };
}

connectWebSocket();


// Search Functionality
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
