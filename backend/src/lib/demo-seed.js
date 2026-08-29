import bcrypt from "bcryptjs";

const demoAccounts = [
  { email: "farmer@directagri.dev", role: "farmer", name: "Anita Patil", location: "Pimpalgaon, Nashik" },
  { email: "buyer@directagri.dev", role: "buyer", name: "Meera Joshi", location: "Pune, Pune" },
  { email: "transporter@directagri.dev", role: "transporter", name: "Ravi Kale", location: "Nashik, Nashik" },
  { email: "storage@directagri.dev", role: "storage", name: "GreenHarvest Cold Storage", location: "Niphad, Nashik" },
  { email: "government@directagri.dev", role: "government", name: "District Officer", location: "Mumbai, Mumbai" }
];

export async function ensureDemoAccounts(database) {
  const users = database.collection("users");
  const existing = await users.findOne({ email: demoAccounts[0].email });
  if (existing) return;

  const passwordHash = await bcrypt.hash("demo1234", 12);
  await users.insertMany(
    demoAccounts.map((account) => ({
      ...account,
      phone: "",
      passwordHash,
      kycVerified: true,
      createdAt: new Date()
    }))
  );
}
