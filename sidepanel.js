import { API_BASE_URL } from "./config.js";

async function generateEmail() {
  const { authToken } = await chrome.storage.local.get("authToken");
  const statusEl = document.getElementById('status');
  const resultArea = document.getElementById('result');
  const emailOutput = document.getElementById('emailOutput');

  if (!authToken) {
    document.getElementById('status').innerText = "Please log in first.";
    return;
  }
  
  // data saved by content.js
  const { pendingEmailData } = await chrome.storage.local.get('pendingEmailData');

  if (!pendingEmailData) {
    statusEl.innerText = "No job data found. Please try again from the popup.";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/email/generate-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
    },
      body: JSON.stringify(pendingEmailData)
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById('loader').classList.add('hidden');
      resultArea.classList.remove('hidden');
      emailOutput.value = data.email;
    } else {
      statusEl.innerText = data.error || "Generation failed.";
      document.getElementById('loader').classList.add('hidden');
    }
  } catch (err) {
    statusEl.innerText = "Error: Could not generate email.";
    console.error(err);
  }

}


document.addEventListener('DOMContentLoaded', async () => { 
    
    copyBtn.addEventListener('click', async () => {
     try {
        await navigator.clipboard.writeText(emailOutput.value);
        const originalText = copyBtn.innerText;
        copyBtn.innerText = "Copied!";
        copyBtn.style.background = "#28a745";
        
        setTimeout(() => {
            copyBtn.innerText = originalText;
            copyBtn.style.background = "";
        }, 2000);
        } catch (err) {
         console.error('Failed to copy: ', err);
        }
    });

    gmailBtn.addEventListener('click', () => {
        const subject = encodeURIComponent("Job Application");
        const body = encodeURIComponent(emailOutput.value);
        // Standard Gmail compose URL
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
        
        // In extensions, use chrome.tabs to ensure it opens correctly
        chrome.tabs.create({ url: gmailUrl });
    });
       
    generateEmail()

});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "START_GENERATION") {
    resetUI();
    generateEmail(); 
  }
});


function resetUI() {
  document.getElementById('loader').classList.remove('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('status').innerText = "";
  document.getElementById('emailOutput').value = "";
}
