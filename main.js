import "./style.css";

const root = document.getElementById("root");

let environments = [];
async function fetchEnvironments() {
    const response = await fetch("data.json");
    const data = await response.json();
    return data;
}

environments = await fetchEnvironments();
console.log(environments);
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

/*

(async function init() {

  try {
    environments = await fetchEnvironments();
    console.log(environments);
  } catch (error) {
    console.error(error);
    return; // Stop execution if data fetch fails
  }

  const ws = new WebSocket("ws://127.0.0.1:8000/ws");

  ws.onopen = function () {
    ws.send(
      JSON.stringify({
        cmd: "CONFIG",
        supervisors: environments,
      })
    );
    console.log("Sent CONFIG ?", environments);
  };

  // Environments Columns //
  

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    const id = data.id;
    const payload = data.payload;

    let env = document.querySelector(`#environment-${id}`);

    if (payload.Object.startsWith("/Infs/")) {
      const code = payload.Object.replace("/Infs/", "");

      const envIndex = environments.findIndex((item) => item.id == id);
      console.log(envIndex);
      const intIndex = environments[envIndex].list.findIndex(
        (item) => item.code == code
      );
      intIndex == -1
        ? environments[envIndex].list.push({ ...payload.Value })
        : (environments[envIndex].list[intIndex].State = payload.Value);

      if (payload.Event === "List") {
        card = document.createElement("div");
        card.className = "interCard";
        card.id = `interface-${payload.Value.Code}`;

        const status = document.createElement("span");
        status.innerHTML =
          payload.Value.State == "runing" ? runningIcon : stoppedIcon;
        status.className =
          payload.Value.State == "runing" ? "statusRunning" : "statusStopped";
        card.appendChild(status);

        const label = document.createElement("h5");
        label.textContent = `[${payload.Value.Code}] ${payload.Value.Name}`;
        card.appendChild(label);

        const details = document.createElement("a");
        details.className = "fa fa-chevron-right";
        card.appendChild(details);
        details.addEventListener("click", function () {
          //const url = `f?p=&APP_ID.:30:&SESSION.::NO::P30_SUPERVISOR_ID,P30_INTERFACE_CODE,P30_INTERFACE_NAME:${id},${payload.Code},${payload.Name}`;
          apex.server.process(
            "OPEN_DETAILS",
            {
              x01: id,
              x02: payload.Value.Code,
              x03: payload.Value.Name,
              x04: payload.Value.State,
            },
            {
              success: function (script) {
                // details.href = script;
                eval(script.slice("javascript:".length));
              },
              dataType: "text",
            }
          );
        });

        env.appendChild(card);
      } else if (payload.Event == "Change" && payload.Prop == "State") {
        let card = document.querySelector(`#interface-${code}`);
        const status = card.querySelector("span");
        status.innerHTML =
          payload.Value == "runing" ? runningIcon : stoppedIcon;
        status.className =
          payload.Value == "runing" ? "statusRunning" : "statusStopped";
      }
    }
  };
})();

*/