# DirectAgri — Build Documentation
**SIH26033 · Team CodeDevz**

Stack: **Prisma + Express** backend and **Next.js + React** frontend — plain JavaScript throughout (`.js` / `.jsx`, no TypeScript). Backend and frontend are separate apps in separate folders, run on separate ports, and deploy separately.

> **Workspace status (2026-08-26):** The repository uses a Prisma + Express API in `backend/` and a Next.js web app in `frontend/`. They are independent workspace projects intended to run on separate ports and can be deployed separately.

### Progress tracker

- [x] Separate `backend/` and `frontend/` workspace projects with independent development commands.
- [x] Express demo API with role middleware, crop batches, NLP parsing, route planning, orders, storage, quality, and government endpoints.
- [x] Next.js role dashboard shell for Farmer, Buyer, Transporter, Storage, and Government views.
- [x] Farmer "List crop" action connected to `POST /api/crop-batches`; the UI shows saving and API error states.
- [x] Dashboard role isolation enforced: each authenticated user sees only their own role workspace and can log out.
- [x] MongoDB collection bootstrap added for users, crop batches, orders, order items, bids, payments, disputes, ratings, storage ledger, notifications, audit logs, quality checks, and price benchmarks.
- [x] Crop batch listings load from MongoDB and farmer creation is persisted with JWT role enforcement.
- [x] Buyer bids and aggregate orders persist to MongoDB with authenticated buyer authorization.
- [x] Forecasts, route optimization, buyer orders, government statistics, and price benchmarks read from MongoDB.
- [x] Storage check-in/out and quality records persist to MongoDB with storage-role authorization.
- [x] Marketplace actions write audit events to MongoDB and government users can inspect recent audit activity.
- [x] Transporters can accept available delivery orders, and buyers can release escrow into persisted payment records.
- [x] Government dashboard reads live adoption, district, dispute, and audit metrics from MongoDB.
- [x] Dashboard, home, login, signup, and forgot-password language selectors support English, Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, and Kannada with persisted locale and Urdu RTL.
- [x] Documented `backend/` and `frontend/` directory skeleton created, including role pages and feature component entry points.
- [x] Initial shared modules created at `backend/src/app.js`, `backend/src/config/db.js`, `backend/src/services/nlpParser.js`, `frontend/src/api/axiosClient.js`, and `frontend/src/context/AuthContext.jsx`.
- [x] Replace remaining dashboard-only display labels with locale-aware role, KPI, table, action, storage, government, and forecast copy.
- [x] Add automated parser tests for varied quantities, prices, and incomplete messages.
- [x] Add automated backend API smoke tests and lifecycle coverage.
- [ ] Add automated browser UI tests for the completed workflows.
- [ ] Move the current route implementations out of `backend/src/server.js` into the documented `routes/` and `controllers/` modules.
- [x] Replace initial role component stubs with the active styled Next.js role dashboard shell.
- [x] Verify local production build and separate backend/frontend start commands.
- [ ] Verify production deployment on separate hosts.
- [x] Automate the end-to-end order lifecycle: listing, aggregate order, transporter assignment, storage check-in/out, and escrow release.
- [x] Add optional Gemini LLM extraction for varied crop listing messages with a timeout, response validation, and rule-based fallback.
- [x] Frontend demand chart first loads seeded API benchmark data and falls back to demo data when the API is unavailable.

### LLM configuration

The listing parser remains demo-safe without external services. To enable Gemini extraction, set these variables in `backend/.env` (never commit the key):

```env
GEMINI_API_KEY=your-new-gemini-key
GEMINI_MODEL=gemini-2.0-flash
# Optional; leave blank for the default Google endpoint
GEMINI_API_URL=
```

The server validates the returned JSON and falls back to the local parser when the request times out, fails, or returns an incomplete result. The API key is sent only from the backend and is never exposed to the browser.

Copy `backend/.env.example` to `backend/.env` and fill credentials locally. Both service `.env` files are ignored by Git; real credentials must never be committed. Because a previous `backend/.env` was tracked, remove it from the Git index once with `git rm --cached backend/.env` while keeping the local file.

---

## 1. Project Folder Structure

