export const demoBatches = [
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
  { label: "Farmer margin recovered", value: "31%" },
  { label: "Verified participants", value: "1,284" },
  { label: "Active crop batches", value: "426" },
  { label: "Mandi benchmark uplift", value: "18.6%" }
];
