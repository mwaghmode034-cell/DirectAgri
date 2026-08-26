"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DirectAgriDashboard from "@/components/DirectAgriDashboard";
import { getSession } from "@/lib/auth-client";

export default function DashboardPage() {
    const router = useRouter();
    const [session, setSession] = useState(null);

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession) router.replace("/login");
        else setSession(currentSession.user);
    }, [router]);

    if (!session) return <main className="grid min-h-screen place-items-center text-[var(--muted)]">Opening your workspace...</main>;
    return <DirectAgriDashboard initialRole={session.role} />;
}
