// Talks to the backend. In development Vite forwards /api to http://localhost:5000 (see vite.config.js).
const API = import.meta.env?.VITE_API_URL || "/api";
const TOKEN_KEY = "token";
const USER_KEY = "luggage-room-user";

// This site holds the one login/register page for everyone. Operators and admins are sent on to the
// staff site, already logged in (the token travels after # so it is never sent to a server).
// Same computer/address as this page, port 5174 - so it also works from a phone on the same Wi-Fi (http://192.168.x.x:5173)
export const STAFF_URL = import.meta.env?.VITE_STAFF_URL || `${window.location.protocol}//${window.location.hostname}:5174`;
export function sendStaffToStaffSite(token, user) {
  if (user.role === "Student") return false;
  window.location.assign(`${STAFF_URL}/#sso=${encodeURIComponent(token)}`);
  return true;
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// api("/categories")  |  api("/auth/login", { method: "POST", body: {...} })  |  api("/drop-offs", { method: "POST", form })
export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: form ?? (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new Error("Cannot reach the server. Check that the backend is running.");
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token && !path.startsWith("/auth/login") && !path.startsWith("/auth/register")) {
    clearSession(); // token expired (they last 8 hours) -> back to the login page
    window.location.assign("/");
    throw new Error("Your session has expired. Please log in again.");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

// One drop-off = one QR for all items. Items that already exist keep their `id`.
// Each item has up to 4 photos: it.photos = [{ id?, file?, preview }].
//  - new photos are sent as files, all with the same field name (photo_0 for item 1, photo_1 for item 2 ...)
//  - when editing, `photoIds` lists the saved photos to keep (in order); new files are added after them
export function buildDropOffForm(items) {
  const form = new FormData();
  form.append(
    "items",
    JSON.stringify(
      items.map((it) => {
        const saved = it.photos.filter((p) => !p.file);
        const canList = saved.every((p) => p.id); // very old photos may have no id: then leave them as they are
        return {
          id: it.id || undefined,
          name: it.itemName,
          categoryId: it.categoryId,
          quantity: 1,
          description: it.description,
          photoIds: it.id && canList ? saved.map((p) => p.id) : undefined,
        };
      })
    )
  );
  items.forEach((it, i) => {
    for (const p of it.photos) if (p.file) form.append(`photo_${i}`, p.file);
  });
  return form;
}