```
directagri/
├── backend/                          # Express API — runs on PORT 4000
│   ├── src/
│   │   ├── server.js                 # entry point, starts the HTTP server
│   │   ├── app.js                    # express app, middleware, route mounting
│   │   ├── config/
│   │   │   └── db.js                 # mongoose connection
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── CropBatch.js
│   │   │   ├── Order.js
│   │   │   ├── OrderItem.js
│   │   │   ├── StorageLedger.js
│   │   │   ├── Payment.js
│   │   │   ├── Bid.js
│   │   │   ├── Dispute.js
│   │   │   ├── Rating.js
│   │   │   ├── Notification.js
│   │   │   ├── AuditLog.js
│   │   │   ├── QualityCheck.js
│   │   │   └── PriceBenchmark.js
│   │   ├── routes/
│   │   │   ├── cropBatchRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── bidRoutes.js
│   │   │   ├── storageRoutes.js
│   │   │   ├── qualityRoutes.js
│   │   │   ├── forecastRoutes.js
│   │   │   ├── routeOptimizeRoutes.js
│   │   │   ├── nlpParseRoutes.js
│   │   │   └── governmentRoutes.js
│   │   ├── controllers/
│   │   │   ├── cropBatchController.js
│   │   │   ├── orderController.js
│   │   │   ├── bidController.js
│   │   │   ├── storageController.js
│   │   │   ├── qualityController.js
│   │   │   ├── forecastController.js
│   │   │   ├── routeOptimizeController.js
│   │   │   ├── nlpParseController.js
│   │   │   └── governmentController.js
│   │   ├── middleware/
│   │   │   ├── auth.js               # demo session/role handling
│   │   │   ├── rbac.js               # field-level permission checks
│   │   │   └── errorHandler.js
│   │   ├── services/
│   │   │   ├── routeOptimizer.js     # greedy nearest-neighbor
│   │   │   ├── nlpParser.js          # LangChain listing parser
│   │   │   └── mocks/
│   │   │       ├── smsMock.js
│   │   │       └── whatsappMock.js
│   │   └── seed.js                   # demo seed data for all 5 roles
│   ├── uploads/                      # quality-check photo uploads (multer)
│   ├── .env
│   ├── package.json
│   └── README.md
│
├── frontend/                         # Next.js React app — runs on PORT 3000
│   ├── public/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── api/
│   │   │   └── axiosClient.js        # baseURL = backend port
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── i18n.js
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   ├── hi.json               # Hindi
│   │   │   ├── bn.json               # Bengali
│   │   │   ├── mr.json               # Marathi
│   │   │   ├── te.json               # Telugu
│   │   │   ├── ta.json               # Tamil
│   │   │   ├── gu.json               # Gujarati
│   │   │   ├── ur.json               # Urdu
│   │   │   └── kn.json               # Kannada
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── farmer/Dashboard.jsx
│   │   │   ├── buyer/Dashboard.jsx
│   │   │   ├── transporter/Dashboard.jsx
│   │   │   ├── storage/Dashboard.jsx
│   │   │   └── government/Dashboard.jsx
│   │   └── components/
│   │       ├── farmer/
│   │       │   ├── ChatListingInput.jsx
│   │       │   ├── InventoryTable.jsx
│   │       │   └── ForecastChart.jsx
│   │       ├── buyer/
│   │       │   ├── MarketplaceGrid.jsx
│   │       │   └── SmartAggregateModal.jsx
│   │       ├── transporter/
│   │       │   ├── GigRadar.jsx
│   │       │   └── RouteMapView.jsx
│   │       ├── storage/
│   │       │   ├── CheckInPanel.jsx
│   │       │   └── QualityPhotoUpload.jsx
│   │       └── government/
│   │           ├── AdoptionStatsPanel.jsx
│   │           └── PriceBenchmarkChart.jsx
│   ├── .env
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── .gitignore
└── README.md
```

Both folders are independent Node projects (own `package.json`, own `node_modules`) so they can be deployed to two different hosts as-is.

---

## 2. Mongoose Models (replacing the earlier Prisma schema)

`backend/src/models/User.js`
```js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ["FARMER", "BUYER", "TRANSPORTER", "STORAGE", "GOVERNMENT"], required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  kycVerified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
```

`backend/src/models/CropBatch.js`
```js
const mongoose = require("mongoose");

const cropBatchSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cropType: { type: String, required: true },
  quantityKg: { type: Number, required: true },
  pricePerKg: { type: Number, required: true },
  status: { type: String, enum: ["ON_FARM", "IN_TRANSIT", "STORED", "SOLD"], default: "ON_FARM" },
  storageId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

module.exports = mongoose.model("CropBatch", cropBatchSchema);
```

`backend/src/models/Order.js`
```js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  transporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  escrowStatus: { type: String, enum: ["LOCKED", "RELEASED"], default: "LOCKED" },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
```

`backend/src/models/OrderItem.js`
```js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "CropBatch", required: true },
  quantityKg: { type: Number, required: true },
});

module.exports = mongoose.model("OrderItem", orderItemSchema);
```

