const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiGet(path) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: requestHeaders()
  });
  return readJson(response);
}

export async function apiPost(path, body, role = "farmer") {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { ...requestHeaders(), "x-demo-role": role },
    body: JSON.stringify(body)
  });
  return readJson(response);
}

function requestHeaders() {
  const headers = { "content-type": "application/json" };
  if (typeof window !== "undefined") {
    const session = window.localStorage.getItem("directagri-session");
    const token = session ? JSON.parse(session).token : null;
    if (token) headers.authorization = `Bearer ${token}`;
  }
  return headers;
}

async function readJson(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "API request failed");
  }
  return data;
}
