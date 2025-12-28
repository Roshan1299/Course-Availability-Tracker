const form = document.getElementById("monitor-form");
const table = document.getElementById("monitors");

async function fetchMonitors() {
  const res = await fetch("/monitors");
  const monitors = await res.json();

  table.innerHTML = "";
  monitors.forEach(m => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${m.course_code}</td>
      <td>${m.section_label}</td>
      <td>${m.last_seen ?? "—"}</td>
      <td class="status running">Running</td>
      <td><button class="stop-btn">Stop</button></td>
    `;

    row.querySelector("button").onclick = async () => {
      await fetch(`/monitors/${m.id}`, { method: "DELETE" });
      fetchMonitors();
    };

    table.appendChild(row);
  });
}

form.onsubmit = async (e) => {
  e.preventDefault();

  await fetch("/monitors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: document.getElementById("url").value,
      course_code: document.getElementById("course_code").value,
      section_label: document.getElementById("section_label").value,
      check_every_seconds: Number(document.getElementById("interval").value),
      notify: document.getElementById("notify").checked
    })
  });

  form.reset();
  fetchMonitors();
};

setInterval(fetchMonitors, 2000);
fetchMonitors();
