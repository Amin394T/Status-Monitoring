import "./style.css";

const root = document.getElementById("root");

// fetch environments
async function fetchEnvironments() {
    const response = await fetch("data.json");
    const data = await response.json();
    return data || [];
}
let environments = await fetchEnvironments();

// render environments
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


// initialize websocket connection
const ws = new WebSocket("ws://localhost:8080");

ws.onopen = () => {
    console.log("WebSocket connection established");
    ws.send(JSON.stringify(environments));
};

// handle incoming messages
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
            card.appendChild(status);

            const label = document.createElement("span");
            label.className = "interLabel";
            label.textContent = `[${inter.process_id}] ${inter.program}`;
            card.appendChild(label);

            const details = document.createElement("a");
            details.className = "fa fa-chevron-right";
            card.appendChild(details);
            details.addEventListener("click", () => alert(`Details for ${inter.process_id}`));

            env.appendChild(card);
        });
    }
    else {
        let card = env.querySelector(`#interface-${data.payload.process_id}`);
        const status = card.querySelector(".interStatus");
        status.innerHTML = data.payload.status == "running" ? 'R' : 'S';
        status.className = "interStatus " + (data.payload.status == "running" ? "statusRunning" : "statusStopped");
    }
};

// const envIndex = environments.findIndex((item) => item.id == id);
    
// const interIndex = environments[envIndex].list.findIndex((item) => item.code == code);
// interIndex == -1
//     ? environments[envIndex].list.push({ ...payload.Value })
//     : (environments[envIndex].list[intIndex].State = payload.Value);

// if (payload.Object.startsWith("/Infs/")) {
//     const code = payload.Object.replace("/Infs/", "");
//      if (payload.Event === "List") {
// } else if (payload.Event == "Change" && payload.Prop == "State") {