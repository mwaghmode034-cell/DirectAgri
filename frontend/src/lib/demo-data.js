import {
  BarChart3,
  Boxes,
  Building2,
  IndianRupee,
  Landmark,
  Sprout,
  Tractor,
  Truck
} from "lucide-react";

export const roles = [
  { id: "farmer", label: "Farmer", icon: Sprout },
  { id: "buyer", label: "Buyer", icon: Building2 },
  { id: "transporter", label: "Transporter", icon: Truck },
  { id: "storage", label: "Storage", icon: Boxes },
  { id: "government", label: "Government", icon: Landmark }
];

export const translations = {
  en: {
    headline: "Direct crop ownership from farm gate to buyer",
    subhead: "List, aggregate, move, store, and benchmark produce without handing price control to a middleman.",
    listCrop: "List Crop",
    smartAggregate: "Smart Aggregate",
    routePlan: "Route Plan",
    qualityCheck: "Quality Check",
    oversight: "Oversight",
    dashboard: "dashboard",
    forecast: "Demand forecast",
    inventory: "Live inventory",
    listCrop: "List crop",
    buyerOffer: "Submit offer",
    checkIn: "Check in next batch",
    checkOut: "Check out stored batch",
    logout: "Log out",
    records: "records"
  },
  hi: {
    headline: "खेत से खरीदार तक सीधा फसल स्वामित्व",
    subhead: "बिचौलिए को कीमत नियंत्रण दिए बिना सूचीकरण, खरीद, परिवहन, भंडारण और तुलना करें।",
    listCrop: "फसल जोड़ें",
    smartAggregate: "स्मार्ट समूह",
    routePlan: "मार्ग योजना",
    qualityCheck: "गुणवत्ता जांच",
    oversight: "निगरानी",
    dashboard: "डैशबोर्ड",
    forecast: "मांग का अनुमान",
    inventory: "लाइव इन्वेंटरी",
    listCrop: "फसल जोड़ें",
    buyerOffer: "प्रस्ताव भेजें",
    checkIn: "अगला बैच जमा करें",
    checkOut: "संग्रहीत बैच निकालें",
    logout: "लॉग आउट",
    records: "रिकॉर्ड"
  },
  mr: {
    headline: "शेतातून खरेदीदारापर्यंत थेट मालकी",
    subhead: "मध्यस्थांशिवाय पिकांची नोंद, एकत्र खरेदी, वाहतूक, साठवण आणि दर तुलना.",
    listCrop: "पीक नोंदवा",
    smartAggregate: "स्मार्ट एकत्रीकरण",
    routePlan: "मार्ग योजना",
    qualityCheck: "गुणवत्ता तपासणी",
    oversight: "नियंत्रण",
    dashboard: "डॅशबोर्ड",
    forecast: "मागणीचा अंदाज",
    inventory: "लाइव्ह साठा",
    listCrop: "पीक नोंदवा",
    buyerOffer: "ऑफर पाठवा",
    checkIn: "पुढील बॅच जमा करा",
    checkOut: "साठवलेली बॅच काढा",
    logout: "लॉग आउट",
    records: "नोंदी"
  }
};

