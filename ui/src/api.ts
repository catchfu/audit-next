export function getBaseUrl() {
  const v = localStorage.getItem("api_base_url");
  return v || "http://localhost:3000";
}