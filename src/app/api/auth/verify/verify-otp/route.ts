import { NextRequest, NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 },
      );
    }
    await connectMongodb();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    if (user.verify.status) {
      return NextResponse.json(
        { message: "User already verified" },
        { status: 400 },
      );
    }
    if (user.verify.otp.code !== otp) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }
    if (user.verify.otp.expireAt < Date.now()) {
      return NextResponse.json({ message: "OTP expired" }, { status: 400 });
    }
    user.verify.status = true;
    user.verify.otp.code = null;
    user.verify.otp.expireAt = null;
    await user.save();
    return NextResponse.json(
      {
        verify: {
          status: true,
        },
        message: "Email verified successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error, "error in verify email");
    return NextResponse.json(
      { message: "Error in verifying email" },
      { status: 500 },
    );
  }
}
