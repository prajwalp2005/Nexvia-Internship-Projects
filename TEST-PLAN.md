# Manual acceptance test plan

## FS-02 — Collaborative workspace
1. Start PostgreSQL, Redis, Next.js, and the WebSocket process.
2. Open `/workspace/demo` in two separate browser profiles.
3. Type in both windows and confirm both documents converge to the same text.
4. Confirm online participant badges appear in both windows and update when one window closes.
5. Refresh one browser and confirm local IndexedDB recovery restores its local document state.
6. Stop the WebSocket server and confirm the UI reports offline/reconnecting rather than claiming live sync.
7. Restart the WebSocket service and confirm clients reconnect.

## FS-01 — Marketplace
1. Start MongoDB and the API; run `npm run seed` from the server directory.
2. Browse products; search by title; filter by category; test each sort order.
3. Register a customer, add multiple quantities to cart, create an order, and inspect My orders.
4. Use demo payment and confirm the order displays `test-paid` with an explicit demo notice.
5. Register a vendor, create a listing, refresh the store, and archive the listing.
6. Attempt to edit another vendor's product and confirm the API returns 403.
7. Attempt an order quantity greater than stock and confirm the API returns 409 without reducing stock.
8. Test invalid login, invalid coupon, malformed product data, and unauthenticated protected routes.

## Before evaluator submission
- Run production builds and resolve all compiler/runtime errors.
- Test all flows against hosted databases, not only local services.
- Configure CORS, secrets, database backups, HTTPS, rate limits, and service health checks.
- Add screenshots, a short screen recording, test output, and an architecture diagram.
- Do not claim Elasticsearch, Redis caching, S3 uploads, Razorpay/Stripe Connect, or server-side document comments/version snapshots as complete until those integrations are implemented and tested.
