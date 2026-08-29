"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Leaf, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn, signUp } from "@/lib/auth-client";
import { applyLocale, authTranslations, getLocale, languageOptions, setLocale } from "@/lib/i18n";

export default function AuthForm({ mode = "login" }) {
    const isSignUp = mode === "signup";
    const router = useRouter();
    const [locale, setCurrentLocale] = useState("en");
    const [isHydrated, setIsHydrated] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "farmer" });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const t = authTranslations[locale] ?? authTranslations.en;

    useEffect(() => {
        const savedLocale = getLocale();
        setCurrentLocale(savedLocale);
        setIsHydrated(true);
        const session = getSession();
        if (session) router.replace(`/dashboard/${session.user.role}`);
    }, [router]);

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

    return (
        <main className="min-h-screen px-5 py-6 sm:px-8">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                <Link href="/" className="flex items-center gap-3 font-semibold">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--leaf)] text-white"><Leaf size={20} /></span>
                    <span>DirectAgri<small className="block text-xs font-normal text-[var(--muted)]">SIH26033</small></span>
                </Link>
                <div className="flex items-center gap-3"><select className="rounded-md border border-[var(--line)] bg-white px-2 py-2 text-sm" value={locale} onChange={(event) => changeLocale(event.target.value)} aria-label="Language">{languageOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select><Link href={isSignUp ? "/login" : "/signup"} className="text-sm font-semibold text-[var(--leaf-dark)]">{isSignUp ? t.already : t.newHere}</Link></div>
            </div>

            <section className="mx-auto grid max-w-6xl gap-10 py-14 lg:grid-cols-[1fr_26rem] lg:items-center lg:py-24">
                <div className="hidden lg:block">
                    <p className="eyebrow">{t.eyebrow}</p>
                    <h1 className="mt-5 max-w-xl text-6xl font-bold leading-[0.98]">{t.heroTitle}</h1>
                    <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--muted)]">{t.heroText}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-soft sm:p-8">
                    <div className="mb-8">
                        <p className="eyebrow">{t.access}</p>
                        <h1 className="mt-2 text-3xl font-bold">{isSignUp ? t.create : t.welcome}</h1>
                        <p className="mt-2 text-sm text-[var(--muted)]">{isSignUp ? t.chooseRole : t.signInText}</p>
                    </div>
                    <form className="space-y-4" onSubmit={submit}>
                        {isSignUp && <Field icon={UserRound} label={t.name} name="name" value={form.name} onChange={updateField} placeholder="Asha Pawar" />}
                        {isSignUp && <Field icon={Phone} label="Mobile number" name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="+91 98765 43210" />}
                        <Field icon={Mail} label={t.email} name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" />
                        <Field icon={LockKeyhole} label={t.password} name="password" type="password" value={form.password} onChange={updateField} placeholder="At least 6 characters" minLength={6} />
                        <div className="flex justify-end">
                            <Link href="/forgot-password" className="text-sm font-semibold text-[var(--leaf-dark)]">{t.forgot}</Link>
                        </div>
                        {isSignUp && <label className="block text-sm font-semibold">{t.role}<select name="role" value={form.role} onChange={updateField} className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-[var(--line)] bg-white px-3"><option value="farmer">Farmer</option><option value="buyer">Buyer</option><option value="transporter">Transporter</option><option value="storage">{t.storage}</option><option value="government">Government</option></select></label>}
                        {error && <p className="rounded-lg bg-[#fbe9e3] px-3 py-2 text-sm font-semibold text-[var(--rust)]" role="alert">{error}</p>}
                        <button className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--leaf)] px-4 font-semibold text-white disabled:opacity-60" disabled={isSubmitting}>{isSubmitting ? t.opening : isSignUp ? t.submitCreate : t.submitLogin}<ArrowRight size={18} /></button>
                    </form>
                </div>
            </section>
        </main>
    );
}

function Field({ icon: Icon, label, ...props }) {
    return <label className="block text-sm font-semibold">{label}<span className="focus-within:ring-2 mt-2 flex min-h-12 items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 focus-within:ring-[var(--leaf)]"><Icon size={17} className="text-[var(--leaf)]" /><input className="w-full bg-transparent outline-none" {...props} required /></span></label>;
}
