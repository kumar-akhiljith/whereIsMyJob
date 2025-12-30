const tableBody = document.getElementById("jobsTable");
const totalJobsEl = document.getElementById("totalJobs");
const resumeDropdown = document.getElementById("resumeDropdown");
const resumeUploadInput = document.getElementById("resumeUpload");
const resumeModal = document.getElementById("resumeModal");
const openResumeModalBtn = document.getElementById("openResumeModal");
const closeResumeModalBtn = document.getElementById("closeResumeModal");

// fix needs in this file - i have 2 event listeners The second one (inside renderJobs) uses authToken which isn't defined in that scope

const STATUS_OPTIONS = [
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
  "Ghosted"
];

document.addEventListener("change", async (e) => {
  if (!e.target.classList.contains("status-select")) return;

  const jobId = e.target.dataset.id;
  const newStatus = e.target.value;
  const select = e.target;

  // https://whereismyjob.onrender.com/api/jobs/${jobId}/status

  select.className = `status-select status-${newStatus.toLowerCase()}`;


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
    const response = await fetch("http://localhost:5000/api/jobs", {
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
    console.log('data.jobs', data.jobs)
    renderJobs(data.jobs);
  } catch (err) {
    console.error(err);
    showMessage("Something went wrong while loading jobs.");
  }
});

// status changes 

// main ui 
function renderJobs(jobs) {
  tableBody.innerHTML = "";
  totalJobsEl.textContent = jobs.length;

  if (jobs.length === 0) {
    showMessage("No jobs saved yet.");
    return;
  }

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
    <td>${job.jobLocation || "-"}</td>
    <td>${job.jobTitle || "-"}</td>
    <td>${new Date(job.appliedDate).toLocaleDateString()}</td>

    <td>
      <div class="scroll-box">
        ${job.jobDescription}
      </div>
    </td>

    <td class="resume-cell">
      <div class="resume-name">
      ${
        job.resumeId
          ? `<a href="${job.resumeId.fileUrl}"
              target="_blank"
              style="color:#007aff; text-decoration:none;">
              ${job.resumeId.name}
            </a>`
          : `<span style="color:#8e8e93"></span>`
      }
      </div>
      <button class="change-resume-btn" data-id="${job._id}">
         Upload new
        </button>
      <input
        type="file"
        class="resume-input"
        data-id="${job._id}"
        accept=".pdf,.doc,.docx"
        hidden
      />
    </td>

    <td>
    <div>
      <button class="delete-btn" data-id="${job._id}">Delete job</button>
    </div>
    <div style='margin-top: 10px;'>
     <div class="status-wrapper">
      <select class="status-select" data-id="${job._id}">
        <option value="Applied">Applied</option>
        <option value="Interviewing">Interviewing</option>
        <option value="Offer">Offer</option>
        <option value="Rejected">Rejected</option>
        <option value="Ghosted">Ghosted</option>
      </select>
      </div>
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

// resume functions

async function loadResumes() {
  chrome.storage.local.get("authToken", async (res) => {
    if (!res.authToken) return;
    // https://whereismyjob.onrender.com/api/resumes
    // http://localhost:5000
    const response = await fetch(
        "http://localhost:5000/api/resumes",
      {
        headers: {
          Authorization: `Bearer ${res.authToken}`
        }
      }
    );

    const data = await response.json();
    renderResumes(data.resumes || []);
  });
}

// cv ui funcions
openResumeModalBtn.addEventListener("click", () => {
  resumeModal.classList.remove("hidden");
  loadResumes();
});

closeResumeModalBtn.addEventListener("click", closeResumeModal);

resumeModal.querySelector(".modal-backdrop")
  .addEventListener("click", closeResumeModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeResumeModal();
});

function closeResumeModal() {
  resumeModal.classList.add("hidden");
}

function renderResumes(resumes) {
  const list = document.getElementById("resumeList");
  list.innerHTML = "";

  if (!resumes.length) {
    list.innerHTML = `
      <p style="color:#6e6e73; text-align:center;">
        No resumes uploaded yet
      </p>`;
    return;
  }

  resumes.forEach(resume => {
    const div = document.createElement("div");
    div.className = "resume-item";

    div.innerHTML = `
      <span class="resume-name" title="${resume.name}">
        ${resume.name}
      </span>
      <button class="resume-delete" data-id="${resume._id}">
        Delete
      </button>
    `;

    list.appendChild(div);
  });
}

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("resume-delete")) return;

  const resumeId = e.target.dataset.id;

  if (!confirm("Delete this resume?")) return;

  chrome.storage.local.get("authToken", async (res) => {
    if (!res.authToken) return;

    await fetch(
      `http://localhost:5000/api/resumes/${resumeId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${res.authToken}`
        }
      }
    );

    loadResumes();
    showToast("Resume deleted", "success");
  });
});

document.getElementById("resumeUpload").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  chrome.storage.local.get("authToken", async (res) => {
    if (!res.authToken) return;

    const formData = new FormData();
    formData.append("resume", file);

    try {
      await fetch(
        "http://localhost:5000/api/resumes/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${res.authToken}`
          },
          body: formData
        }
      );

      showToast("Resume uploaded", "success");
      loadResumes();
    } catch {
      showToast("Upload failed", "error");
    }
  });
});

// open file expo 
document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("change-resume-btn")) return;

  const jobId = e.target.dataset.id;
  const input = document.querySelector(
    `.resume-input[data-id="${jobId}"]`
  );

  input.click();
});

// re upload 
document.addEventListener("change", async (e) => {
  if (!e.target.classList.contains("resume-input")) return;

  const jobId = e.target.dataset.id;
  const file = e.target.files[0];
  if (!file) return;

  chrome.storage.local.get("authToken", async (res) => {
    if (!res.authToken) return;

    const formData = new FormData();
    formData.append("resume", file);

    try {
      console.log('ok till now')
      const response = await fetch(
        `http://localhost:5000/api/resumes/job/${jobId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${res.authToken}`
          },
          body: formData
        }
      );

      if (!response.ok) throw new Error();

      showToast("Resume updated for this job", "success");
      location.reload();

    } catch {
      showToast("Failed to update resume", "error");
    }
  });
});

loadResumes();
// -------------
