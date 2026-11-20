export async function api(path, { method = "GET", body, signal } = {}) {
  const headers = {};
  if (method !== "GET") {
    const csrf = document.cookie.split("; ").find((cookie) => cookie.startsWith("csrftoken="));
    if (csrf) headers["X-CSRFToken"] = decodeURIComponent(csrf.slice("csrftoken=".length));
  }
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const response = await fetch(`/api/${path}`, { method, body, headers, signal });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if ((response.status === 401 && path !== "session/login/") ||
        data?.detail === "Authentication credentials were not provided.") {
      window.dispatchEvent(new Event("session-expired"));
    }
    const message = data?.error || data?.detail || formatErrors(data);
    throw new Error(message || `Request failed (${response.status}).`);
  }
  if (!data) throw new Error("Django returned an unexpected response.");
  return data;
}

function formatErrors(data) {
  if (Array.isArray(data)) return data.join(" ");
  return Object.entries(data || {}).map(([field, errors]) => {
    const message = Array.isArray(errors) ? errors.join(" ") : String(errors);
    return field === "non_field_errors" ? message : `${field.replaceAll("_", " ")} — ${message}`;
  }).join(" ");
}

export function todayInManila() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts();
  const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${date.year}-${date.month}-${date.day}`;
}

export function pesos(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);
}
