// Talks to the backend. In development Vite forwards /api to http://localhost:5000 (see vite.config.js).
const API = import.meta.env?.VITE_API_URL || "/api";
const TOKEN_KEY = "token";
const USER_KEY = "luggage-room-user";

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
  if (res.status === 401 && token && !path.startsWith("/auth/login")) {
    clearSession(); // token expired (they last 8 hours) -> back to the login page
    window.location.assign("/");
    throw new Error("Your session has expired. Please log in again.");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

// One drop-off = one QR for all items. Items that already exist keep their `id`;
// a photo is only sent for new items or when the student picked a new one.
export function buildDropOffForm(items) {
  const form = new FormData();
  form.append(
    "items",
    JSON.stringify(
      items.map((it) => ({
        id: it.id || undefined,
        name: it.itemName,
        categoryId: it.categoryId,
        quantity: 1,
        description: it.description,
      }))
    )
  );
  items.forEach((it, i) => {
    if (it.photo) form.append(`photo_${i}`, it.photo);
  });
  return form;
}
