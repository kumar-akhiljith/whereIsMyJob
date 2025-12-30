chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const { authToken } = await chrome.storage.local.get("authToken");
    if (!authToken) return;

    let response;

    if (message.type === "LINKEDIN_JOB_EXTRACTED") {
 
      response = await fetch(
        // "https://whereismyjob.onrender.com/api/jobs/manual",
        "https://whereismyjob.onrender.com/api/linkedin/save",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify(message.payload)
        }
      );
    }

    if (message.type === "JD_EXTRACTED") {

      response = await fetch(
        "https://whereismyjob.onrender.com/api/extract",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify(message.payload)
        }
      );
    }

    if (!response || !response.ok) {
      console.log('response: ', response)
      throw new Error("Save failed");
    }

    chrome.runtime.sendMessage({ type: "JOB_SAVE_SUCCESS" });
  })().catch(err => {
    console.log("BG save failed", err);
    chrome.runtime.sendMessage({ type: "JOB_SAVE_FAILED" });
  });

});
