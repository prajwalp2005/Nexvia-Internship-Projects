# Marketplace API reference

Base URL: `http://localhost:5000/api`

Send `Authorization: Bearer <JWT>` for protected routes. JSON request bodies use `Content-Type: application/json`.

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | API and MongoDB health |
| POST | `/auth/register` | Public | Create customer or vendor account |
| POST | `/auth/login` | Public | Login and receive JWT |
| GET | `/auth/me` | Signed in | Current account |
| GET | `/products` | Public | Search, category filter, price range, sort |
| GET | `/products/:id` | Public | Product detail |
| POST | `/products` | Vendor/admin | Create product |
| PATCH | `/products/:id` | Owner/admin | Update allowed product fields |
| DELETE | `/products/:id` | Owner/admin | Archive product |
| GET | `/vendor/products` | Vendor/admin | Seller listings |
| GET | `/vendor/orders` | Vendor/admin | Orders containing seller products |
| POST | `/orders` | Customer | Create order and reserve stock |
| GET | `/orders/mine` | Customer | Customer order history |
| POST | `/orders/:id/pay-demo` | Order owner | Mark as simulated test-paid |
| PATCH | `/orders/:id/status` | Vendor/admin | Advance fulfilment state |
| GET | `/products/:id/reviews` | Public | Product reviews |
| POST | `/products/:id/reviews` | Purchased customer | Add/update review |
| POST | `/coupons/validate` | Public | Validate coupon code |
| GET | `/admin/metrics` | Admin | Platform metrics |

## Search and sorting
`GET /products?q=mug&category=Home&minPrice=100&maxPrice=1000&sort=price_asc`

Supported `sort`: `newest`, `price_asc`, `price_desc`, `name`.

## Important demo boundaries
- The `pay-demo` route only changes an order's demo payment status. It does not contact Razorpay or Stripe and must not be represented as a real payment integration.
- Product search currently uses MongoDB text indexes. Elasticsearch is not wired into this API yet.
- Image URLs are accepted for catalogue display; an authenticated S3 upload flow is not included yet.
- Redis is included in local infrastructure but application-level caching is not enabled yet.
