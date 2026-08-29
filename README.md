# 🌾 DirectAgri

**A role-based agricultural marketplace that cuts out middlemen and brings transparency to India's farm-to-market supply chain.**

Built for **SIH 2026** by **Team CodeDev's**

[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white)](#)
[![Next.js](https://img.shields.io/badge/Next.js-Frontend-000000?logo=next.js&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-Academic%2FHackathon-blue)](#license)

---

## Team

- Mahesh
- Shrevan
- Shreyash
- Sundram
- Shubham
- Akanksha

---

## The Problem

India's agriculture supply chain loses value at every handoff:

| Problem | Impact |
|---|---|
| Middlemen-heavy chain | Farmers capture a fraction of end market price |
| Price uncertainty | Delayed, unpredictable payments |
| Poor logistics coordination | Wasted produce, inefficient routes |
| Limited storage/quality visibility | Spoilage, disputes over quality |
| Fragmented oversight | No unified data for policy or intervention |

## The Solution

DirectAgri connects **five stakeholders** — Farmers, Buyers, Transporters, Storage Partners, and Government — in one digital ecosystem with role-based dashboards, AI-assisted listing, escrow-protected orders, and route optimization.

```
   FARMER  →  lists crop batch (NLP input)
      │
      ▼
   BUYER   →  bids / bulk order → escrow created
      │
      ▼
TRANSPORTER →  optimized delivery route
      │
      ▼
  STORAGE   →  quality check-in/out, inventory tracking
      │
      ▼
GOVERNMENT  →  reads all activity for oversight & benchmarks
```

---

## Core Features

### 👨‍🌾 Farmer Dashboard
- Natural-language crop listing (e.g. *"2 tons onion at rate 28"* → structured batch record)
- Choice of direct sale or godown storage
- Transport/storage cost estimates + demand forecast charts
- Inventory & listing status management

### 🛒 Buyer Dashboard
- Browse batches, place offers, aggregate multiple lots into one order
- Escrow-protected purchase orders — payment releases only after quality + delivery verification

### 🚚 Transporter Dashboard
- Accept delivery jobs, view route-optimized suggestions, execute trips in a structured workflow

### 🏬 Storage Dashboard
- Check batches in/out, record quality grading with visual evidence, track movement without breaking ownership rules

### 🏛️ Government Dashboard
- Adoption metrics, district/crop activity overview, audit logs, market benchmarks

### 🧠 Market Forecast Module
Price & demand forecasting from benchmark data — helps farmers plan and buyers time procurement.

### 🔐 Role-Based Access Control
Every action is permission-gated (e.g. only Farmers price crops; Storage users can't touch pricing).

### 📋 Audit Trail
All key actions are logged for accountability — critical for trust in agri-trade and government use.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js, React, Tailwind CSS, Recharts, Lucide Icons |
| **Backend** | Node.js, Express, MongoDB, JWT, Zod, Nodemailer, Twilio |
| **AI/NLP** | Gemini API (optional) with rule-based offline fallback parser |

---

## Project Structure

```text
DirectAgri/
├── README.md
├── package.json
├── DirectAgri_Build_Documentation.md
├── DirectAgri_Ecosystem_Architecture_v2.md
├── backend/
│   ├── .env
│   ├── package.json
│   ├── src/
│   │   ├── server.js
│   │   ├── config/
│   │   ├── lib/
│   │   └── middleware/
│   └── test/
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── public/
    └── src/
        ├── app/
        ├── components/
        └── lib/
```

---

## Getting Started

### 1. Clone & install root dependencies
```bash
cd DirectAgri
npm install
```

### 2. Start the backend
```bash
cd backend
npm install
npm run dev
```
Runs at **http://localhost:4000**

### 3. Start the frontend
```bash
cd ../frontend
npm install
npm run dev
```
Runs at **http://localhost:3000**

### Environment Variables

Create `backend/.env`:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=directagri
JWT_SECRET=your_secret_key
PORT=4000
WEB_ORIGIN=http://localhost:3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=your_email@gmail.com

GEMINI_API_KEY=your_optional_key
GEMINI_MODEL=gemini-2.5-flash
```
> For Gmail, use an **App Password**, not your normal password.

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Farmer | farmer@directagri.dev | demo1234 |
| Buyer | buyer@directagri.dev | demo1234 |
| Transporter | transporter@directagri.dev | demo1234 |
| Storage | storage@directagri.dev | demo1234 |
| Government | government@directagri.dev | demo1234 |

Created automatically when the backend starts in dev mode.

---

## Testing

```bash
# Backend tests — health, NLP parsing, RBAC, listing lifecycle, order/storage/payment flows
cd backend
npm test

# Frontend build check
cd ../frontend
npm run build
```

---

## Roadmap

**✅ Completed**
- Multi-role dashboards · Crop listing flow · Buyer order aggregation
- Route optimization · Storage quality tracking · Government metrics panel
- NLP-based crop parsing · Auth + forgot-password flow

**🔜 Planned**
- Real payment gateway integration
- Production-grade SMS/WhatsApp delivery
- Investor-grade analytics
- Full multi-cloud deployment
- Mobile-first PWA
- AI-based crop quality analysis (image-based grading)

---

## Why It Matters

DirectAgri isn't just a hackathon demo — it's a working model of how digital infrastructure can shift value back toward farmers by removing opaque intermediaries, protecting payments via escrow, and giving every stakeholder (down to the government) a shared source of truth.

---

## License

Built for academic and hackathon (SIH 2026) use. *(Consider adding an explicit license — e.g. MIT — if you plan to open-source or extend this beyond the hackathon.)*
