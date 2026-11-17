# Deployment checklist

The projects require multiple services. A single frontend deployment URL cannot host every backend process.

## FS-02 deployment topology

1. Provision managed PostgreSQL and set `DATABASE_URL` on the Next.js service.
2. Deploy `FS-02-collaborative-workspace` as a Node/Next.js web service. Build: `npm ci && npx prisma generate && npm run build`; start: `npm start`.
3. Deploy a second Node service from the same folder for the Yjs WebSocket process. Build/install dependencies and start with `npm run ws`. Attach persistent disk storage and set `YJS_DATA_DIR` to its mounted path.
4. Set `PORT` to the platform-provided port for the WebSocket service. Configure the WebSocket service for public secure WebSockets (`wss://`).
5. Set `NEXT_PUBLIC_WS_URL=wss://<your-websocket-host>` in the Next.js build environment and redeploy the frontend.
6. Verify two separate browsers can edit the same room and that reconnecting restores persisted Yjs state.

The current app does not yet wire the Prisma schema into user/workspace/comment/version APIs. Do not advertise those features as implemented until completed.

## FS-01 deployment topology

1. Provision MongoDB Atlas and allow the API service to connect.
2. Deploy `FS-01-ecommerce-marketplace/server` as a Node service. Build/install: `npm ci`; start: `npm start`.
3. Set `MONGO_URI`, a long random `JWT_SECRET`, `CLIENT_URL` to the deployed frontend origin, and `PORT` if required by the host.
4. Deploy `FS-01-ecommerce-marketplace/client` as a static Vite site. Build: `npm ci && npm run build`; output directory: `dist`.
5. Set `VITE_API_URL=https://<your-api-host>/api` at frontend build time, then rebuild/redeploy.
6. Seed sample products from a trusted local/admin environment if desired. Do not expose the seed script as a public endpoint.
7. Verify registration, vendor ownership restrictions, product search, stock reservation, order history, and demo-payment messaging in an incognito browser.

## Before sharing public URLs

- Replace every placeholder secret; never publish database credentials or JWT secrets.
- Configure HTTPS, CORS allowlists, rate limits, database backups, and service health checks.
- Remove or rotate demo credentials and seed accounts.
- Verify all URLs in a signed-out/incognito browser.
- Record a screen demonstration and attach screenshots, test results, architecture diagrams, and a short presentation.
- A deployment URL is not proof that external integrations work. Verify each required integration independently.
