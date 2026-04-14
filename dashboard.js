const API_URL = "https://script.google.com/macros/s/AKfycbz_lhUFiSu8PGNfZMKC9CmUG_cLwm02Z2D4FmBn1hhQamMQeIOLGk18zBNE5X8KEGxh/exec";

let allVisitors = [];

const visitorTableBody = document.getElementById("visitorTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const detailsModal = document.getElementById("detailsModal");
const modalContent = document.getElementById("modalContent");

async function loadAllData() {
  await Promise.all([loadVisitors(), loadStats()]);
}

async function loadVisitors() {
  try {
    const response = await fetch(`${API_URL}?action=listVisitors`);
    const result = await response.json();

    allVisitors = result.visitors || [];
    allVisitors.reverse();
    renderTable();
  } catch (error) {
    visitorTableBody.innerHTML = `<tr><td colspan="8" class="empty-cell">Failed to load visitor records.</td></tr>`;
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${API_URL}?action=dashboardStats`);
    const result = await response.json();
    const stats = result.stats || {};

    document.getElementById("statTotal").textContent = stats.total || 0;
    document.getElementById("statPending").textContent = stats.pending || 0;
    document.getElementById("statApproved").textContent = stats.approved || 0;
    document.getElementById("statCheckedIn").textContent = stats.checkedIn || 0;
    document.getElementById("statToday").textContent = stats.todayVisits || 0;
  } catch (error) {
    console.error("Stats load failed", error);
  }
}

function getBadgeClass(status) {
  if (status === "Approved") return "approved";
  if (status === "Declined") return "declined";
  if (status === "Checked In") return "checkedin";
  if (status === "Checked Out") return "checkedout";
  return "pending";
}

function renderTable() {
  const keyword = searchInput.value.trim().toLowerCase();
  const statusValue = statusFilter.value;

  const filtered = allVisitors.filter(v => {
    const combined = [
      v["Request ID"],
      v["Full Name"],
      v["Company"],
      v["Person To Visit"],
      v["Department"],
      v["Plate Number"],
      v["Vehicle Type"],
      v["Car Model"]
    ].join(" ").toLowerCase();

    const matchesSearch = combined.includes(keyword);
    const matchesStatus = statusValue === "All" || String(v["Status"]) === statusValue;

    return matchesSearch && matchesStatus;
  });

  if (!filtered.length) {
    visitorTableBody.innerHTML = `<tr><td colspan="8" class="empty-cell">No visitor records found.</td></tr>`;
    return;
  }

  visitorTableBody.innerHTML = filtered.map(v => `
    <tr>
      <td>${escapeHtml(v["Request ID"] || "")}</td>
      <td>${escapeHtml(v["Full Name"] || "")}</td>
      <td>${escapeHtml(v["Company"] || "")}</td>
      <td>${escapeHtml(v["Vehicle Type"] || "-")} ${v["Car Model"] ? `<br><span class="subtext">${escapeHtml(v["Car Model"])}</span>` : ""}</td>
      <td>${escapeHtml(v["Plate Number"] || "-")}</td>
      <td>
        ${escapeHtml(v["Visit Date"] || "")}<br>
        <span class="subtext">${escapeHtml(v["Visit Time"] || "")}</span>
      </td>
      <td><span class="status-pill ${getBadgeClass(v["Status"] || "Pending")}">${escapeHtml(v["Status"] || "Pending")}</span></td>
      <td>
        <div class="action-group">
          <button class="btn-outline" onclick="viewDetails('${escapeJs(v["Request ID"] || "")}')">View</button>
          <button class="btn-success" onclick="changeStatus('${escapeJs(v["Request ID"] || "")}', 'Approved')">Approve</button>
          <button class="btn-danger" onclick="changeStatus('${escapeJs(v["Request ID"] || "")}', 'Declined')">Decline</button>
          <button class="btn-warning" onclick="checkIn('${escapeJs(v["Request ID"] || "")}')">Check In</button>
          <button class="btn-outline" onclick="checkOut('${escapeJs(v["Request ID"] || "")}')">Check Out</button>
        </div>
      </td>
    </tr>
  `).join("");
}

async function changeStatus(requestId, status) {
  const remarks = prompt(`Enter remarks for ${status} (optional):`) || "";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "updateStatus",
        requestId,
        status,
        remarks
      })
    });

    const result = await response.json();

    if (result.success) {
      alert("Status updated successfully.");
      await loadAllData();
    } else {
      alert(result.message || "Failed to update status.");
    }
  } catch (error) {
    alert("Unable to connect to server.");
  }
}

async function checkIn(requestId) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "checkInVisitor",
        requestId
      })
    });

    const result = await response.json();

    if (result.success) {
      alert("Visitor checked in successfully.");
      await loadAllData();
    } else {
      alert(result.message || "Failed to check in visitor.");
    }
  } catch (error) {
    alert("Unable to connect to server.");
  }
}

async function checkOut(requestId) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "checkOutVisitor",
        requestId
      })
    });

    const result = await response.json();

    if (result.success) {
      alert("Visitor checked out successfully.");
      await loadAllData();
    } else {
      alert(result.message || "Failed to check out visitor.");
    }
  } catch (error) {
    alert("Unable to connect to server.");
  }
}

function formatDateOnly(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  return escapeHtml(String(value));
}

function formatTimeOnly(value) {
  if (!value) return "-";

  const text = String(value).trim();

  if (/^\d{2}:\d{2}$/.test(text)) {
    const [hours, minutes] = text.split(":");
    const d = new Date();
    d.setHours(Number(hours), Number(minutes), 0, 0);
    return d.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  return escapeHtml(text);
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  return escapeHtml(String(value));
}

function closeModal() {
  detailsModal.classList.add("hidden");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJs(text) {
  return String(text).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

searchInput.addEventListener("input", renderTable);
statusFilter.addEventListener("change", renderTable);
detailsModal.addEventListener("click", (e) => {
  if (e.target === detailsModal) closeModal();
});

loadAllData();