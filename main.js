import "./style.css";

const root = document.getElementById("root");

// Fetch Environments
async function fetchEnvironments() {
    const response = await fetch("data.json");
    const data = await response.json();
    return data || [];
}
let environments = await fetchEnvironments();

// Render Environments
environments.forEach((env) => {
    const envRegion = document.createElement("div");
    envRegion.className = "envRegion";
    envRegion.id = `environment-${env.id}`;

    const envButton = document.createElement("a");
    envButton.href = "#";
    envButton.className = "fa fa-circle-info";
    envRegion.appendChild(envButton);

    const envTitle = document.createElement("div");
    envTitle.className = "title";
    envTitle.textContent = env.name;
    envRegion.appendChild(envTitle);

    const envAddress = document.createElement("div");
    envAddress.textContent = env.address;
    envAddress.className = "address";
    envRegion.appendChild(envAddress);

    root.appendChild(envRegion);
});


// Initialize Connection with Retry
let ws;
function connectWebSocket() {
    ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
        console.log("WebSocket connection established");
        ws.send(JSON.stringify(environments));
    };

    ws.onclose = () => {
        console.log("WebSocket connection closed. Retrying...");
        setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = (err) => {
        console.log("WebSocket connection failed. Retrying...");
        ws.close();
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        const env = document.querySelector(`#environment-${data.id}`);
        
        if (Array.isArray(data.payload)) {
            data.payload.forEach((inter) => {
                const card = document.createElement("div");
                card.className = "interCard";
                card.id = `interface-${inter.process_id}`;

                const status = document.createElement("span");
                status.innerHTML = inter.status == "running" ? 'R' : 'S';
                status.className = "interStatus " + (inter.status == "running" ? "statusRunning" : "statusStopped");
                status.dataset.status = inter.status;
                card.appendChild(status);

                const label = document.createElement("span");
                label.className = "interLabel";
                label.textContent = `[${inter.process_id}] ${inter.program}`;
                card.appendChild(label);

                const details = document.createElement("a");
                details.className = "fa fa-chevron-right";
                card.appendChild(details);
                details.addEventListener("click", () => alert(`Program ${inter.process_id} is ${status.dataset.status}`));

                env.appendChild(card);
            });
        }
        else {
            let card = env.querySelector(`#interface-${data.payload.process_id}`);
            const status = card.querySelector(".interStatus");
            status.innerHTML = data.payload.status == "running" ? 'R' : 'S';
            status.className = "interStatus " + (data.payload.status == "running" ? "statusRunning" : "statusStopped");
            status.dataset.status = data.payload.status;
        }
    };
}

connectWebSocket();