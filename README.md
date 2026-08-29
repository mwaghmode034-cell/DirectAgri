# DirectAgri

## Team

**Team Name:** CodeDev's

**Team Members:**
- Mahesh
- Shrevan
- Shreyash
- Sundram
- Shubham
- Akanksha

DirectAgri is a smart agricultural marketplace designed to reduce middlemen exploitation and bring transparency to the farm-to-market supply chain. It connects farmers, buyers, transporters, storage partners, and government stakeholders in a single digital ecosystem.

The platform focuses on one big idea: empower farmers with better pricing, more visibility, and direct market access while making logistics, storage, and procurement more efficient and trustworthy.


## Why this project exists

India’s agriculture ecosystem is often affected by:

- low farmer income due to intermediaries
- price uncertainty and delayed payments
- poor logistics coordination
- limited storage and quality visibility
- fragmented government oversight

DirectAgri addresses these problems by creating a digital marketplace with role-based access, market forecasting, route optimization, storage tracking, and escrow-style order settlement.


## Product vision

DirectAgri acts like a digital agriculture network where each stakeholder has a clear role:

- Farmers list produce and retain control of their inventory
- Buyers inspect listings and place bids or bulk orders
- Transporters accept optimized delivery jobs
- Storage partners record quality and inventory movement
- Government monitors performance, adoption, and demand trends

This creates a more transparent, faster, and fairer agricultural commerce system.


## Key features

### 1. Farmer dashboard

Farmers can:

- post crop listings using natural language input
- automatically parse crop details like quantity, crop type, and price
- choose between direct sale or godown storage
- estimate transport and storage costs
- see demand forecast trends for crops
- manage inventory and product status

### 2. Buyer dashboard

Buyers can:

- browse available batches
- place offers on specific crop lots
- aggregate multiple batches into one order
- create purchase orders with escrow-style protection
- release payments after quality and delivery are verified

### 3. Transporter dashboard

Transporters can:

- accept delivery assignments
- view route optimization suggestions
- access delivery tasks based on nearby batches
- handle trip execution in a structured workflow

### 4. Storage dashboard

Storage partners can:

- check in harvested batches
- record quality grading and visual evidence
- check out inventory when needed
- update batch movement status while preserving ownership rules

### 5. Government dashboard

Government stakeholders can:

- view adoption metrics
- see district/crop activity overview
- monitor audit logs and transaction flow
- inspect public market benchmarks and demand signals

### 6. Market forecast module

The app includes price and demand forecasting using benchmark data to help users understand crop demand trends. This gives farmers better planning insight and helps buyers estimate procurement opportunities.

### 7. Role-based access control (RBAC)

Every user role has controlled permissions. For example:

- Farmers can list and price crops
- Buyers cannot create crop listings
- Storage users cannot change crop pricing
- Transporters only get logistics-related actions

This keeps the ecosystem fair and prevents misuse.

### 8. Security and audit trail

The app stores actions in audit logs to maintain accountability. This is essential for trust in agricultural trade and in government oversight workflows.


## Tech stack

### Frontend

- Next.js
- React
- Tailwind CSS
- Recharts for graphs and analytics
- Lucide icons for UI polish

### Backend

- Node.js
- Express
- MongoDB
- JWT for authentication
- Zod for validation
- Nodemailer for email-based reset flows
- Twilio for optional SMS workflows

### AI / NLP layer

- Gemini API integrated optionally
- Rule-based fallback parser for local/offline functioning


## Architecture overview

The project is structured into two major workspaces:

- frontend: user interface and role dashboards
- backend: API server, business logic, auth, DB access, and forecasting endpoints

The system is designed so the frontend and backend can work independently and be deployed separately.


