"use client";

import { useState } from "react";
import { ArrowRight, ChartNoAxesCombined, Languages, Leaf, MapPinned, ShieldCheck, Warehouse } from "lucide-react";
import Link from "next/link";

const copy = {
  en: { login: "Log in", enter: "Enter the platform", eyebrow: "Farm to buyer. No middlemen.", title: "Farmers keep the value they grow.", subhead: "A four-node digital ecosystem connecting farmers, buyers, transporters and storage partners with escrow settlement, demand forecasting and route optimisation.", role: "Choose your role", ecosystem: "The 4-node ecosystem", access: "Role-based access keeps pricing, quality records and settlement responsibilities in the right hands.", roles: [["Farmer", "Owns crop digitally until final sale."], ["Buyer", "Bulk procurement and hyper-local sourcing."], ["Transporter", "Accepts efficient, nearby delivery work."], ["Storage partner", "Records quality and custody with confidence."]], stats: ["farmer share today", "intermediaries removed", "digital ownership retained"] },
  hi: { login: "लॉग इन", enter: "प्लेटफ़ॉर्म खोलें", eyebrow: "खेत से खरीदार तक। बिना बिचौलियों के।", title: "किसान अपनी उपज का मूल्य रखते हैं।", subhead: "एस्क्रो भुगतान, मांग पूर्वानुमान और मार्ग अनुकूलन के साथ किसानों, खरीदारों, परिवहन और भंडारण को जोड़ने वाला डिजिटल तंत्र।", role: "अपनी भूमिका चुनें", ecosystem: "चार-नोड तंत्र", access: "भूमिका-आधारित पहुंच कीमत, गुणवत्ता और भुगतान की जिम्मेदारियां सही हाथों में रखती है।", roles: [["किसान", "अंतिम बिक्री तक फसल का डिजिटल स्वामी।"], ["खरीदार", "थोक खरीद और स्थानीय स्रोत।"], ["परिवहन", "पास के डिलीवरी कार्य स्वीकार करें।"], ["भंडारण भागीदार", "गुणवत्ता और रखवाली दर्ज करें।"]], stats: ["किसान का हिस्सा", "बिचौलिए हटे", "डिजिटल स्वामित्व"] },
  mr: { login: "लॉग इन", enter: "प्लॅटफॉर्म उघडा", eyebrow: "शेतातून खरेदीदारापर्यंत. मध्यस्थांशिवाय.", title: "शेतकरी पिकाची कमाई स्वतःकडे ठेवतात.", subhead: "एस्क्रो पेमेंट, मागणीचा अंदाज आणि मार्ग नियोजनासह शेतकरी, खरेदीदार, वाहतूक आणि साठवण जोडणारे डिजिटल तंत्र.", role: "आपली भूमिका निवडा", ecosystem: "चार-नोड तंत्र", access: "भूमिकेनुसार प्रवेश किंमत, गुणवत्ता आणि पेमेंटची जबाबदारी योग्य हातात ठेवतो.", roles: [["शेतकरी", "अंतिम विक्रीपर्यंत पिकाचा डिजिटल मालक."], ["खरेदीदार", "मोठ्या प्रमाणात आणि स्थानिक खरेदी."], ["वाहतूकदार", "जवळची डिलिव्हरी कामे स्वीकारा."], ["साठवण भागीदार", "गुणवत्ता आणि ताबा नोंदवा."]], stats: ["शेतकऱ्याचा वाटा", "मध्यस्थ कमी", "डिजिटल मालकी"] }
};

for (const locale of ["bn", "te", "ta", "gu", "ur", "kn"]) copy[locale] = copy.en;

export default function Home() {
  const [locale, setLocale] = useState("en");
  const t = copy[locale];
  const roles = [
    [t.roles[0][0], t.roles[0][1], Leaf], [t.roles[1][0], t.roles[1][1], ChartNoAxesCombined], [t.roles[2][0], t.roles[2][1], MapPinned], [t.roles[3][0], t.roles[3][1], Warehouse]
  ];

  return (
    <main className="min-h-screen px-5 py-5 sm:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold"><span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--leaf)] text-white"><Leaf size={20} /></span><span>DirectAgri<small className="block text-xs font-normal text-[var(--muted)]">SIH26033</small></span></Link>
        <div className="flex items-center gap-3"><label className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"><Languages size={16} className="text-[var(--leaf)]" /><select value={locale} onChange={(event) => setLocale(event.target.value)} className="bg-transparent font-semibold" aria-label="Language"><option value="en">English</option><option value="hi">हिन्दी</option><option value="bn">বাংলা</option><option value="mr">मराठी</option><option value="te">తెలుగు</option><option value="ta">தமிழ்</option><option value="gu">ગુજરાતી</option><option value="ur">اردو</option><option value="kn">ಕನ್ನಡ</option></select></label><Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold sm:block">{t.login}</Link><Link href="/signup" className="rounded-lg bg-[var(--leaf-dark)] px-4 py-2.5 text-sm font-semibold text-white">{t.enter}</Link></div>
      </nav>

      <section className="mx-auto max-w-7xl pb-14 pt-16 lg:pb-20 lg:pt-24">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-[0.98] sm:text-7xl">{t.title}</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">{t.subhead}</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className="inline-flex items-center gap-3 rounded-lg bg-[var(--leaf)] px-5 py-3.5 font-semibold text-white">{t.enter} <ArrowRight size={18} /></Link><Link href="/login" className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-5 py-3.5 font-semibold shadow-soft">{t.role}</Link></div>
        <div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-3"><Stat value="25–35%" label={t.stats[0]} /><Stat value="4–6" label={t.stats[1]} /><Stat value="100%" label={t.stats[2]} /></div>
      </section>

      <section className="mx-auto max-w-7xl rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-soft sm:p-8"><p className="eyebrow">{t.ecosystem}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{roles.map(([title, description, Icon]) => <div key={title} className="flex items-center gap-4 rounded-xl border border-[var(--line)] bg-white p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e7f0e5] text-[var(--leaf)]"><Icon size={21} /></span><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{description}</p></div></div>)}</div><div className="mt-6 flex items-start gap-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]"><ShieldCheck className="mt-0.5 shrink-0 text-[var(--leaf)]" size={18} /><p>{t.access}</p></div></section>
    </main>
  );
}

function Stat({ value, label }) {
  return <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-soft"><p className="text-2xl font-bold text-[var(--leaf)]">{value}</p><p className="mt-1 text-xs text-[var(--muted)]">{label}</p></div>;
}
