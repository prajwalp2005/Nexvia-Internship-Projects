import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET must be configured with at least 32 characters");
  return new TextEncoder().encode(value);
}
export async function hashPassword(password: string) { return bcrypt.hash(password, 12); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }
export async function createToken(userId: string) {
  return new SignJWT({ sub: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
}
export async function readToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return typeof payload.sub === "string" ? payload.sub : null;
}
