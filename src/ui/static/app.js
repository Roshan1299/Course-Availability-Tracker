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

    // Format health status with appropriate styling
    const getHealthClass = (health) => {
      switch(health) {
        case 'healthy': return 'status healthy';
        case 'stale': return 'status stale';
        case 'error': return 'status error';
        case 'stopped': return 'status stopped';
        default: return 'status unknown';
      }
    };

    // Format mode status with appropriate styling
    const getModeClass = (mode) => {
      switch(mode) {
        case 'active': return 'status active';
        case 'paused': return 'status paused';
        case 'stopped': return 'status stopped';
        default: return 'status unknown';
      }
    };

    row.innerHTML = `
      <td>${m.course_code}</td>
      <td>${m.section_label}</td>
      <td>${m.last_seen ?? "—"}</td>
      <td>${formatTimestamp(m.last_checked_at)}</td>
      <td>${formatTimestamp(m.last_changed_at)}</td>
      <td class="${getModeClass(m.mode)}">${m.mode}</td>
      <td class="${getHealthClass(m.health)}">${m.health}</td>
      <td class="actions">
        <button class="history-btn">View History</button>
        ${m.mode === 'active' ?
          `<button class="pause-btn">Pause</button>` :
          `<button class="resume-btn">Resume</button>`
        }
        <button class="stop-btn">Stop</button>
      </td>
    `;

    console.log("Row HTML:", row.innerHTML); // Debug log

    // Handle stop button
    const stopBtn = row.querySelector(".stop-btn");
    stopBtn.onclick = async () => {
      await fetch(`/monitors/${m.id}`, { method: "DELETE" });
      fetchMonitors();
    };

    // Handle pause button
    const pauseBtn = row.querySelector(".pause-btn");
    if (pauseBtn) {
      pauseBtn.onclick = async () => {
        await fetch(`/monitors/${m.id}/pause`, { method: "POST" });
        fetchMonitors();
      };
    }

    // Handle resume button
    const resumeBtn = row.querySelector(".resume-btn");
    if (resumeBtn) {
      resumeBtn.onclick = async () => {
        await fetch(`/monitors/${m.id}/resume`, { method: "POST" });
        fetchMonitors();
      };
    }

    // Handle history button
    const historyBtn = row.querySelector(".history-btn");
    if (historyBtn) {
      historyBtn.onclick = () => {
        showHistoryModal(m);
      };
    }

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


// Show history modal for a specific monitor
async function showHistoryModal(monitor) {
  // Fetch all notifications
  try {
    const res = await fetch("/notifications");
    const notifications = await res.json();

    // Filter notifications for this specific monitor
    const monitorNotifications = notifications.filter(n => n.monitor_id === monitor.id);

    // Sort by timestamp (newest first)
    monitorNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Update modal header
    document.querySelector('.modal-header h3').textContent =
      `Notification History - ${monitor.course_code} ${monitor.section_label}`;

    // Populate the history table
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = '';

    if (monitorNotifications.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="3" style="text-align: center;">No notifications yet</td>';
      tbody.appendChild(row);
    } else {
      monitorNotifications.forEach(n => {
        const row = document.createElement('tr');

        // Format timestamp for display
        const date = new Date(n.timestamp);
        const today = new Date();
        let timeStr;
        if (date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()) {
          timeStr = date.toLocaleTimeString();
        } else {
          timeStr = date.toLocaleString();
        }

        row.innerHTML = `
          <td>${n.old_value}</td>
          <td>${n.new_value}</td>
          <td>${timeStr}</td>
        `;

        tbody.appendChild(row);
      });
    }

    // Show the modal
    document.getElementById('history-modal').style.display = 'block';
  } catch (error) {
    console.error('Error fetching notification history:', error);
  }
}

// Close modal when clicking the X
document.querySelector('.close').onclick = function() {
  document.getElementById('history-modal').style.display = 'none';
};

// Close modal when clicking outside of it
window.onclick = function(event) {
  const modal = document.getElementById('history-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

setInterval(fetchMonitors, 2000);
fetchMonitors();
