# Nexvia Technologies — Full-Stack Internship Projects

This repository is a two-project monorepo for the Nexvia FS-02 and FS-01 assignments.

## Projects

### FS-02 — Real-time Collaborative Workspace

**Implemented in this codebase:** Next.js application shell, Yjs shared text document, WebSocket collaboration, online-user awareness/presence badges, minimal text-diff updates, and browser-local IndexedDB recovery. The WebSocket service is configured with LevelDB persistence for shared Yjs documents.

**Not yet implemented/verified:** user registration and login UI/API, workspace/document CRUD backed by Prisma, role-based permissions, shared comments, named version-history UI, rich-text TipTap/ProseMirror editor, and production multi-instance Redis coordination. The Prisma schema is a starting data model, not evidence that these workflows are complete.

### FS-01 — Multi-vendor E-Commerce Marketplace

**Implemented in this codebase:** React storefront, product search/category filters/sorting, cart quantity management, customer/vendor registration and login, vendor product listing/archiving, order creation, stock reservation, order history, demo-payment status, reviews after demo purchase, coupon validation endpoint, vendor order listing, and admin metrics endpoint.

**Not yet implemented/verified:** Elasticsearch integration (search currently uses MongoDB text indexes), Redis caching, authenticated AWS S3 uploads, Razorpay/Stripe Connect split-payment integration, commission ledger/payouts, PDF invoices, and full admin dashboard UI. The `pay-demo` endpoint is a simulation and is not a payment gateway.

## Requirements

- Node.js 20 or newer and npm 10+
- Docker Desktop (recommended for local databases)
- PostgreSQL 15+ and MongoDB 7+
- Redis 7+ (included in Docker Compose; application caching is not yet wired)

## Start local databases

From this repository root:

```bash
docker compose up -d
```

## Run FS-02

```bash
cd FS-02-collaborative-workspace
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev
```

In a second terminal:

```bash
cd FS-02-collaborative-workspace
npm run ws
```

Open `http://localhost:3000/workspace/demo`. Open the same room in a second browser/profile to try live collaboration. The Next.js app and WebSocket server are separate processes and must both be running.

## Run FS-01

Terminal 1 — API:

```bash
cd FS-01-ecommerce-marketplace/server
cp ../.env.example .env
npm install
npm run seed
npm run dev
```

Terminal 2 — frontend:

```bash
cd FS-01-ecommerce-marketplace/client
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. Demo vendor created by the seed script: `seller@nexvia.demo` / `SellerDemo123!`. Change or remove this demo account before any public deployment. Seeded catalogue images are remote Unsplash URLs.

## Environment variables

Never commit `.env` files or real credentials. Replace all development secrets before deployment. See each `.env.example` file.

## Repository map

```text
FS-02-collaborative-workspace/  Next.js + Yjs + Prisma + WebSocket service
FS-01-ecommerce-marketplace/    React/Vite storefront + Express/MongoDB API
architecture/                   Architecture notes for both projects
TEST-PLAN.md                    Manual acceptance test plan
```

## Build and verification status

The source files have been prepared, and the FS-01 Express server files pass Node's syntax checks. Dependency installation timed out in this environment, so a complete dependency-resolved production build, database-backed test run, and browser end-to-end test have **not** been completed. Follow `TEST-PLAN.md` before claiming a verified production-ready submission.

## Deployment topology

- FS-02: deploy the Next.js web app and the persistent Yjs WebSocket service as separate services; configure `NEXT_PUBLIC_WS_URL` to the public `wss://` endpoint. Configure PostgreSQL before enabling Prisma-backed features.
- FS-01: deploy the Vite client as a static site and the Express API as a Node service; attach MongoDB and set `VITE_API_URL`, `CLIENT_URL`, `MONGO_URI`, and a strong `JWT_SECRET`.

See `DEPLOYMENT.md` for the deployment checklist and service environment configuration.
