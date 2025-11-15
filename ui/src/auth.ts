export function getToken() {
  return localStorage.getItem("auth_token") || "";
}
export function setToken(t: string) {
  localStorage.setItem("auth_token", t);
}
export function clearToken() {
  localStorage.removeItem("auth_token");
}
export function getUser() {
  const t = getToken();
  if (!t) return null;
  const parts = t.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}
export function isAuthed() {
  return !!getUser();
}
export function isAdmin() {
  const u = getUser();
  return !!u && u.role === "admin";
}