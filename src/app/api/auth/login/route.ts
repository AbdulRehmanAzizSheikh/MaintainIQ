import { NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import { cookies } from "next/headers";
import User from "@/lib/models/User";
import { generateToken } from "@/utils/jwt";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { message: "All fields are required!" },
        { status: 400 },
      );
    }

    await connectMongodb();

    // Case-insensitive email lookup
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
    });

    if (!user) {
      return NextResponse.json(
        { message: "No account found with this email." },
        { status: 401 },
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Incorrect password." },
        { status: 401 },
      );
    }

    if (!user.verify?.status) {
      return NextResponse.json(
        {
          message: "Verify your email before login.",
          verifyRequired: true,
          email: user.email,
        },
        { status: 403 },
      );
    }

    // Generate JWT with 1h expiry and session start for refresh logic
    const token = generateToken(
      { id: user._id.toString(), sessionStart: Date.now() },
      60 * 60,
    );

    // Set cookie — httpOnly so JS can't read it, but token itself expires in 1 hour
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      maxAge: 24 * 60 * 60, // 24 hours cookie retention
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Login successful!",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    return NextResponse.json(
      { message: "Server error. Please try again." },
      { status: 500 },
    );
  }
}
