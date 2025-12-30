chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "EXTRACT_JOB") return;

  const resumeId = msg.resumeId || null;
  const isLinkedIn = location.hostname.includes("linkedin.com");

  if (isLinkedIn) {
    extractLinkedInJob(resumeId);
  } else {
    alert(
    "Saving jobs from non-LinkedIn websites is still under development.\n\nPlease use it in LinkedIn jobs for now."
    );
    // extractGenericJob(resumeId);
  }
});

function extractLinkedInJob(resumeId) {

  const jobTitleEl = document.querySelector(
    ".job-details-jobs-unified-top-card__job-title h1"
  );

  const companyLinkEl = document.querySelector(
    ".job-details-jobs-unified-top-card__company-name a"
  );

  const jdEl = document.getElementById("job-details");

  const jobTitle = jobTitleEl?.innerText?.trim();
  const companyName = companyLinkEl?.innerText?.trim();
  const companyLinkedinUrl = companyLinkEl?.href;
  const jobDescription = jdEl?.innerText?.trim();
  const jobLocation = extractLinkedInLocation();

  if (!jobTitle || !companyName || !jobDescription) {

    const observer = new MutationObserver(() => {
      const ready = extractLinkedInJob();
      if (ready) observer.disconnect();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return false;
  }

  chrome.runtime.sendMessage({
    type: "LINKEDIN_JOB_EXTRACTED",
    payload: {
      companyName,
      jobTitle,
      companyLinkedinUrl,
      jobDescription,
      jobLocation,
      resumeId,
      sourceUrl: location.href
    }
  });

  return true;
}

function extractLinkedInLocation(resumeId) {
  const container = document.querySelector(
    ".job-details-jobs-unified-top-card__tertiary-description-container"
  );

  if (!container) return null;

  const spans = container.querySelectorAll(".tvm__text--low-emphasis");
  if (!spans.length) return null;

  return spans[0].innerText.trim();
}

// other sites 
function extractGenericJob(resumeId) {

  chrome.runtime.sendMessage({
    type: "JD_EXTRACTED",
    payload: {
      pageText: document.body.innerText,
      resumeId,
      sourceUrl: location.href
    }
  });
}


// download cv code
// (function () {
//   console.log("working...");
//   if (!location.hostname.includes("linkedin.com")) return;

//   console.log(" LinkedIn CV watcher started");

//     const selectedCard = document.querySelector(".jobs-document-upload-redesign-card__container--selected");
//     if (!selectedCard) {
//       // Not found yet, keep waiting
//       return;
//     }

//     console.log(" Selected card found");

//     const fileNameEl = selectedCard.querySelector(".jobs-document-upload-redesign-card__file-name");
//     const fileName = fileNameEl?.innerText?.trim() || "Unknown.pdf";

//     const downloadBtn = selectedCard.querySelector('button[aria-label^="Download resume"]');
//     if (!downloadBtn) {
//       console.log("Download button not found");
//       return;
//     }

//     console.log("File name:", fileName);
//     console.log("Clicking download button");

//     downloadBtn.click();

//     chrome.runtime.sendMessage({
//       type: "LINKEDIN_SELECTED_CV_DOWNLOADED",
//       payload: { fileName }
//     });

// })();

