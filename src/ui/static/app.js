const form = document.getElementById("monitor-form");
const table = document.getElementById("monitors");

async function fetchMonitors() {
  const res = await fetch("/monitors");
  const monitors = await res.json();

  console.log("Fetched monitors:", monitors); // Debug log

  table.innerHTML = "";
  monitors.forEach(m => {
    console.log("Processing monitor:", m); // Debug log

    const row = document.createElement("tr");

    // Format timestamp for display (show only time if from today, otherwise full date)
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return "—";
      const date = new Date(timestamp);
      const today = new Date();
      // If same day, show only time
      if (date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()) {
        return date.toLocaleTimeString();
      }
      // Otherwise show date and time
      return date.toLocaleString();
    };

    // Check if timestamps exist in the data
    console.log("Timestamps for monitor:", {
      last_checked_at: m.last_checked_at,
      last_changed_at: m.last_changed_at
    });

    row.innerHTML = `
      <td>${m.course_code}</td>
      <td>${m.section_label}</td>
      <td>${m.last_seen ?? "—"}</td>
      <td>${formatTimestamp(m.last_checked_at)}</td>
      <td>${formatTimestamp(m.last_changed_at)}</td>
      <td class="status running">Running</td>
      <td><button class="stop-btn">Stop</button></td>
    `;

    console.log("Row HTML:", row.innerHTML); // Debug log

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
