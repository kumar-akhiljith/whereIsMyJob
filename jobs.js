const tableBody = document.getElementById("jobsTable");
const totalJobsEl = document.getElementById("totalJobs");

const STATUS_OPTIONS = [
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
  "Ghosted"
];

function getStatusClass(status) {
  return `status-${status.toLowerCase()}`;
}

// status select component 
function renderStatusSelect(job) {
  return `
    <div class="status-wrapper">
      <select class="status-select"
              data-id="${job._id}">
        ${STATUS_OPTIONS.map(status => `
          <option value="${status}" ${job.status === status ? "selected" : ""}>
            ${status}
          </option>
        `).join("")}
      </select>
    </div>
  `;
}

chrome.storage.local.get("authToken", async (res) => {
  if (!res.authToken) {
    showMessage("You must be logged in to view jobs.");
    return;
  }

  try {
    const response = await fetch("https://whereismyjob.onrender.com/api/jobs", {
      headers: {
        Authorization: `Bearer ${res.authToken}`
      }
    });

    if (response.status === 401) {
      showMessage("Session expired. Please log in again.");
      return;
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.jobs)) {
      showMessage("Failed to load jobs.");
      return;
    }

    renderJobs(data.jobs);
  } catch (err) {
    console.error(err);
    showMessage("Something went wrong while loading jobs.");
  }
});

// status changes 
document.addEventListener("change", (e) => {
  if (!e.target.classList.contains("status-select")) return;

  const jobId = e.target.dataset.id;
  const newStatus = e.target.value;

  chrome.storage.local.get("authToken", async (res) => {
    if (!res.authToken) {
      showToast("Session expired. Please log in again.", "error");
      return;
    }

    try {
      await fetch(`http://localhost:5000/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${res.authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      showToast("Status updated", "success");
    } catch (err) {
      console.error("Status update failed", err);
      showToast("Failed to update status", "error");
    }
  });
});

// main ui 
function renderJobs(jobs) {
  tableBody.innerHTML = "";
  totalJobsEl.textContent = jobs.length;

  if (jobs.length === 0) {
    showMessage("No jobs saved yet.");
    return;
  }

document.addEventListener("change", async (e) => {
  if (!e.target.classList.contains("status-select")) return;

  const jobId = e.target.dataset.id;
  const newStatus = e.target.value;
  const select = e.target;

  // https://whereismyjob.onrender.com/api/jobs/${jobId}/status

  select.className = `status-select status-${newStatus.toLowerCase()}`;

  try {
    await fetch(`http://localhost:5000/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    showToast("Status updated", "success");
  } catch {
    showToast("Failed to update status", "error");
  }
});


jobs.forEach((job, index) => {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${index + 1}</td>

    <td>
      <a href="${job.companyLinkedinUrl || '#'}"
         target="_blank"
         rel="noopener noreferrer"
         style="color:#007aff; font-weight:500; text-decoration:none;">
        ${job.companyName}
      </a>
    </td>
    <td>${job.jobTitle || "-"}</td>
    <td>${job.location || "-"}</td>
    <td>${new Date(job.appliedDate).toLocaleDateString()}</td>

    <td>
      <div class="scroll-box">
        ${job.jobDescription}
      </div>
    </td>

    <td>
    <div>
      <button class="delete-btn" data-id="${job._id}">Delete job</button>
    </div>
    <div style='margin-top: 10px;'>
      <select class="status-select" data-id="${job._id}">
        <option value="Applied">Applied</option>
        <option value="Interviewing">Interviewing</option>
        <option value="Offer">Offer</option>
        <option value="Rejected">Rejected</option>
        <option value="Ghosted">Ghosted</option>
      </select>
    </div>
    </td>
  `;

  jobsTable.appendChild(row);
  const select = row.querySelector(".status-select");
  select.value = job.status || "Applied";
  select.className = `status-select ${getStatusClass(select.value)}`;

});

}

function showMessage(msg) {
  tableBody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align:center; padding:20px;">
        ${msg}
      </td>
    </tr>
  `;
  totalJobsEl.textContent = "0";
}

function updateJobCountAndNumbers() {
  const rows = document.querySelectorAll("#jobsTable tr");
  totalJobsEl.textContent = rows.length;

  rows.forEach((row, i) => {
    row.children[0].textContent = i + 1;
  });
}

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-btn")) return;

  const jobId = e.target.dataset.id;

  const confirmed = confirm("Delete this job? This cannot be undone.");
  if (!confirmed) return;

  chrome.storage.local.get("authToken", async (res) => {
    if (!res.authToken) return;

    try {
      const response = await fetch(
        `https://whereismyjob.onrender.com/api/jobs/${jobId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${res.authToken}`
          }
        }
      );

      if (!response.ok) {
        showToast("Failed to delete job", "error");
        throw new Error("Delete failed");
      }

      const row = e.target.closest("tr");
      row.remove();
      updateJobCountAndNumbers();
      showToast("Job deleted successfully", "success");
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete job. Try again.");
    }
  });
});

const toastEl = document.getElementById("toast");

function showToast(message, type = "success") {
  toastEl.textContent = message;
  toastEl.className = `toast show ${type}`;

  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2500);
}
