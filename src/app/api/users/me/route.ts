import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/getUser";

// GET /api/users/me — get current logged in user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch user", error },
      { status: 500 },
    );
  }
}