translations.bn = { headline: "খামার থেকে ক্রেতার কাছে সরাসরি ফসলের মালিকানা", subhead: "মধ্যস্বত্বভোগীকে দাম নিয়ন্ত্রণ না দিয়ে ফসল তালিকাভুক্ত, সংগ্রহ, পরিবহন, সংরক্ষণ এবং তুলনা করুন।", dashboard: "ড্যাশবোর্ড", forecast: "চাহিদার পূর্বাভাস", inventory: "লাইভ মজুত", listCrop: "ফসল যোগ করুন", buyerOffer: "অফার পাঠান", checkIn: "পরবর্তী ব্যাচ জমা দিন", checkOut: "সংরক্ষিত ব্যাচ বের করুন", logout: "লগ আউট", records: "রেকর্ড" };
translations.te = { headline: "పొలం నుండి కొనుగోలుదారునికి నేరుగా పంట యాజమాన్యం", subhead: "మధ్యవర్తికి ధర నియంత్రణ ఇవ్వకుండా పంటను నమోదు, సేకరణ, రవాణా, నిల్వ మరియు పోలిక చేయండి.", dashboard: "డ్యాష్‌బోర్డ్", forecast: "డిమాండ్ అంచనా", inventory: "లైవ్ నిల్వ", listCrop: "పంటను నమోదు చేయండి", buyerOffer: "ఆఫర్ పంపండి", checkIn: "తదుపరి బ్యాచ్ చెక్ ఇన్", checkOut: "నిల్వ బ్యాచ్ చెక్ అవుట్", logout: "లాగ్ అవుట్", records: "రికార్డులు" };
translations.ta = { headline: "பண்ணையிலிருந்து வாங்குபவருக்கு நேரடி பயிர் உரிமை", subhead: "இடைத்தரகரிடம் விலை கட்டுப்பாட்டை ஒப்படைக்காமல் பயிர்களை பட்டியலிட்டு, சேகரித்து, நகர்த்தி, சேமித்து ஒப்பிடுங்கள்.", dashboard: "டாஷ்போர்டு", forecast: "தேவை முன்னறிவிப்பு", inventory: "நேரடி இருப்பு", listCrop: "பயிரை பட்டியலிடு", buyerOffer: "சலுகையை அனுப்பு", checkIn: "அடுத்த தொகுதியை சேர்", checkOut: "சேமித்த தொகுதியை வெளியேற்று", logout: "வெளியேறு", records: "பதிவுகள்" };
translations.gu = { headline: "ખેતરથી ખરીદદાર સુધી સીધી પાક માલિકી", subhead: "વચ્ચેટિયાને ભાવ નિયંત્રણ આપ્યા વિના પાકની યાદી, એકત્રીકરણ, પરિવહન, સંગ્રહ અને સરખામણી કરો.", dashboard: "ડેશબોર્ડ", forecast: "માગનો અંદાજ", inventory: "લાઇવ જથ્થો", listCrop: "પાક ઉમેરો", buyerOffer: "ઓફર મોકલો", checkIn: "આગલી બેચ ચેક ઇન", checkOut: "સંગ્રહિત બેચ ચેક આઉટ", logout: "લૉગ આઉટ", records: "રેકોર્ડ" };
translations.ur = { headline: "کھیت سے خریدار تک براہ راست فصل کی ملکیت", subhead: "درمیان والے کو قیمت کا اختیار دیے بغیر فصل کی فہرست، خرید، نقل و حمل، ذخیرہ اور موازنہ کریں۔", dashboard: "ڈیش بورڈ", forecast: "طلب کی پیش گوئی", inventory: "لائیو ذخیرہ", listCrop: "فصل شامل کریں", buyerOffer: "پیشکش بھیجیں", checkIn: "اگلی کھیپ داخل کریں", checkOut: "ذخیرہ شدہ کھیپ نکالیں", logout: "لاگ آؤٹ", records: "ریکارڈز" };
translations.kn = { headline: "ಜಮೀನಿನಿಂದ ಖರೀದಿದಾರರಿಗೆ ನೇರ ಬೆಳೆ ಮಾಲೀಕತ್ವ", subhead: "ಮಧ್ಯವರ್ತಿಗೆ ಬೆಲೆ ನಿಯಂತ್ರಣ ನೀಡದೆ ಬೆಳೆಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ, ಒಟ್ಟುಗೂಡಿಸಿ, ಸಾಗಿಸಿ, ಸಂಗ್ರಹಿಸಿ ಹೋಲಿಸಿ.", dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", forecast: "ಬೇಡಿಕೆ ಮುನ್ಸೂಚನೆ", inventory: "ಲೈವ್ ದಾಸ್ತಾನು", listCrop: "ಬೆಳೆ ಸೇರಿಸಿ", buyerOffer: "ಆಫರ್ ಕಳುಹಿಸಿ", checkIn: "ಮುಂದಿನ ಬ್ಯಾಚ್ ಚೆಕ್ ಇನ್", checkOut: "ಸಂಗ್ರಹಿತ ಬ್ಯಾಚ್ ಚೆಕ್ ಔಟ್", logout: "ಲಾಗ್ ಔಟ್", records: "ದಾಖಲೆಗಳು" };

for (const locale of Object.keys(translations)) {
  translations[locale] = { ...translations.en, ...translations[locale] };
}

export const initialBatches = [
  {
    id: "B-1402",
    farmer: "Asha Pawar",
    crop: "Onion",
    village: "Pimpalgaon",
    district: "Nashik",
    quantityKg: 2400,
    pricePerKg: 22,
    status: "ON_FARM",
    quality: 91,
    lat: 20.17,
    lng: 73.99
  },
  {
    id: "B-1730",
    farmer: "Ramesh Jadhav",
    crop: "Tomato",
    village: "Sinnar",
    district: "Nashik",
    quantityKg: 1800,
    pricePerKg: 18,
    status: "STORED",
    quality: 84,
    lat: 19.84,
    lng: 74.0
  },
  {
    id: "B-2044",
    farmer: "Meera More",
    crop: "Pomegranate",
    village: "Baramati",
    district: "Pune",
    quantityKg: 950,
    pricePerKg: 92,
    status: "ON_FARM",
    quality: 95,
    lat: 18.15,
    lng: 74.58
  },
  {
    id: "B-2218",
    farmer: "Iqbal Shaikh",
    crop: "Grapes",
    village: "Niphad",
    district: "Nashik",
    quantityKg: 1250,
    pricePerKg: 74,
    status: "IN_TRANSIT",
    quality: 88,
    lat: 20.08,
    lng: 74.11
  }
];

export const forecast = [
  { crop: "Onion", demand: 82, mandi: 18, platform: 22 },
  { crop: "Tomato", demand: 64, mandi: 14, platform: 18 },
  { crop: "Grapes", demand: 76, mandi: 62, platform: 74 },
  { crop: "Pomegranate", demand: 88, mandi: 76, platform: 92 }
];

export const kpis = [
  { label: "Farmer margin recovered", value: "31%", icon: IndianRupee },
  { label: "Verified participants", value: "1,284", icon: Tractor },
  { label: "Active crop batches", value: "426", icon: Boxes },
  { label: "Mandi benchmark uplift", value: "18.6%", icon: BarChart3 }
];

export function parseListing(input) {
  const lower = input.toLowerCase();
  const crop =
    ["onion", "tomato", "grapes", "pomegranate", "wheat", "rice"].find((item) => lower.includes(item)) ??
    "Mixed Produce";
  const quantityMatch = lower.match(/(\d+(?:\.\d+)?)\s*(ton|tons|tonne|tonnes|kg|kgs|quintal|quintals)/);
  const priceMatch = lower.match(/(?:rs|₹|inr|price|rate)\s*\.?\s*(\d+(?:\.\d+)?)/);
  const quantity = quantityMatch
    ? Math.round(
      Number(quantityMatch[1]) *
      (quantityMatch[2].startsWith("ton") ? 1000 : quantityMatch[2].startsWith("quintal") ? 100 : 1)
    )
    : 500;
  const price = priceMatch ? Number(priceMatch[1]) : forecast.find((item) => item.crop.toLowerCase() === crop)?.platform ?? 25;

  return {
    crop: crop.replace(/\b\w/g, (char) => char.toUpperCase()),
    quantityKg: quantity,
    pricePerKg: price
  };
}

export function planRoute(batches) {
  const depot = { lat: 19.99, lng: 73.78 };
  const remaining = batches.map((batch, index) => ({
    ...batch,
    lat: Number.isFinite(batch.lat) ? batch.lat : depot.lat + index * 0.04,
    lng: Number.isFinite(batch.lng) ? batch.lng : depot.lng + index * 0.04
  }));
  const route = [];
  let current = depot;

  while (remaining.length) {
    remaining.sort((a, b) => distance(current, a) - distance(current, b));
    const next = remaining.shift();
    if (!next) break;
    route.push(next);
    current = next;
  }

  return route;
}

function distance(a, b) {
  return Math.hypot((a.lat ?? 0) - (b.lat ?? 0), (a.lng ?? 0) - (b.lng ?? 0));
}
