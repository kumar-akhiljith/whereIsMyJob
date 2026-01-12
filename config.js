const ENV = "prod"; // change to "prod" when on prodcution

export const API_BASE_URL =
  ENV === "local"
    ? "http://localhost:5000"
    : "https://whereismyjob.onrender.com";
