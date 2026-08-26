import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  { id: "66cafe000000000000000001", role: "FARMER", name: "Asha Pawar", phone: "+919876500001", location: "Pimpalgaon, Nashik", kycVerified: true },
  { id: "66cafe000000000000000002", role: "BUYER", name: "FreshCart Procurement", phone: "+919876500002", location: "Pune", kycVerified: true },
  { id: "66cafe000000000000000003", role: "TRANSPORTER", name: "Ganesh Logistics", phone: "+919876500003", location: "Nashik", kycVerified: true },
  { id: "66cafe000000000000000004", role: "STORAGE", name: "Niphad Cold Storage", phone: "+919876500004", location: "Niphad", kycVerified: true },
  { id: "66cafe000000000000000005", role: "GOVERNMENT", name: "Maharashtra Agriculture Desk", phone: "+919876500005", location: "Mumbai", kycVerified: true },
  { id: "66cafe000000000000000006", role: "FARMER", name: "Ramesh Jadhav", phone: "+919876500006", location: "Sinnar, Nashik", kycVerified: true },
  { id: "66cafe000000000000000007", role: "BUYER", name: "Village Retail Coop", phone: "+919876500007", location: "Nashik", kycVerified: true }
];

const batches = [
  { id: "66cb00000000000000001402", ownerId: users[0].id, cropType: "Onion", quantityKg: 2400, pricePerKg: 22, status: "ON_FARM", storageId: null },
  { id: "66cb00000000000000001730", ownerId: users[5].id, cropType: "Tomato", quantityKg: 1800, pricePerKg: 18, status: "STORED", storageId: users[3].id },
  { id: "66cb00000000000000002044", ownerId: users[0].id, cropType: "Pomegranate", quantityKg: 950, pricePerKg: 92, status: "ON_FARM", storageId: null },
  { id: "66cb00000000000000002218", ownerId: users[5].id, cropType: "Grapes", quantityKg: 1250, pricePerKg: 74, status: "IN_TRANSIT", storageId: null }
];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.priceBenchmark.deleteMany();
  await prisma.qualityCheck.deleteMany();
  await prisma.storageLedger.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cropBatch.deleteMany();
  await prisma.user.deleteMany();

  for (const user of users) {
    await prisma.user.create({ data: user });
  }

  for (const batch of batches) {
    await prisma.cropBatch.create({ data: batch });
  }

  const order = await prisma.order.create({
    data: {
      id: "66cd00000000000000000001",
      buyerId: users[1].id,
      transporterId: users[2].id,
      escrowStatus: "LOCKED"
    }
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      batchId: batches[1].id,
      quantityKg: 800
    }
  });

  await prisma.payment.createMany({
    data: [
      { orderId: order.id, payerId: users[1].id, payeeId: users[5].id, amount: 14400, type: "FARMER_PAYOUT", status: "PENDING" },
      { orderId: order.id, payerId: users[1].id, payeeId: users[2].id, amount: 2600, type: "TRANSPORT_FEE", status: "PENDING" },
      { orderId: order.id, payerId: users[1].id, payeeId: users[3].id, amount: 940, type: "STORAGE_RENT", status: "PENDING" }
    ]
  });

  await prisma.bid.create({
    data: {
      batchId: batches[0].id,
      buyerId: users[6].id,
      offerPrice: 20,
      status: "PENDING"
    }
  });

  await prisma.qualityCheck.createMany({
    data: [
      { batchId: batches[1].id, checkedBy: users[3].id, stage: "STORAGE_CHECKIN", photoUrl: "/demo/tomato-checkin.jpg", score: 84 },
      { batchId: batches[3].id, checkedBy: users[2].id, stage: "DELIVERY", photoUrl: "/demo/grapes-delivery.jpg", score: 88 }
    ]
  });

  await prisma.rating.create({
    data: {
      fromId: users[1].id,
      toId: users[5].id,
      orderId: order.id,
      score: 5,
      comment: "Clean crate packing and accurate weight."
    }
  });

  await prisma.dispute.create({
    data: {
      orderId: order.id,
      raisedById: users[1].id,
      status: "RESOLVED",
      resolutionNote: "Quality photo matched check-in record; no deduction applied."
    }
  });

  await prisma.priceBenchmark.createMany({
    data: [
      { cropType: "Onion", mandiPrice: 18, platformAvg: 22 },
      { cropType: "Tomato", mandiPrice: 14, platformAvg: 18 },
      { cropType: "Grapes", mandiPrice: 62, platformAvg: 74 },
      { cropType: "Pomegranate", mandiPrice: 76, platformAvg: 92 }
    ]
  });

  await prisma.notification.createMany({
    data: [
      { toUserId: users[0].id, channel: "WHATSAPP", message: "Your onion listing is live at Rs 22/kg." },
      { toUserId: users[2].id, channel: "SMS", message: "New Nashik multi-stop route available." },
      { toUserId: users[3].id, channel: "WHATSAPP", message: "Tomato batch B-1730 is scheduled for checkout." }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeded DirectAgri demo data.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
