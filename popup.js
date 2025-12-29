const loginBtn = document.getElementById("loginBtn");
const viewJobs = document.getElementById("viewJobs");
const saveJD = document.getElementById("saveJD");
const logoutBtn = document.getElementById("logoutBtn");
const statusEl = document.getElementById("status");

// managing render waking up time -temporary
let wakeupTimeout = null;

function showWakingUpMessage() {
  statusEl.textContent = "Waking up server, please wait…";
}

function clearWakingUpMessage() {
  if (wakeupTimeout) {
    clearTimeout(wakeupTimeout);
    wakeupTimeout = null;
  }
  statusEl.textContent = "";
}

saveJD.style.display = 'none'
viewJobs.style.display = 'none'

chrome.storage.local.get(["authToken", "userName"], (res) => {
  if (!res.authToken || !res.userName) {
    showLoggedOut();
    return;
  }

  if (isTokenExpired(res.authToken)) {
    chrome.storage.local.remove(
      ["authToken", "userName", "userEmail"],
      () => {
        showLoggedOut();
      }
    );
    return;
  }

  showLoggedIn(res.userName);
});

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true; 
  }
}

loginBtn.addEventListener("click", () => {
  chrome.tabs.create({
    url: "https://whereismyjob.onrender.com/auth/google"
  });
});

logoutBtn.addEventListener("click", () => {
  chrome.storage.local.remove(
    ["authToken", "userName", "userEmail"],
    () => {
      showLoggedOut();
    }
  );
});

// document.getElementById("saveJD").addEventListener("click", async () => {
//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     files: ["content.js"]
//   });
// });

saveJD.addEventListener("click", async () => {
  showSavingState();

  wakeupTimeout = setTimeout(() => {
    showWakingUpMessage();
  }, 3000);

  try {
     const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (
      !tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("edge://")
    ) {
      throw new Error("Unsupported page");
    }

    try {
      await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_JOB" });
    } catch (err) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_JOB" });
    }

  } catch (err) {
    console.warn("No content script found", err);

    clearWakingUpMessage();
    resetSaveButton();
    saveJD.textContent = "Failed! Try again.";
    statusEl.textContent =
      "Something went wrong.";
  }
});


document.getElementById("viewJobs").addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("jobs.html")
  });
});

// document.getElementById("loginBtn").addEventListener("click", () => {
//   chrome.tabs.create({
//     url: "https://whereismyjob.onrender.com/auth/google"
//   });
// });


function showLoggedIn(name) {
  loginBtn.style.display = "none";
  logoutBtn.style.display = "block";
  saveJD.style.display = 'block'
viewJobs.style.display = 'block'
  statusEl.textContent = `Logged in as ${name}`;
}

function showLoggedOut() {
  loginBtn.style.display = "block";
  logoutBtn.style.display = "none";
  saveJD.style.display = 'none'
viewJobs.style.display = 'none'
  statusEl.textContent = "";
}

function showSavingState() {
  saveJD.textContent = "Saving...";
  saveJD.classList.add("loading");
  saveJD.disabled = true;
}

function showSavedState() {
  saveJD.textContent = "Saved!";
  saveJD.classList.remove("loading");
  saveJD.classList.add("success");
  saveJD.disabled = true; 

  setTimeout(() => {
    resetSaveButton();
  }, 2500);
}

function resetSaveButton() {
  saveJD.textContent = "Save this Job"
  saveJD.style.background = '#0A66C2'
  saveJD.classList.remove("success");
  saveJD.disabled = false; 
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "JOB_SAVE_SUCCESS") {
    saveJD.style.background = '#38ab6cff'
    saveJD.textContent = "Saved"
    clearWakingUpMessage();
    showSavedState();
  }

  if (message.type === "JOB_SAVE_FAILED") {
    clearWakingUpMessage();
    resetSaveButton();
    saveJD.textContent = "Failed. Try again";
    statusEl.textContent = "Something went wrong.";
  }
});


// chrome.runtime.onMessage.addListener((msg) => {
//   if (msg.type === "LINKEDIN_SELECTED_CV_DOWNLOADED") {
//      console.log('pdf download detected')
//     const status = document.getElementById("status");
//     status.textContent = `Selected CV downloaded: ${msg.payload.fileName}`;
//   }
// });
