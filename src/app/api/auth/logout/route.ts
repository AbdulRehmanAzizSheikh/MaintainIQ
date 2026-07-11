import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Support both GET and POST so layout's fetch("POST") and direct GET both work
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  return NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 },
  );
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  const url = new URL("/", req.url);
  return NextResponse.redirect(url);
}
