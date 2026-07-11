/**
 * MaintainIQ — Make Admin Script
 * ================================
 * Pehle Admin banana ka aasaan tarika:
 *
 *   node scripts/make-admin.mjs your@email.com
 *
 * Requirements:
 *   - .env file mein MONGODB_URI honi chahiye
 *   - Node.js 18+
 */

import mongoose from "mongoose";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env manually (no dotenv dependency needed) ──────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.error("❌  Could not read .env file. Make sure it exists.");
  process.exit(1);
}

// ── Args ──────────────────────────────────────────────────────────────────────
const targetEmail = process.argv[2];
if (!targetEmail) {
  console.error("Usage:  node scripts/make-admin.mjs <email>");
  console.error("Example: node scripts/make-admin.mjs admin@example.com");
  process.exit(1);
}

// ── Connect + update ──────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not found in .env");
  process.exit(1);
}

console.log(`\n🔗  Connecting to MongoDB…`);
await mongoose.connect(MONGODB_URI);
console.log("✅  Connected\n");

const UserSchema = new mongoose.Schema({ email: String, role: String }, { strict: false });
const User = mongoose.models.users || mongoose.model("users", UserSchema);

const user = await User.findOne({ email: { $regex: new RegExp(`^${targetEmail}$`, "i") } });

if (!user) {
  console.error(`❌  No user found with email: ${targetEmail}`);
  console.error("    Register an account first, then run this script.");
  await mongoose.disconnect();
  process.exit(1);
}

if (user.role === "Administrator") {
  console.log(`ℹ️   ${user.email} is already an Administrator. Nothing changed.`);
  await mongoose.disconnect();
  process.exit(0);
}

const previousRole = user.role;
user.role = "Administrator";
await user.save();

console.log(`✅  SUCCESS!`);
console.log(`    User  : ${user.email}`);
console.log(`    Before: ${previousRole}`);
console.log(`    After : Administrator`);
console.log(`\n    That user can now log in and access the User Management panel.`);
console.log(`    They can assign Supervisor / Technician roles to other users from there.\n`);

await mongoose.disconnect();
