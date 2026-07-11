import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/getUser";
import { connectMongodb } from "@/lib/db";

// GET /api/auth/me
export async function GET() {
  try {
    await connectMongodb();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }
    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error fetching user profile", error },
      { status: 500 },
    );
  }
}
