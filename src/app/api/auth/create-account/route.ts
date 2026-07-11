import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import { connectMongodb } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const body = await req.json();

  const { username, email, password, role } = body;

  if (!username.trim() || !email.trim() || !password.trim())
    return NextResponse.json(
      { message: "All fields are required!" },
      { status: 400 },
    );

  try {
    await connectMongodb();

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { message: "Email already exists!" },
        { status: 400 },
      );
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists!" },
        { status: 400 },
      );
    }

    if (password.length < 8)
      return NextResponse.json(
        { message: "Password must be at least 8 characters long!" },
        { status: 400 },
      );

    const hashedPassword = await bcrypt.hash(password, 11);

    await User.create({ username, email, password: hashedPassword, role: role || "Reporter" });

    return NextResponse.json(
      { status: true, message: "User created successfully!" },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { status: false, message: "Error creating user!" },
      { status: 500 },
    );
  }
}
