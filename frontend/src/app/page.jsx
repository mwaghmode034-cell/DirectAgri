"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChartNoAxesCombined, Languages, Leaf, MapPinned, ShieldCheck, Warehouse } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth-client";
import { applyLocale, getLocale, languageOptions, setLocale } from "@/lib/i18n";

const copy = {
  en: { login: "Log in", enter: "Enter the platform", eyebrow: "Farm to buyer. No middlemen.", title: "Farmers keep the value they grow.", subhead: "A four-node digital ecosystem connecting farmers, buyers, transporters and storage partners with escrow settlement, demand forecasting and route optimisation.", role: "Choose your role", ecosystem: "The 4-node ecosystem", access: "Role-based access keeps pricing, quality records and settlement responsibilities in the right hands.", roles: [["Farmer", "Owns crop digitally until final sale."], ["Buyer", "Bulk procurement and hyper-local sourcing."], ["Transporter", "Accepts efficient, nearby delivery work."], ["Storage partner", "Records quality and custody with confidence."]], stats: ["farmer share today", "intermediaries removed", "digital ownership retained"] },
  hi: { login: "लॉग इन", enter: "प्लेटफ़ॉर्म खोलें", eyebrow: "खेत से खरीदार तक। बिना बिचौलियों के।", title: "किसान अपनी उपज का मूल्य रखते हैं।", subhead: "एस्क्रो भुगतान, मांग पूर्वानुमान और मार्ग अनुकूलन के साथ किसानों, खरीदारों, परिवहन और भंडारण को जोड़ने वाला डिजिटल तंत्र।", role: "अपनी भूमिका चुनें", ecosystem: "चार-नोड तंत्र", access: "भूमिका-आधारित पहुंच कीमत, गुणवत्ता और भुगतान की जिम्मेदारियां सही हाथों में रखती है।", roles: [["किसान", "अंतिम बिक्री तक फसल का डिजिटल स्वामी।"], ["खरीदार", "थोक खरीद और स्थानीय स्रोत।"], ["परिवहन", "पास के डिलीवरी कार्य स्वीकार करें।"], ["भंडारण भागीदार", "गुणवत्ता और रखवाली दर्ज करें।"]], stats: ["किसान का हिस्सा", "बिचौलिए हटे", "डिजिटल स्वामित्व"] },
  mr: { login: "लॉग इन", enter: "प्लॅटफॉर्म उघडा", eyebrow: "शेतातून खरेदीदारापर्यंत. मध्यस्थांशिवाय.", title: "शेतकरी पिकाची कमाई स्वतःकडे ठेवतात.", subhead: "एस्क्रो पेमेंट, मागणीचा अंदाज आणि मार्ग नियोजनासह शेतकरी, खरेदीदार, वाहतूक आणि साठवण जोडणारे डिजिटल तंत्र.", role: "आपली भूमिका निवडा", ecosystem: "चार-नोड तंत्र", access: "भूमिकेनुसार प्रवेश किंमत, गुणवत्ता आणि पेमेंटची जबाबदारी योग्य हातात ठेवतो.", roles: [["शेतकरी", "अंतिम विक्रीपर्यंत पिकाचा डिजिटल मालक."], ["खरेदीदार", "मोठ्या प्रमाणात आणि स्थानिक खरेदी."], ["वाहतूकदार", "जवळची डिलिव्हरी कामे स्वीकारा."], ["साठवण भागीदार", "गुणवत्ता आणि ताबा नोंदवा."]], stats: ["शेतकऱ्याचा वाटा", "मध्यस्थ कमी", "डिजिटल मालकी"] },
  bn: { login: "লগ ইন", enter: "প্ল্যাটফর্ম খুলুন", eyebrow: "খামার থেকে ক্রেতা। মধ্যস্বত্বভোগী ছাড়া।", title: "কৃষক তাঁর ফসলের মূল্য নিজে রাখেন।", subhead: "এসক্রো পেমেন্ট, চাহিদার পূর্বাভাস এবং রুট অপ্টিমাইজেশনসহ কৃষক, ক্রেতা, পরিবহন ও সংরক্ষণকে যুক্ত করে একটি ডিজিটাল ব্যবস্থা।", role: "আপনার ভূমিকা বেছে নিন", ecosystem: "চার-নোড ব্যবস্থা", access: "ভূমিকাভিত্তিক প্রবেশাধিকার দাম, গুণমান ও পেমেন্টের দায়িত্ব সঠিক হাতে রাখে।", roles: [["কৃষক", "চূড়ান্ত বিক্রি পর্যন্ত ফসলের ডিজিটাল মালিক।"], ["ক্রেতা", "থোক ক্রয় ও স্থানীয় সংগ্রহ।"], ["পরিবহন", "কাছাকাছি ডেলিভারি কাজ গ্রহণ করুন।"], ["সংরক্ষণ অংশীদার", "গুণমান ও হেফাজত নথিভুক্ত করুন।"]], stats: ["কৃষকের অংশ", "মধ্যস্বত্বভোগী কমেছে", "ডিজিটাল মালিকানা"] },
  te: { login: "లాగిన్", enter: "ప్లాట్‌ఫారమ్ తెరవండి", eyebrow: "పొలం నుండి కొనుగోలుదారు. మధ్యవర్తులు లేకుండా.", title: "రైతులు పంట విలువను తమ వద్ద ఉంచుకుంటారు.", subhead: "ఎస్క్రో చెల్లింపు, డిమాండ్ అంచనా మరియు మార్గ ఆప్టిమైజేషన్‌తో రైతులు, కొనుగోలుదారులు, రవాణా మరియు నిల్వను కలిపే డిజిటల్ వ్యవస్థ.", role: "మీ పాత్రను ఎంచుకోండి", ecosystem: "నాలుగు-నోడ్ వ్యవస్థ", access: "పాత్ర ఆధారిత ప్రవేశం ధర, నాణ్యత మరియు చెల్లింపు బాధ్యతలను సరైన చేతుల్లో ఉంచుతుంది.", roles: [["రైతు", "చివరి అమ్మకం వరకు పంట డిజిటల్ యజమాని."], ["కొనుగోలుదారు", "సామూహిక కొనుగోలు మరియు స్థానిక సేకరణ."], ["రవాణాదారు", "దగ్గరి డెలివరీ పనులను స్వీకరించండి."], ["నిల్వ భాగస్వామి", "నాణ్యత మరియు సంరక్షణను నమోదు చేయండి."]], stats: ["రైతు వాటా", "మధ్యవర్తులు తగ్గారు", "డిజిటల్ యాజమాన్యం"] },
  ta: { login: "உள்நுழை", enter: "தளத்தை திற", eyebrow: "பண்ணையிலிருந்து வாங்குபவர். இடைத்தரகர்கள் இன்றி.", title: "விவசாயிகள் தாங்கள் வளர்ப்பதன் மதிப்பை வைத்திருக்கிறார்கள்.", subhead: "எஸ்க்ரோ செலுத்துதல், தேவை முன்னறிவிப்பு மற்றும் பாதை மேம்பாட்டுடன் விவசாயிகள், வாங்குபவர்கள், போக்குவரத்து மற்றும் சேமிப்பை இணைக்கும் டிஜிட்டல் அமைப்பு.", role: "உங்கள் பங்கை தேர்வு செய்க", ecosystem: "நான்கு-நோட் அமைப்பு", access: "பங்கு அடிப்படையிலான அணுகல் விலை, தரம் மற்றும் செலுத்துதல் பொறுப்புகளை சரியான கைகளில் வைக்கிறது.", roles: [["விவசாயி", "இறுதி விற்பனை வரை பயிரின் டிஜிட்டல் உரிமையாளர்."], ["வாங்குபவர்", "மொத்த கொள்முதல் மற்றும் உள்ளூர் ஆதாரம்."], ["போக்குவரத்து", "அருகிலுள்ள விநியோக பணிகளை ஏற்கவும்."], ["சேமிப்பு பங்குதாரர்", "தரம் மற்றும் பாதுகாப்பை பதிவு செய்யவும்."]], stats: ["விவசாயி பங்கு", "இடைத்தரகர்கள் நீக்கப்பட்டனர்", "டிஜிட்டல் உரிமை"] },
  gu: { login: "લોગ ઇન", enter: "પ્લેટફોર્મ ખોલો", eyebrow: "ખેતરથી ખરીદદાર સુધી. વચ્ચેટિયા વગર.", title: "ખેડૂતો પોતાના પાકનું મૂલ્ય રાખે છે.", subhead: "એસ્ક્રો પેમેન્ટ, માંગનો અંદાજ અને માર્ગ ઑપ્ટિમાઇઝેશન સાથે ખેડૂતો, ખરીદદારો, પરિવહન અને સંગ્રહને જોડતી ડિજિટલ વ્યવસ્થા.", role: "તમારી ભૂમિકા પસંદ કરો", ecosystem: "ચાર-નોડ વ્યવસ્થા", access: "ભૂમિકા આધારિત પ્રવેશ કિંમત, ગુણવત્તા અને પેમેન્ટની જવાબદારી યોગ્ય હાથમાં રાખે છે.", roles: [["ખેડૂત", "અંતિમ વેચાણ સુધી પાકનો ડિજિટલ માલિક."], ["ખરીદદાર", "થોક ખરીદી અને સ્થાનિક સ્ત્રોત."], ["પરિવહન", "નજીકની ડિલિવરી કામો સ્વીકારો."], ["સંગ્રહ ભાગીદાર", "ગુણવત્તા અને કબજો નોંધો."]], stats: ["ખેડૂતનો હિસ્સો", "વચ્ચેટિયા ઘટ્યા", "ડિજિટલ માલિકી"] },
  ur: { login: "لاگ ان", enter: "پلیٹ فارم کھولیں", eyebrow: "کھیت سے خریدار تک۔ بغیر درمیان والوں کے۔", title: "کسان اپنی پیداوار کی قیمت خود رکھتے ہیں۔", subhead: "ایسکرو ادائیگی، طلب کی پیش گوئی اور راستے کی بہتری کے ساتھ کسانوں، خریداروں، نقل و حمل اور ذخیرہ کو جوڑنے والا ڈیجیٹل نظام۔", role: "اپنا کردار منتخب کریں", ecosystem: "چار نوڈ نظام", access: "کردار پر مبنی رسائی قیمت، معیار اور ادائیگی کی ذمہ داری درست ہاتھوں میں رکھتی ہے۔", roles: [["کسان", "حتمی فروخت تک فصل کا ڈیجیٹل مالک۔"], ["خریدار", "تھوک خریداری اور مقامی ذریعہ۔"], ["نقل و حمل", "قریبی ڈیلیوری کام قبول کریں۔"], ["ذخیرہ شراکت دار", "معیار اور تحویل درج کریں۔"]], stats: ["کسان کا حصہ", "درمیان والے کم", "ڈیجیٹل ملکیت"] },
  kn: { login: "ಲಾಗ್ ಇನ್", enter: "ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ತೆರೆಯಿರಿ", eyebrow: "ಜಮೀನಿನಿಂದ ಖರೀದಿದಾರರಿಗೆ. ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲದೆ.", title: "ರೈತರು ತಾವು ಬೆಳೆದುದರ ಮೌಲ್ಯವನ್ನು ಇಟ್ಟುಕೊಳ್ಳುತ್ತಾರೆ.", subhead: "ಎಸ್ಕ್ರೋ ಪಾವತಿ, ಬೇಡಿಕೆ ಮುನ್ಸೂಚನೆ ಮತ್ತು ಮಾರ್ಗ ಆಪ್ಟಿಮೈಸೇಶನ್‌ನೊಂದಿಗೆ ರೈತರು, ಖರೀದಿದಾರರು, ಸಾರಿಗೆ ಮತ್ತು ಸಂಗ್ರಹವನ್ನು ಸಂಪರ್ಕಿಸುವ ಡಿಜಿಟಲ್ ವ್ಯವಸ್ಥೆ.", role: "ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ", ecosystem: "ನಾಲ್ಕು-ನೋಡ್ ವ್ಯವಸ್ಥೆ", access: "ಪಾತ್ರ ಆಧಾರಿತ ಪ್ರವೇಶ ಬೆಲೆ, ಗುಣಮಟ್ಟ ಮತ್ತು ಪಾವತಿ ಜವಾಬ್ದಾರಿಗಳನ್ನು ಸರಿಯಾದ ಕೈಗಳಲ್ಲಿ ಇಡುತ್ತದೆ.", roles: [["ರೈತ", "ಅಂತಿಮ ಮಾರಾಟದವರೆಗೆ ಬೆಳೆಯ ಡಿಜಿಟಲ್ ಮಾಲೀಕ."], ["ಖರೀದಿದಾರ", "ಸಾಮೂಹಿಕ ಖರೀದಿ ಮತ್ತು ಸ್ಥಳೀಯ ಮೂಲ."], ["ಸಾರಿಗೆದಾರ", "ಹತ್ತಿರದ ಡೆಲಿವರಿ ಕೆಲಸಗಳನ್ನು ಸ್ವೀಕರಿಸಿ."], ["ಸಂಗ್ರಹ ಪಾಲುದಾರ", "ಗುಣಮಟ್ಟ ಮತ್ತು ಕಾವಲು ದಾಖಲಿಸಿ."]], stats: ["ರೈತರ ಪಾಲು", "ಮಧ್ಯವರ್ತಿಗಳು ಕಡಿಮೆ", "ಡಿಜಿಟಲ್ ಮಾಲೀಕತ್ವ"] }
};