`backend/src/models/StorageLedger.js`
```js
const mongoose = require("mongoose");

const storageLedgerSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "CropBatch", required: true },
  storageId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  checkInDate: { type: Date, default: Date.now },
  checkOutDate: { type: Date, default: null },
  dailyRentPerKg: { type: Number, required: true },
});

module.exports = mongoose.model("StorageLedger", storageLedgerSchema);
```

`backend/src/models/Payment.js`
```js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  payerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  payeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["FARMER_PAYOUT", "TRANSPORT_FEE", "STORAGE_RENT"], required: true },
  status: { type: String, enum: ["PENDING", "RELEASED"], default: "PENDING" },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
```

`backend/src/models/Bid.js`
```js
const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "CropBatch", required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  offerPrice: { type: Number, required: true },
  status: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED"], default: "PENDING" },
}, { timestamps: true });

module.exports = mongoose.model("Bid", bidSchema);
```

`backend/src/models/Dispute.js`
```js
const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  raisedById: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["OPEN", "RESOLVED"], default: "OPEN" },
  resolutionNote: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Dispute", disputeSchema);
```

`backend/src/models/Rating.js`
```js
const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  fromId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  toId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  score: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Rating", ratingSchema);
```

`backend/src/models/Notification.js`
```js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  channel: { type: String, enum: ["SMS", "WHATSAPP"], required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
```

`backend/src/models/AuditLog.js`
```js
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { timestamps: true });

module.exports = mongoose.model("AuditLog", auditLogSchema);
```

`backend/src/models/QualityCheck.js`
```js
const mongoose = require("mongoose");

const qualityCheckSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "CropBatch", required: true },
  checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  stage: { type: String, enum: ["STORAGE_CHECKIN", "STORAGE_CHECKOUT", "DELIVERY"], required: true },
  photoUrl: { type: String, required: true },
  score: { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model("QualityCheck", qualityCheckSchema);
```

`backend/src/models/PriceBenchmark.js`
```js
const mongoose = require("mongoose");

const priceBenchmarkSchema = new mongoose.Schema({
  cropType: { type: String, required: true },
  mandiPrice: { type: Number, required: true },
  platformAvg: { type: Number, required: true },
  recordedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PriceBenchmark", priceBenchmarkSchema);
```

---

## 3. Backend Entry Point & RBAC Middleware

`backend/src/config/db.js`
```js
const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");
};

module.exports = connectDB;
```

`backend/src/app.js`
```js
const express = require("express");
const cors = require("cors");

const cropBatchRoutes = require("./routes/cropBatchRoutes");
const orderRoutes = require("./routes/orderRoutes");
const bidRoutes = require("./routes/bidRoutes");
const storageRoutes = require("./routes/storageRoutes");
const qualityRoutes = require("./routes/qualityRoutes");
const forecastRoutes = require("./routes/forecastRoutes");
const routeOptimizeRoutes = require("./routes/routeOptimizeRoutes");
const nlpParseRoutes = require("./routes/nlpParseRoutes");
const governmentRoutes = require("./routes/governmentRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/crop-batches", cropBatchRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/quality", qualityRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/route-optimize", routeOptimizeRoutes);
app.use("/api/nlp-parse", nlpParseRoutes);
app.use("/api/government", governmentRoutes);

app.use(errorHandler);

module.exports = app;
```

`backend/src/server.js`
```js
require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`DirectAgri backend running on port ${PORT}`));
});
```

`backend/src/middleware/rbac.js` — the single shared gate referenced in the architecture doc, so the "storage role can't touch price" claim is enforced in one place:
```js
const AuditLog = require("../models/AuditLog");

// fieldsAllowed: which body fields each role may write on this route
const rbac = (role, fieldsAllowed) => async (req, res, next) => {
  if (req.user.role !== role && role !== "ANY") {
    return res.status(403).json({ error: "Forbidden for this role" });
  }
  const attemptedFields = Object.keys(req.body);
  const disallowed = attemptedFields.filter((f) => !fieldsAllowed.includes(f));

  await AuditLog.create({
    actorId: req.user.id,
    action: disallowed.length ? "BLOCKED_FIELD_UPDATE" : "FIELD_UPDATE",
    entityId: req.params.id || null,
  });

  if (disallowed.length) {
    return res.status(403).json({ error: `Not allowed to update: ${disallowed.join(", ")}` });
  }
  next();
};

module.exports = rbac;
```

Example use on a route (`storageRoutes.js`): a Storage-role user hitting `PATCH /api/crop-batches/:id` is only allowed to send `{ status, storageId }` — attempting `pricePerKg` gets rejected and logged.

---

