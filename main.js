import "./style.css";

const res = await fetch("data.json");
const data = await res.json();

const app = document.querySelector("#app");
app.innerHTML = "";

const columnsContainer = document.createElement("div");
columnsContainer.classList.add("columns-container");

data.forEach((env) => {
  const col = document.createElement("div");
  col.classList.add("env-column");

  const header = document.createElement("h2");
  header.textContent = env.environment;
  header.classList.add("env-header");
  col.appendChild(header);

  const addr = document.createElement("div");
  addr.textContent = env.address;
  addr.classList.add("env-address");
  col.appendChild(addr);

  env.programs.forEach((prog) => {
    const card = document.createElement("div");
    card.classList.add("program-card");

    card.innerHTML = `
        <div class="program-title">${prog.program}</div>
        <div class="program-path">
          Path: <a class="program-url" href="${prog.url_path}" target="_blank" rel="noopener">${prog.url_path}</a>
        </div>
        <div>PID: ${prog.process_id}</div>
        <div>Status: <span class="program-status ${prog.status === "running" ? "running" : "stopped"}">${prog.status}</span></div>
        <div>Start: ${prog.start_time ? prog.start_time : "-"}</div>
        <div>End: ${prog.end_time ? prog.end_time : "-"}</div>
      `;
    col.appendChild(card);
  });

  columnsContainer.appendChild(col);
});

app.appendChild(columnsContainer);
