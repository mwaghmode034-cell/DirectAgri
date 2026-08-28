const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiGet(path) {
  return send("GET", path);
}

export async function apiPost(path, body, role = "farmer") {
  return send("POST", path, body, role);
}

async function send(method, path, body, role) {
  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        ...requestHeaders(),
        ...(role ? { "x-demo-role": role } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new Error("Cannot reach the DirectAgri API. Start it with npm --workspace backend run dev.");
  }
  return readJson(response);
}

function requestHeaders() {
  const headers = { "content-type": "application/json" };
  if (typeof window !== "undefined") {
    try {
      const session = window.localStorage.getItem("directagri-session");
      const token = session ? JSON.parse(session).token : null;
      if (token) headers.authorization = `Bearer ${token}`;
    } catch {
      window.localStorage.removeItem("directagri-session");
    }
  }
  return headers;
}

async function readJson(response) {
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(response.ok ? "The server returned an invalid response." : "API request failed.");
    }
  }
  if (!response.ok) {
    throw new Error(data.error ?? "API request failed");
  }
  return data;
}
