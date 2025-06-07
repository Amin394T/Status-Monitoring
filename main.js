import "./style.css";

const $root = document.getElementById("root");
const switchURL = "ws://localhost:8080";

// Add selectors for search inputs
const $searchEnv = document.getElementById("search-env");
const $searchProg = document.getElementById("search-prog");

// Fetch Environments
async function fetchEnvironments() {
    const response = await fetch("data.json");
    const data = await response.json();
    return data || [];
}
let environments = await fetchEnvironments();

// Store latest program data for each environment
let envPrograms = {}; // { [envId]: [programs] }

// Helper: Render environments (filtered)
function renderEnvironments(envs) {
    $root.innerHTML = "";
    envs.forEach((env) => {
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

        // If programs for this env are available, render them (filtered)
        if (envPrograms[env.id]) {
            renderPrograms($envRegion, envPrograms[env.id]);
        }
    });
}

// Helper: Render programs for an environment (filtered)
function renderPrograms($envRegion, programs) {
    $envRegion.querySelectorAll('.progCard').forEach($card => $card.remove());
    let progFilter = ($searchProg && $searchProg.value) ? $searchProg.value.toLowerCase() : "";
    programs
        .filter(prog =>
            !progFilter ||
            prog.program.toLowerCase().includes(progFilter) ||
            String(prog.process_id).includes(progFilter)
        )
        .forEach((prog) => {
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

            $envRegion.appendChild($card);
        });
}

// Helper: Apply both filters and render
function applyFilters() {
    const envFilter = ($searchEnv && $searchEnv.value) ? $searchEnv.value.toLowerCase() : "";
    const filteredEnvs = environments.filter(env =>
        !envFilter ||
        env.name.toLowerCase().includes(envFilter) ||
        env.address.toLowerCase().includes(envFilter)
    );
    $root.innerHTML = "";
    filteredEnvs.forEach((env) => {
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

        if (envPrograms[env.id]) {
            renderPrograms($envRegion, envPrograms[env.id]);
        }
    });
}

// Initial render
renderEnvironments(environments);

// Filter environments and programs on search
if ($searchEnv) {
    $searchEnv.addEventListener("input", applyFilters);
}
if ($searchProg) {
    $searchProg.addEventListener("input", applyFilters);
}

// Initialize Connection with Retry
let ws;
function connectWebSocket() {
    ws = new WebSocket(switchURL);

    ws.onopen = () => {
        ws.send(JSON.stringify(environments));
        document.querySelector('.nav-status').style.color = "#35b511";
        console.log("WebSocket connection established");
    };

    ws.onclose = () => {
        document.querySelectorAll('.envRegion').forEach($envRegion => {
            $envRegion.querySelectorAll('.progCard').forEach($card => $card.remove());
        });
        document.querySelector('.nav-status').style.color = "#b51111";
        setTimeout(connectWebSocket, 2000);
        console.log("WebSocket connection closed. Retrying...");
    };

    ws.onerror = (err) => {
        console.log("WebSocket connection failed. Retrying...");
        ws.close();
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        console.log('INCOMING :', data)
        // Store latest programs for this environment
        if (Array.isArray(data.payload)) {
            envPrograms[data.id] = data.payload;
            // Only render if env is visible (filtered)
            const $env = document.querySelector(`#environment-${data.id}`);
            if ($env) renderPrograms($env, data.payload);
        }
        else {
            // Update single program status
            const $env = document.querySelector(`#environment-${data.id}`);
            let $card = $env && $env.querySelector(`#program-${data.payload.process_id}`);
            if ($card) {
                const $status = $card.querySelector(".progStatus");
                $status.innerHTML = data.payload.status == "running" ? 'R' : 'S';
                $status.className = "progStatus " + (data.payload.status == "running" ? "statusRunning" : "statusStopped");
                $status.dataset.status = data.payload.status;
            }
            // Also update envPrograms for filtering
            if (envPrograms[data.id]) {
                let idx = envPrograms[data.id].findIndex(p => p.process_id === data.payload.process_id);
                if (idx !== -1) envPrograms[data.id][idx] = data.payload;
            }
        }
    };
}

connectWebSocket();