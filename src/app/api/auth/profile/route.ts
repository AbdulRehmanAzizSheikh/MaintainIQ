import { NextRequest, NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import User from "@/lib/models/User";
import { getCurrentUser } from "@/utils/getUser";
import bcrypt from "bcrypt";

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectMongodb();
    const user = await User.findById(sessionUser._id);
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.username = body.name;
    }
    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl;
    }
    if (body.currentPassword || body.newPassword) {
      if (!body.currentPassword || !body.newPassword) {
        return NextResponse.json(
          { message: "Current and new password are required" },
          { status: 400 },
        );
      }
      const isMatch = await bcrypt.compare(body.currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { message: "Current password is incorrect" },
          { status: 401 },
        );
      }
      if (typeof body.newPassword !== "string" || body.newPassword.length < 8) {
        return NextResponse.json(
          { message: "New password must be at least 8 characters" },
          { status: 400 },
        );
      }
      updateData.password = await bcrypt.hash(body.newPassword, 11);
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
      new: true,
    }).select("-password -verify -passwordReset");
    if (!updatedUser)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json(
      { success: true, message: "Profile updated", user: updatedUser },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update profile", error },
      { status: 500 },
    );
  }
}
