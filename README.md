# DirectAgri

Hackathon-ready MVP for SIH26033: a four-node agricultural marketplace that lets farmers list crops, buyers aggregate orders, transporters accept optimized routes, storage partners record quality, and government users inspect impact metrics.

## Run locally

```bash
npm install
npm --workspace backend run dev   # Terminal 1: http://localhost:4000
npm --workspace frontend run dev  # Terminal 2: http://localhost:3000
```

Open `http://localhost:3000`.

## Verify locally

Run these commands from the `DirectAgri/` folder:

```bash
npm run api:test
npm run web:build
```

The backend test suite covers health, authentication boundaries, varied NLP parsing, RBAC isolation, and the complete listing-to-escrow lifecycle. Gemini is optional: set `GEMINI_API_KEY` in `backend/.env` for LLM extraction; without it, the local parser remains available.

## Demo Slice

- Farmer dashboard with WhatsApp-style crop listing parser and demand forecast.
- Buyer marketplace with smart aggregation and negotiation bids.
- Transporter route optimizer using nearest-neighbor sequencing.
- Storage check-in/out quality scoring stub.
- Government dashboard with adoption and mandi benchmark metrics.
