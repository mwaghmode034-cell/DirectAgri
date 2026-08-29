"use client";

import { useEffect, useState } from "react";
import { ArrowRight, KeyRound, Leaf, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requestPasswordReset, resetPassword } from "@/lib/auth-client";
import { applyLocale, authTranslations, getLocale, languageOptions, setLocale } from "@/lib/i18n";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [locale, setCurrentLocale] = useState("en");
    const [isHydrated, setIsHydrated] = useState(false);
    const [step, setStep] = useState("request");
    const [form, setForm] = useState({ identifier: "", code: "", password: "", confirmPassword: "" });
    const [resetCode, setResetCode] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const t = authTranslations[locale] ?? authTranslations.en;

    useEffect(() => {
        const savedLocale = getLocale();
        setCurrentLocale(savedLocale);
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (isHydrated) {
            applyLocale(locale);
            setLocale(locale);
        }
    }, [locale, isHydrated]);

    function changeLocale(nextLocale) {
        setCurrentLocale(nextLocale);
        setLocale(nextLocale);
        applyLocale(nextLocale);
    }

    function updateField(event) {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    }

    async function submitRequest(event) {
        event.preventDefault();
        setError("");
        setMessage("");
        setIsSubmitting(true);
        try {
            const result = await requestPasswordReset(form.identifier);
            setResetCode(result.resetCode ?? "");
            setMessage(result.message);
            setStep("reset");
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function submitReset(event) {
        event.preventDefault();
        setError("");
        setMessage("");
        if (form.password !== form.confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await resetPassword({
                email: form.identifier,
                code: form.code,
                password: form.password
            });
            setMessage(result.message);
            setTimeout(() => router.push("/login"), 1200);
        } catch (submitError) {
            setError(submitError.message);
            setIsSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen px-5 py-6 sm:px-8">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                <Link href="/" className="flex items-center gap-3 font-semibold">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--leaf)] text-white"><Leaf size={20} /></span>
                    <span>DirectAgri<small className="block text-xs font-normal text-[var(--muted)]">SIH26033</small></span>
                </Link>
                <div className="flex items-center gap-3"><select className="rounded-md border border-[var(--line)] bg-white px-2 py-2 text-sm" value={locale} onChange={(event) => changeLocale(event.target.value)} aria-label="Language">{languageOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select><Link href="/login" className="text-sm font-semibold text-[var(--leaf-dark)]">{t.submitLogin}</Link></div>
            </div>

            <section className="mx-auto grid max-w-6xl gap-10 py-14 lg:grid-cols-[1fr_26rem] lg:items-center lg:py-24">
                <div className="hidden lg:block">
                    <p className="eyebrow">{t.access}</p>
                    <h1 className="mt-5 max-w-xl text-6xl font-bold leading-[0.98]">{t.recoveryTitle}</h1>
                    <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--muted)]">{t.recoveryText}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-soft sm:p-8">
                    <div className="mb-8">
                        <p className="eyebrow">{t.access}</p>
                        <h1 className="mt-2 text-3xl font-bold">{t.recoveryTitle}</h1>
                        <p className="mt-2 text-sm text-[var(--muted)]">{t.recoveryText}</p>
                    </div>
                    {step === "request" ? (
                        <form className="space-y-4" onSubmit={submitRequest}>
                            <label className="block text-sm font-semibold">{t.email}<span className="focus-within:ring-2 mt-2 flex min-h-12 items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 focus-within:ring-[var(--leaf)]"><Mail size={17} className="text-[var(--leaf)]" /><input className="w-full bg-transparent outline-none" name="identifier" type="email" value={form.identifier} onChange={updateField} placeholder="you@example.com" required /></span></label>
                            {error && <p className="rounded-lg bg-[#fbe9e3] px-3 py-2 text-sm font-semibold text-[var(--rust)]" role="alert">{error}</p>}
                            <button className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--leaf)] px-4 font-semibold text-white disabled:opacity-60" disabled={isSubmitting}>{isSubmitting ? t.sending : t.sendCode}<ArrowRight size={18} /></button>
                        </form>
                    ) : (
                        <form className="space-y-4" onSubmit={submitReset}>
                            {resetCode && (
                                <p className="rounded-lg bg-[var(--sky)] px-3 py-2 text-sm font-semibold text-[var(--leaf-dark)]">
                                    Demo reset code for {form.identifier}: <span className="tracking-widest">{resetCode}</span>
                                </p>
                            )}
                            <label className="block text-sm font-semibold">{t.resetCode}<span className="focus-within:ring-2 mt-2 flex min-h-12 items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 focus-within:ring-[var(--leaf)]"><KeyRound size={17} className="text-[var(--leaf)]" /><input className="w-full bg-transparent outline-none" name="code" value={form.code} onChange={updateField} placeholder="6-digit code" minLength={6} required /></span></label>
                            <label className="block text-sm font-semibold">{t.newPassword}<span className="focus-within:ring-2 mt-2 flex min-h-12 items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 focus-within:ring-[var(--leaf)]"><LockKeyhole size={17} className="text-[var(--leaf)]" /><input className="w-full bg-transparent outline-none" name="password" type="password" value={form.password} onChange={updateField} placeholder="At least 6 characters" minLength={6} required /></span></label>
                            <label className="block text-sm font-semibold">{t.confirmPassword}<span className="focus-within:ring-2 mt-2 flex min-h-12 items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 focus-within:ring-[var(--leaf)]"><LockKeyhole size={17} className="text-[var(--leaf)]" /><input className="w-full bg-transparent outline-none" name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} placeholder={t.repeatPassword} minLength={6} required /></span></label>
                            {error && <p className="rounded-lg bg-[#fbe9e3] px-3 py-2 text-sm font-semibold text-[var(--rust)]" role="alert">{error}</p>}
                            {message && <p className="rounded-lg bg-[var(--sky)] px-3 py-2 text-sm font-semibold text-[var(--leaf-dark)]">{message}</p>}
                            <button className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--leaf)] px-4 font-semibold text-white disabled:opacity-60" disabled={isSubmitting}>{isSubmitting ? t.updating : t.updatePassword}<ArrowRight size={18} /></button>
                        </form>
                    )}
                    <p className="mt-6 text-sm text-[var(--muted)]">{t.newHere} <Link href="/signup" className="font-semibold text-[var(--leaf-dark)]">{t.createAccount}</Link></p>
                </div>
            </section>
        </main>
    );
}
