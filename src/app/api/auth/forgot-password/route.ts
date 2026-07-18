import { NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import otpGenerator from "@/utils/otpGenerator";
import User from "@/lib/models/User";
import sendMail from "@/utils/email/send";
import emailVerificationOtp from "@/utils/email/templates/email-verification-otp";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }
    await connectMongodb();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const otp = otpGenerator(6);
    user.passwordReset.otp.code = otp;
    user.passwordReset.expireAt = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendMail({
      to: email,
      subject: "Password reset OTP",
      htmlTemplate: emailVerificationOtp(Number(otp)),
    });

    return NextResponse.json(
      { success: true, message: "Password reset OTP sent" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to send password reset OTP", error },
      { status: 500 },
    );
  }
}
