import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { User, Product, Order, Review, Coupon } from "./models.js";
import { requireAuth, allowRoles } from "./auth.js";

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: (process.env.CLIENT_URL || "http://localhost:5173").split(","), credentials: false }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("tiny"));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
const signToken = user => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
const publicUser = user => ({ id: user.id, name: user.name, email: user.email, role: user.role });
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/api/health", (_, res) => res.json({ ok: true, service: "marketplace-api", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const data = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email(), password: z.string().min(8).max(128), role: z.enum(["customer", "vendor"]).default("customer") }).parse(req.body);
  const email = data.email.toLowerCase();
  if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered" });
  const user = await User.create({ name: data.name, email, passwordHash: await bcrypt.hash(data.password, 12), role: data.role });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));
app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(String(req.body.password || ""), user.passwordHash)) return res.status(401).json({ message: "Invalid email or password" });
  res.json({ token: signToken(user), user: publicUser(user) });
}));
app.get("/api/auth/me", requireAuth, asyncRoute(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.sendStatus(404);
  res.json(publicUser(user));
}));

app.get("/api/products", asyncRoute(async (req, res) => {
  const filter = { active: true };
  if (req.query.category && req.query.category !== "all") filter.category = String(req.query.category);
  if (req.query.q) filter.$text = { $search: String(req.query.q).slice(0, 100) };
  if (req.query.minPrice || req.query.maxPrice) filter.price = { ...(req.query.minPrice ? { $gte: Math.max(0, Number(req.query.minPrice)) } : {}), ...(req.query.maxPrice ? { $lte: Math.max(0, Number(req.query.maxPrice)) } : {}) };
  const sortMap = { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 }, name: { title: 1 } };
  const products = await Product.find(filter).populate("vendor", "name").sort(sortMap[req.query.sort] || sortMap.newest).limit(100).lean();
  res.json(products);
}));
app.get("/api/products/:id", asyncRoute(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, active: true }).populate("vendor", "name");
  if (!product) return res.sendStatus(404);
  res.json(product);
}));
const productSchema = z.object({ title: z.string().trim().min(2).max(120), description: z.string().max(3000).optional(), price: z.number().positive().max(10000000), category: z.string().trim().max(60).optional(), imageUrl: z.string().url().optional().or(z.literal("")), stock: z.number().int().min(0).max(100000).default(0) });
app.post("/api/products", requireAuth, allowRoles("vendor", "admin"), asyncRoute(async (req, res) => {
  const data = productSchema.parse(req.body);
  res.status(201).json(await Product.create({ ...data, vendor: req.user.id }));
}));
app.patch("/api/products/:id", requireAuth, allowRoles("vendor", "admin"), asyncRoute(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.sendStatus(404);
  if (req.user.role !== "admin" && String(p.vendor) !== req.user.id) return res.sendStatus(403);
  const allowed = productSchema.partial().extend({ active: z.boolean().optional() }).parse(req.body);
  Object.assign(p, allowed); await p.save(); res.json(p);
}));
app.delete("/api/products/:id", requireAuth, allowRoles("vendor", "admin"), asyncRoute(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.sendStatus(404);
  if (req.user.role !== "admin" && String(p.vendor) !== req.user.id) return res.sendStatus(403);
  p.active = false; await p.save(); res.json({ message: "Product archived" });
}));
app.get("/api/vendor/products", requireAuth, allowRoles("vendor", "admin"), asyncRoute(async (req, res) => res.json(await Product.find(req.user.role === "admin" ? {} : { vendor: req.user.id }).sort({ createdAt: -1 }))));
app.get("/api/vendor/orders", requireAuth, allowRoles("vendor", "admin"), asyncRoute(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { "items.vendor": req.user.id };
  res.json(await Order.find(filter).populate("customer", "name email").sort({ createdAt: -1 }).limit(100));
}));

