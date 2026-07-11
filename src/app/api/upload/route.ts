import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/utils/cloudinary";
import { getCurrentUser } from "@/utils/getUser";

// POST /api/upload — upload image to Cloudinary
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { image, folder } = body;

    if (!image)
      return NextResponse.json({ message: "Image is required" }, { status: 400 });

    const url = await uploadImage(image, `maintainiq/${folder || "general"}`);

    return NextResponse.json({ success: true, url }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Upload failed", error },
      { status: 500 },
    );
  }
}
