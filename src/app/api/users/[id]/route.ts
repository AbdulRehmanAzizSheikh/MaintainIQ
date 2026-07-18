import { NextRequest, NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import User from "@/lib/models/User";
import { getCurrentUser } from "@/utils/getUser";
import sendMail from "@/utils/email/send";
import roleAssignedEmail from "@/utils/email/templates/role-assigned";

// GET /api/users/[id] — get a single user (Admin / Supervisor only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (!["Administrator", "Supervisor"].includes(currentUser.role))
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await connectMongodb();
    const { id } = await params;
    const user = await User.findById(id).select("-password -verify");
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error },
      { status: 500 },
    );
  }
}

// PATCH /api/users/[id] — update a user's role
// Rules:
//   • Only Administrator can change roles
//   • Can only assign: Supervisor | Technician | Reporter
//   • Cannot assign Administrator role (must be done directly in DB)
//   • Cannot change own role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Only Administrators can change roles
    if (currentUser.role !== "Administrator") {
      return NextResponse.json(
        { message: "Only Administrators can change user roles." },
        { status: 403 },
      );
    }

    await connectMongodb();
    const { id } = await params;

    // Admin cannot change their own role
    if (currentUser._id.toString() === id) {
      return NextResponse.json(
        { message: "You cannot change your own role." },
        { status: 400 },
      );
    }

    const { role } = await req.json();

    // Only these roles can be assigned via UI — Administrator must be set in DB
    const ASSIGNABLE_ROLES = ["Supervisor", "Technician", "Reporter"];
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json(
        {
          message: `Invalid role. Assignable roles: ${ASSIGNABLE_ROLES.join(", ")}. Administrator role must be set directly in the database.`,
        },
        { status: 400 },
      );
    }

    const targetUser = await User.findById(id);
    if (!targetUser)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Prevent changing another Administrator's role
    if (targetUser.role === "Administrator") {
      return NextResponse.json(
        { message: "Cannot change the role of another Administrator." },
        { status: 403 },
      );
    }

    const previousRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    if (previousRole !== role && targetUser.email) {
      const appUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const loginUrl = `${appUrl}/auth/login`;
      await sendMail({
        to: targetUser.email,
        subject: `Your role has been updated to ${role}`,
        htmlTemplate: roleAssignedEmail({
          username: targetUser.username,
          role,
          loginUrl,
        }),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Role updated to ${role} successfully.`,
        user: {
          _id: targetUser._id,
          username: targetUser.username,
          email: targetUser.email,
          role: targetUser.role,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PATCH /api/users/[id]] error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error },
      { status: 500 },
    );
  }
}

// DELETE /api/users/[id] — Admin only
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (currentUser.role !== "Administrator")
      return NextResponse.json(
        { message: "Only Administrators can delete users." },
        { status: 403 },
      );

    await connectMongodb();
    const { id } = await params;

    if (currentUser._id.toString() === id)
      return NextResponse.json(
        { message: "You cannot delete your own account." },
        { status: 400 },
      );

    const targetUser = await User.findById(id);
    if (!targetUser)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    if (targetUser.role === "Administrator")
      return NextResponse.json(
        { message: "Cannot delete another Administrator." },
        { status: 403 },
      );

    await User.findByIdAndDelete(id);
    return NextResponse.json(
      { success: true, message: "User deleted." },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error },
      { status: 500 },
    );
  }
}
