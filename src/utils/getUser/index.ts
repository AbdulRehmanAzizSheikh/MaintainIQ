import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import User from "@/lib/models/User";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded = decodeToken<{ id: string }>(token);
    if (!decoded?.id) return null;

    await connectMongodb();
    const user = await User.findById(decoded.id).select("-password");
    return user || null;
  } catch (err) {
    // Token invalid, expired, or DB error
    console.error("getCurrentUser error:", err);
    return null;
  }
}
