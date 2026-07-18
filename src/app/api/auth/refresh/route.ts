import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectMongodb } from "@/lib/db";
import { decodeToken, generateToken } from "@/utils/jwt";
import User from "@/lib/models/User";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "No token provided" },
        { status: 401 },
      );
    }

    const decoded = decodeToken<{ id: string; sessionStart: number }>(token);
    if (!decoded?.id || !decoded.sessionStart) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const sessionAge = Date.now() - decoded.sessionStart;
    if (sessionAge > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    await connectMongodb();
    const user = await User.findById(decoded.id).select("_id");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    const newToken = generateToken(
      { id: decoded.id, sessionStart: decoded.sessionStart },
      60 * 60,
    );
    cookieStore.set("token", newToken, {
      maxAge: 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return NextResponse.json(
      { success: true, message: "Session refreshed" },
      { status: 200 },
    );
  } catch (error) {
    console.error("/api/auth/refresh error", error);
    return NextResponse.json(
      { message: "Unable to refresh session" },
      { status: 401 },
    );
  }
}
