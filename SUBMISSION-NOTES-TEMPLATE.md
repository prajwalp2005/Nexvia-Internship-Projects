# Reviewer Notes — Nexvia Internship Projects

> Replace this template with the verified facts from your final hosted deployment. Do not claim a feature is complete unless you have tested it.

## Projects

- **FS-02 — Real-Time Collaborative Workspace:** Next.js application shell, Yjs CRDT shared text editing, WebSocket synchronization, awareness-based participant presence, browser-local IndexedDB recovery, and LevelDB server persistence configuration.
- **FS-01 — Multi-Vendor E-Commerce Marketplace:** React/Vite storefront, Express/MongoDB API, JWT customer/vendor authentication, product discovery, seller listings, cart, order history, stock reservation, reviews, coupon validation endpoint, and admin metrics endpoint.

## URLs

- Public GitHub repository: [PASTE PUBLIC REPOSITORY URL]
- FS-02 deployment: [PASTE VERIFIED LIVE URL]
- FS-01 storefront deployment: [PASTE VERIFIED LIVE URL]
- FS-01 API health endpoint: [PASTE VERIFIED API URL]/api/health
- Supporting documents (optional): [PASTE GOOGLE DRIVE FOLDER URL]
- Demo recording: [PASTE RECORDING URL]

## Verification evidence

- Browser/device tested: [FILL AFTER TESTING]
- Build result: [FILL ACTUAL RESULT]
- API test result: [FILL ACTUAL RESULT]
- Collaboration test in two browsers: [FILL ACTUAL RESULT]
- Screenshots / test report: [LINK]

## Known implementation boundaries

The current implementation is a development foundation and must not be described as a complete production implementation of every requested integration. FS-02 still needs rich-text editing, account/workspace APIs, permissions, comments, and version-history workflows. FS-01 still needs Elasticsearch, Redis caching, S3 upload, real Razorpay/Stripe Connect test-mode integration and commission accounting, PDF invoices, and a complete admin UI. The order payment demo is a simulation only and does not charge money.

## Architecture and setup

See `README.md`, `DEPLOYMENT.md`, `TEST-PLAN.md`, and the two files under `architecture/` for setup instructions, service topology, API routes, and acceptance tests.