## Project structure

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
│   │   ├── middleware/
│   │   └── ...
│   └── test/
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── public/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── ...
└── node_modules/
```


## How the platform works

### 1. User registration and login

Users sign up with a role such as farmer, buyer, transporter, storage, or government. The backend validates their identity, creates a JWT token, and stores user details.

### 2. Crop listing process

A farmer writes a listing like:

> 2 tons onion at rate 28

The system parses it using NLP or fallback logic and converts it into a structured crop batch record.

### 3. Buyer order flow

A buyer selects one or more crop batches, places an order, and escrow is created. This ensures payment stays protected until delivery and quality checks are satisfied.

### 4. Logistics and delivery

The transporter accepts assigned jobs and uses route optimization to minimize overall travel time and distance.

### 5. Storage and quality checks

Storage providers check inventory in and out, maintain quality records, and ensure product conditions are tracked.

### 6. Government monitoring

The government dashboard reads the same marketplace activity to measure adoption, price signals, and operational performance.


## Demo roles and credentials

The project includes demo users for easy testing.

| Role | Email | Password |
|------|-------|----------|
| Farmer | farmer@directagri.dev | demo1234 |
| Buyer | buyer@directagri.dev | demo1234 |
| Transporter | transporter@directagri.dev | demo1234 |
| Storage | storage@directagri.dev | demo1234 |
| Government | government@directagri.dev | demo1234 |

These demo accounts are created automatically when the backend starts in dev mode.


## Environment setup

### 1. Install dependencies

From the project root:

```bash
npm install
```

### 2. Start the backend

```bash
cd DirectAgri/backend
npm install
npm run dev
```

The backend runs at:

- http://localhost:4000

### 3. Start the frontend

```bash
cd DirectAgri/frontend
npm install
npm run dev
```

The web app runs at:

- http://localhost:3000


## Important environment variables

Create a `.env` file in the backend with values similar to:

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

For Gmail, use an app password instead of your normal password.


## API behaviour

The backend exposes endpoints for:

- authentication (signup, login, forgot password, reset password)
- crop batch listing creation and updates
- NLP parsing for product input
- price forecast retrieval
- route optimization
- order aggregation
- transporter assignment
- storage check-in/out
- government stats and audit inspection

These APIs are role-protected and validate data before processing.


## Testing

The backend includes automated tests for major flows, including:

- health endpoint
- NLP parsing
- role enforcement
- crop listing lifecycle
- order, storage, and payment workflows

Run tests with:

```bash
cd DirectAgri/backend
npm test
```

To validate frontend build quality:

```bash
cd DirectAgri/frontend
npm run build
```


## Current strengths of the project

- complete multi-role digital ecosystem
- realistic agricultural workflow design
- market intelligence with forecast charts
- role-based permissions and audit safety
- scalable architecture for future production deployment
- multilingual UI support for broader rural adoption


## MVP and future roadmap

### Completed in the current version

- multi-role dashboards
- crop listing flow
- buyer order aggregation
- route optimization
- storage quality tracking
- government metrics panel
- NLP-based crop parsing
- auth and forgot-password flow

### Future improvements

- real payment gateway integration
- production-grade SMS/WhatsApp delivery
- stronger investor-grade analytics
- full deployment on separate cloud hosts
- mobile-first PWA enhancements
- deeper AI-based crop quality analysis


## Why DirectAgri matters

DirectAgri is more than just a demo website. It represents a practical solution to a real agricultural problem: making the produce supply chain more transparent, fair, and efficient.

By reducing middlemen dependency and enabling direct coordination between farmers and market participants, the system helps improve:

- farmer income
- buyer trust
- logistics efficiency
- storage quality visibility
- government oversight


## Team

Developed as part of SIH 2026 with the goal of building a meaningful agricultural innovation prototype.


## License

This project is built for academic and hackathon use under its current repository rules.


## Quick start summary

```bash
cd DirectAgri
npm install

cd backend
npm install
npm run dev

cd ../frontend
npm install
npm run dev
```

Then open:

- http://localhost:3000


## Final note

DirectAgri is designed to show how digital agriculture can move from fragmented, trustless transactions to an integrated and transparent system. It is a strong prototype for showcasing how technology can improve value distribution in the agricultural supply chain.
