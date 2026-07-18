import { NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import bcrypt from "bcrypt";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const { email, otp, password } = await req.json();
    if (!email || !otp || !password) {
      return NextResponse.json(
        { message: "Email, OTP, and password are required" },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    await connectMongodb();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    if (
      !user.passwordReset?.otp?.code ||
      user.passwordReset.expireAt < Date.now()
    ) {
      return NextResponse.json({ message: "OTP expired" }, { status: 400 });
    }
    if (user.passwordReset.otp.code !== otp) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    user.password = await bcrypt.hash(password, 11);
    user.passwordReset.otp.code = null;
    user.passwordReset.expireAt = null;
    await user.save();

    return NextResponse.json(
      { success: true, message: "Password reset successful" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to reset password", error },
      { status: 500 },
    );
  }
}