app.post("/api/orders", requireAuth, asyncRoute(async (req, res) => {
  const lines = z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(50) })).min(1).max(50).parse(req.body.items);
  const quantities = new Map();
  for (const line of lines) quantities.set(line.productId, (quantities.get(line.productId) || 0) + line.quantity);
  const ids = [...quantities.keys()];
  if (ids.some(id => !mongoose.isValidObjectId(id))) return res.status(400).json({ message: "Invalid product ID" });
  const products = await Product.find({ _id: { $in: ids }, active: true });
  if (products.length !== ids.length) return res.status(400).json({ message: "One or more products are unavailable" });
  const items = products.map(p => ({ product: p._id, vendor: p.vendor, title: p.title, quantity: quantities.get(String(p._id)), unitPrice: p.price }));
  for (const item of items) if (products.find(p => String(p._id) === String(item.product)).stock < item.quantity) return res.status(409).json({ message: `Insufficient stock for ${item.title}` });
  // Atomically reserve each line's stock. Roll back earlier reservations if any line fails.
  const reserved = [];
  try {
    for (const item of items) {
      const result = await Product.updateOne({ _id: item.product, active: true, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } });
      if (result.modifiedCount !== 1) throw new Error(`Insufficient stock for ${item.title}`);
      reserved.push(item);
    }
    const total = Number(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2));
    const order = await Order.create({ customer: req.user.id, items, total, paymentStatus: "pending" });
    res.status(201).json({ order, notice: "Demo order created. Use the demo payment action to mark it as test-paid; no real money is processed." });
  } catch (error) {
    if (reserved.length) await Promise.all(reserved.map(item => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })));
    throw error;
  }
}));
app.get("/api/orders/mine", requireAuth, asyncRoute(async (req, res) => res.json(await Order.find({ customer: req.user.id }).sort({ createdAt: -1 }))));
app.post("/api/orders/:id/pay-demo", requireAuth, asyncRoute(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user.id });
  if (!order) return res.sendStatus(404);
  if (order.status === "cancelled") return res.status(409).json({ message: "Cancelled orders cannot be paid" });
  if (order.paymentStatus !== "pending") return res.status(409).json({ message: "Order is not awaiting payment" });
  order.paymentStatus = "test-paid"; await order.save();
  res.json({ order, notice: "Demo payment recorded. This is not a real payment-provider transaction." });
}));
app.patch("/api/orders/:id/status", requireAuth, allowRoles("vendor", "admin"), asyncRoute(async (req, res) => {
  const order = await Order.findById(req.params.id); if (!order) return res.sendStatus(404);
  if (req.user.role !== "admin" && !order.items.some(i => String(i.vendor) === req.user.id)) return res.sendStatus(403);
  const status = z.enum(["placed", "packed", "shipped", "delivered", "cancelled"]).parse(req.body.status);
  const transitions = { placed: ["packed", "cancelled"], packed: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [] };
  if (!transitions[order.status]?.includes(status) && req.user.role !== "admin") return res.status(409).json({ message: `Cannot change ${order.status} to ${status}` });
  order.status = status; await order.save(); res.json(order);
}));
app.post("/api/products/:id/reviews", requireAuth, asyncRoute(async (req, res) => {
  const rating = z.number().int().min(1).max(5).parse(req.body.rating);
  const product = await Product.findOne({ _id: req.params.id, active: true }); if (!product) return res.sendStatus(404);
  const purchased = await Order.exists({ customer: req.user.id, paymentStatus: "test-paid", "items.product": product._id });
  if (!purchased) return res.status(403).json({ message: "Only customers with a completed demo purchase can review this product" });
  const review = await Review.findOneAndUpdate({ product: product._id, user: req.user.id }, { rating, comment: String(req.body.comment || "").slice(0, 1000) }, { upsert: true, new: true, runValidators: true });
  res.status(201).json(review);
}));
app.get("/api/products/:id/reviews", asyncRoute(async (req, res) => res.json(await Review.find({ product: req.params.id }).populate("user", "name").sort({ createdAt: -1 }))));
app.post("/api/coupons/validate", asyncRoute(async (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();
  const c = await Coupon.findOne({ code, active: true });
  if (!c || (c.expiresAt && c.expiresAt < new Date())) return res.status(404).json({ message: "Coupon is invalid or expired" });
  res.json({ code: c.code, percent: c.percent });
}));
app.get("/api/admin/metrics", requireAuth, allowRoles("admin"), asyncRoute(async (_, res) => {
  const [users, products, orders, revenue, statuses] = await Promise.all([User.countDocuments(), Product.countDocuments(), Order.countDocuments(), Order.aggregate([{ $match: { paymentStatus: "test-paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }]), Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])]);
  res.json({ users, products, orders, testRevenue: revenue[0]?.total || 0, orderStatuses: statuses });
}));

app.use((err, _req, res, _next) => {
  if (err instanceof z.ZodError) return res.status(400).json({ message: "Validation failed", errors: err.issues.map(x => ({ path: x.path.join("."), message: x.message })) });
  if (err?.code === 11000) return res.status(409).json({ message: "A record with that value already exists" });
  console.error(err);
  res.status(500).json({ message: "Unexpected server error" });
});
const port = Number(process.env.PORT || 5000);
await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nexvia_marketplace");
app.listen(port, () => console.log(`Marketplace API running on :${port}`));
