import { NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import User from "@/lib/models/User";
import { getCurrentUser } from "@/utils/getUser";

// GET /api/users — list all users
// Administrator → sees all users with full details
// Supervisor / Technician → sees only Technicians (for assignment dropdown)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectMongodb();

    let users;
    if (currentUser.role === "Administrator") {
      // Admin sees everyone
      users = await User.find()
        .select("-password -verify")
        .sort({ createdAt: -1 });
    } else {
      // Others only see Technicians (for issue assignment)
      users = await User.find({ role: "Technician" })
        .select("_id username email role")
        .sort({ username: 1 });
    }

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch users", error },
      { status: 500 },
    );
  }
}
