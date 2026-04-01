function getToken() {
  return window.localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const base = window.API_BASE_URL || "/api";
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = Object.assign(
    { "Content-Type": "application/json" },
    options.headers || {},
    authHeaders(options.requireAuth)
  );

  const res = await fetch(url, { ...options, headers });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = payload?.error?.message || payload?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

