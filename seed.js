import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Product, Coupon } from "./models.js";

await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nexvia_marketplace");
const email = "seller@nexvia.demo";
let seller = await User.findOne({ email });
if (!seller) seller = await User.create({ name: "Nexvia Demo Store", email, passwordHash: await bcrypt.hash("SellerDemo123!", 12), role: "vendor" });
const samples = [
  { title: "Everyday Ceramic Mug", description: "A minimal ceramic mug for your daily coffee or tea.", price: 349, category: "Home", stock: 30, imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558f85b17?w=800" },
  { title: "Classic Canvas Tote", description: "A sturdy reusable tote for work, books and weekend errands.", price: 499, category: "Accessories", stock: 24, imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800" },
  { title: "Desk Plant Pot", description: "A compact planter to bring a little green to your workspace.", price: 279, category: "Home", stock: 18, imageUrl: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800" },
  { title: "Daily Journal", description: "A clean, undated notebook for ideas, plans and notes.", price: 229, category: "Stationery", stock: 40, imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800" }
];
for (const item of samples) await Product.updateOne({ vendor: seller._id, title: item.title }, { $setOnInsert: { ...item, vendor: seller._id, active: true } }, { upsert: true });
await Coupon.updateOne({ code: "WELCOME10" }, { $setOnInsert: { code: "WELCOME10", percent: 10, active: true } }, { upsert: true });
console.log("Demo catalogue seeded. Demo seller: seller@nexvia.demo / SellerDemo123!");
await mongoose.disconnect();
