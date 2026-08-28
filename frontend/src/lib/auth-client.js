import { apiPost } from "@/lib/api-client";

const sessionKey = "directagri-session";

export async function signIn(email, password) {
    return saveAuth(await apiPost("/api/auth/login", { email, password }));
}

export async function signUp({ name, email, password, role }) {
    return saveAuth(await apiPost("/api/auth/signup", { name, email, password, role }));
}

export async function requestPasswordReset(email) {
    return apiPost("/api/auth/forgot-password", { email });
}

export async function resetPassword({ email, code, password }) {
    return apiPost("/api/auth/reset-password", { email, code, password });
}

export function getSession() {
    if (typeof window === "undefined") return null;
    const storedSession = window.localStorage.getItem(sessionKey);
    if (!storedSession) return null;
    try {
        return JSON.parse(storedSession);
    } catch {
        window.localStorage.removeItem(sessionKey);
        return null;
    }
}

export function signOut() {
    if (typeof window !== "undefined") window.localStorage.removeItem(sessionKey);
}

function saveAuth({ token, user }) {
    const session = { token, user };
    window.localStorage.setItem(sessionKey, JSON.stringify(session));
    return session;
}