export default function Home() {
  const router = useRouter();
  const [locale, setCurrentLocale] = useState("en");
  const [isHydrated, setIsHydrated] = useState(false);
  const t = copy[locale] ?? copy.en;
  const roles = [
    [t.roles[0][0], t.roles[0][1], Leaf],
    [t.roles[1][0], t.roles[1][1], ChartNoAxesCombined],
    [t.roles[2][0], t.roles[2][1], MapPinned],
    [t.roles[3][0], t.roles[3][1], Warehouse],
    ["Government", "Monitor adoption, price uplift, and dispute trends for the wider ecosystem.", ShieldCheck]
  ];

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

  function goToEntry() {
    const session = getSession();
    if (session) {
      router.replace(`/dashboard/${session.user.role}`);
      return;
    }
    router.push("/signup");
  }

  function goToLogin() {
    const session = getSession();
    if (session) {
      router.replace(`/dashboard/${session.user.role}`);
      return;
    }
    router.push("/login");
  }

  return (
    <main className="min-h-screen px-5 py-5 sm:px-8" dir={locale === "ur" ? "rtl" : "ltr"} lang={locale}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold"><span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--leaf)] text-white"><Leaf size={20} /></span><span>DirectAgri<small className="block text-xs font-normal text-[var(--muted)]">SIH26033</small></span></Link>
        <div className="flex items-center gap-3"><label className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"><Languages size={16} className="text-[var(--leaf)]" /><select value={locale} onChange={(event) => changeLocale(event.target.value)} className="bg-transparent font-semibold" aria-label="Language">{languageOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label><button type="button" onClick={goToLogin} className="hidden rounded-lg px-3 py-2 text-sm font-semibold sm:block">{t.login}</button><button type="button" onClick={goToEntry} className="rounded-lg bg-[var(--leaf-dark)] px-4 py-2.5 text-sm font-semibold text-white">{t.enter}</button></div>
      </nav>

      <section className="mx-auto max-w-7xl pb-14 pt-16 lg:pb-20 lg:pt-24">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-[0.98] sm:text-7xl">{t.title}</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">{t.subhead}</p>
        <div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={goToEntry} className="inline-flex items-center gap-3 rounded-lg bg-[var(--leaf)] px-5 py-3.5 font-semibold text-white">{t.enter} <ArrowRight size={18} /></button><button type="button" onClick={goToEntry} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-5 py-3.5 font-semibold shadow-soft">{t.role}</button></div>
        <div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-3"><Stat value="25–35%" label={t.stats[0]} /><Stat value="4–6" label={t.stats[1]} /><Stat value="100%" label={t.stats[2]} /></div>
      </section>

      <section className="mx-auto max-w-7xl rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-soft sm:p-8"><p className="eyebrow">{t.ecosystem}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{roles.map(([title, description, Icon]) => <div key={title} className="flex items-center gap-4 rounded-xl border border-[var(--line)] bg-white p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e7f0e5] text-[var(--leaf)]"><Icon size={21} /></span><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{description}</p></div></div>)}</div><div className="mt-6 flex items-start gap-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]"><ShieldCheck className="mt-0.5 shrink-0 text-[var(--leaf)]" size={18} /><p>{t.access}</p></div></section>
    </main>
  );
}

function Stat({ value, label }) {
  return <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-soft"><p className="text-2xl font-bold text-[var(--leaf)]">{value}</p><p className="mt-1 text-xs text-[var(--muted)]">{label}</p></div>;
}
