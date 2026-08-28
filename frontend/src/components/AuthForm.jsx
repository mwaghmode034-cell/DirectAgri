"use client";

import { useState } from "react";
import { ArrowRight, Leaf, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";

const demoAccounts = [
    ["Farmer", "farmer@directagri.dev"],
    ["Buyer", "buyer@directagri.dev"],
    ["Transporter", "transporter@directagri.dev"],
    ["Storage", "storage@directagri.dev"],
    ["Government", "government@directagri.dev"]
];

export default function AuthForm({ mode = "login" }) {
    const isSignUp = mode === "signup";
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "farmer" });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    function updateField(event) {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    }

    async function submit(event) {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            const session = isSignUp ? await signUp(form) : await signIn(form.email, form.password);
            router.push(`/dashboard/${session.user.role}`);
        } catch (submitError) {
            setError(submitError.message);
            setIsSubmitting(false);
        }
    }

    function fillDemo(email) {
        setForm((current) => ({ ...current, email, password: "demo1234" }));
        setError("");
    }

    return (
        <main className="min-h-screen px-5 py-6 sm:px-8">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
                <Link href="/" className="flex items-center gap-3 font-semibold">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--leaf)] text-white"><Leaf size={20} /></span>
                    <span>DirectAgri<small className="block text-xs font-normal text-[var(--muted)]">SIH26033</small></span>
                </Link>
                <Link href={isSignUp ? "/login" : "/signup"} className="text-sm font-semibold text-[var(--leaf-dark)]">{isSignUp ? "Already have an account? Log in" : "New here? Sign up"}</Link>
            </div>

            <section className="mx-auto grid max-w-6xl gap-10 py-14 lg:grid-cols-[1fr_26rem] lg:items-center lg:py-24">
                <div className="hidden lg:block">
                    <p className="eyebrow">A fairer route to market</p>
                    <h1 className="mt-5 max-w-xl text-6xl font-bold leading-[0.98]">Keep more of what you grow.</h1>
                    <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--muted)]">One calm workspace for crop listings, buyers, transport, storage and transparent settlement.</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-soft sm:p-8">
                    <div className="mb-8">
                        <p className="eyebrow">DirectAgri access</p>
                        <h1 className="mt-2 text-3xl font-bold">{isSignUp ? "Create your account" : "Welcome back"}</h1>
                        <p className="mt-2 text-sm text-[var(--muted)]">{isSignUp ? "Choose the role that matches your place in the ecosystem." : "Sign in with your DirectAgri account."}</p>
                    </div>
                    <form className="space-y-4" onSubmit={submit}>
                        {isSignUp && <Field icon={UserRound} label="Full name" name="name" value={form.name} onChange={updateField} placeholder="Asha Pawar" />}
                        <Field icon={Mail} label="Email" name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" />
                        <Field icon={LockKeyhole} label="Password" name="password" type="password" value={form.password} onChange={updateField} placeholder="At least 6 characters" minLength={6} />
                        <div className="flex justify-end">
                            <Link href="/forgot-password" className="text-sm font-semibold text-[var(--leaf-dark)]">Forgot password?</Link>
                        </div>
                        {isSignUp && <label className="block text-sm font-semibold">Your role<select name="role" value={form.role} onChange={updateField} className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-[var(--line)] bg-white px-3"><option value="farmer">Farmer</option><option value="buyer">Buyer</option><option value="transporter">Transporter</option><option value="storage">Storage partner</option><option value="government">Government</option></select></label>}
                        {error && <p className="rounded-lg bg-[#fbe9e3] px-3 py-2 text-sm font-semibold text-[var(--rust)]" role="alert">{error}</p>}
                        <button className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--leaf)] px-4 font-semibold text-white disabled:opacity-60" disabled={isSubmitting}>{isSubmitting ? "Opening workspace..." : isSignUp ? "Create account" : "Log in"}<ArrowRight size={18} /></button>
                    </form>
                    {!isSignUp && (
                        <div className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Demo login · password demo1234</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {demoAccounts.map(([label, email]) => (
                                    <button key={email} type="button" className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs font-semibold" onClick={() => fillDemo(email)}>{label}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

function Field({ icon: Icon, label, ...props }) {
    return <label className="block text-sm font-semibold">{label}<span className="focus-within:ring-2 mt-2 flex min-h-12 items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 focus-within:ring-[var(--leaf)]"><Icon size={17} className="text-[var(--leaf)]" /><input className="w-full bg-transparent outline-none" {...props} required /></span></label>;
}