## 4. Frontend Setup (Vite + React, plain JSX)

`frontend/package.json` (relevant bits)
```json
{
  "type": "module",
  "scripts": {
    "dev": "vite --port 3000",
    "build": "vite build",
    "preview": "vite preview --port 3000"
  }
}
```

`frontend/vite.config.js`
```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
});
```

`frontend/src/api/axiosClient.js`
```js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

export default axiosClient;
```

---

## 5. Environment Variables

`backend/.env`
```
PORT=5000
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/directagri"
FRONTEND_URL="http://localhost:3000"
LANGCHAIN_API_KEY=""
JWT_SECRET="replace-with-a-real-secret"
```

`frontend/.env`
```
VITE_API_BASE_URL="http://localhost:5000/api"
VITE_DEFAULT_LOCALE="en"
VITE_SUPPORTED_LOCALES="en,hi,bn,mr,te,ta,gu,ur,kn"
```

---

## 6. Core Dependencies

`backend/package.json`
```json
{
  "dependencies": {
    "express": "^4.19.0",
    "mongoose": "^8.5.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "multer": "^1.4.5",
    "jsonwebtoken": "^9.0.0",
    "langchain": "^0.3.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

`frontend/package.json`
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "axios": "^1.7.0",
    "react-i18next": "^15.0.0",
    "i18next": "^23.14.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 7. Setup Steps

1. **Scaffold backend:** `mkdir backend && cd backend && npm init -y`, install dependencies above, create the `src/` structure from Section 1.
2. **Scaffold frontend:** `npm create vite@latest frontend -- --template react` (choose the plain JS/JSX template, not TS), then install dependencies above.
3. **Provision MongoDB:** MongoDB Atlas free tier — fastest for a hackathon, no local install needed. Copy the connection string into `backend/.env` as `MONGODB_URI`.
4. **Run both dev servers in separate terminals from the repository root:**
   ```
  npm --workspace backend run dev   # http://localhost:4000
  npm --workspace frontend run dev  # http://localhost:3000
   ```
5. **Seed demo data** with `npm run api:seed` from the repository root. The current seed uses Prisma and SQLite-compatible schema data so every dashboard has something to show on first load.
6. **Build role dashboards** in the order: Farmer → Buyer → Transporter → Storage → Government (Farmer is your strongest demo moment — the NLP listing input — so get it solid first; Government is read-only and can be built last).
7. **Wire RBAC** via `backend/src/middleware/rbac.js` (Section 3) so the "storage can't touch price" claim is enforced in one place and easy to point judges to.
8. **Mock external calls** (SMS/WhatsApp, LLM if no API key) behind `backend/src/services/mocks/` so the demo works with zero external dependencies if network access is unreliable at the venue.

---

## 8. Deployment (separate backend/frontend, matching your plan)

- **Backend:** deploy the `backend/` folder as its own service — Render or Railway both support "point at a subfolder of the repo" deploys. Set `MONGODB_URI`, `FRONTEND_URL`, and any LLM key as environment variables on the host, not committed to git. Note the deployed backend URL (e.g. `https://directagri-api.onrender.com`).
- **Frontend:** deploy the `frontend/` folder separately on Vercel or Netlify (also supports subfolder builds — set "Root Directory" to `frontend`). Set `NEXT_PUBLIC_API_URL` to the deployed backend URL from above.
- **CORS:** make sure `FRONTEND_URL` on the backend matches the deployed frontend's actual origin, or API calls will be blocked in production even though they work on localhost.
- **MongoDB Atlas network access:** whitelist the backend host's IP (or `0.0.0.0/0` for a hackathon demo) so the deployed backend can actually reach the database.

## 9. Pre-Demo Checklist

- [x] Backend (`:4000`) and frontend (`:3000`) run independently and talk to each other via `NEXT_PUBLIC_API_URL`
- [x] Seed data loads automatically for the memory demo store so all 5 dashboards have data
- [x] Authentication boundary and role isolation are covered by automated API tests
- [x] At least one full order lifecycle works end-to-end: listing → aggregate → transport → storage check-in/out → escrow release
- [x] NLP listing parse works on 2–3 varied inputs, not just the happy-path sentence
- [x] Route optimizer uses a computed nearest-neighbor order, not a static placeholder
- [ ] Language toggle demonstrated live across a few of the 9 locales (English + top 8 Indian languages), not just one
- [x] At least one `QualityCheck` photo record is created at storage check-in and check-out
- [x] Government dashboard reads adoption stats + platform-vs-mandi price benchmark from seeded `PriceBenchmark` data
- [ ] Deployed backend and frontend (separate hosts) work together, not just localhost