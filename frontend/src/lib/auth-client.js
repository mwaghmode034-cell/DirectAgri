import { apiPost } from "@/lib/api-client";

const sessionKey = "directagri-session";

export async function signIn(identifier, password) {
    const payload = identifier.includes("@") ? { email: identifier, password } : { phone: identifier, password };
    return saveAuth(await apiPost("/api/auth/login", payload));
}

export async function signUp({ name, email, phone, password, role }) {
    return saveAuth(await apiPost("/api/auth/signup", { name, email, phone, password, role }));
}

export async function requestPasswordReset(identifier) {
    const normalized = String(identifier ?? "").trim();
    if (!normalized) {
        throw new Error("Email is required.");
    }
    return apiPost("/api/auth/forgot-password", { email: normalized });
}

export async function resetPassword({ email, phone, code, password }) {
    const payload = { code, password };
    if (email) payload.email = email;
    if (phone) payload.phone = phone;
    return apiPost("/api/auth/reset-password", payload);
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
