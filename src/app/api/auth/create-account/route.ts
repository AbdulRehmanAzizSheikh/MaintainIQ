import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import { connectMongodb } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    if (!username?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { message: "All fields are required!" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long!" },
        { status: 400 },
      );
    }

    await connectMongodb();

    const existingEmail = await User.findOne({
      email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
    });
    if (existingEmail) {
      return NextResponse.json(
        { message: "This email is already registered." },
        { status: 400 },
      );
    }

    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${username.trim()}$`, "i") },
    });
    if (existingUsername) {
      return NextResponse.json(
        { message: "This username is already taken." },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 11);

    // ─── IMPORTANT ──────────────────────────────────────────────────────
    // Role is ALWAYS "Reporter" on registration — no matter what the
    // frontend sends.  Only an Administrator can upgrade a user's role
    // after account creation via /api/users/[id]/role  (PATCH).
    // ────────────────────────────────────────────────────────────────────
    await User.create({
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword,
      role: "Reporter",
    });

    return NextResponse.json(
      { success: true, message: "Account created successfully!" },
      { status: 201 },
    );
  } catch (error) {
    console.error("[CREATE-ACCOUNT ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Server error. Please try again." },
      { status: 500 },
    );
  }
}
