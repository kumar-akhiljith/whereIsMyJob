const params = new URLSearchParams(window.location.search);
const token = params.get("token");

function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64));
}

if (token) {
  const user = parseJwt(token);

  chrome.storage.local.set(
    {
      authToken: token,
      userName: user.name,
      userEmail: user.email
    },
    // () => {
    //   console.log("User logged in:", user.name);
    // }
  );
}
