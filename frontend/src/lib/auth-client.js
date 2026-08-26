import { apiPost } from "@/lib/api-client";

const sessionKey = "directagri-session";

export async function signIn(email, password) {
    return saveAuth(await apiPost("/api/auth/login", { email, password }));
}

export async function signUp({ name, email, password, role }) {
    return saveAuth(await apiPost("/api/auth/signup", { name, email, password, role }));
}

export function getSession() {
    if (typeof window === "undefined") return null;
    const storedSession = window.localStorage.getItem(sessionKey);
    return storedSession ? JSON.parse(storedSession) : null;
}

export function signOut() {
    if (typeof window !== "undefined") window.localStorage.removeItem(sessionKey);
}

function saveAuth({ token, user }) {
    const session = { token, user };
    window.localStorage.setItem(sessionKey, JSON.stringify(session));
    return session;
}
