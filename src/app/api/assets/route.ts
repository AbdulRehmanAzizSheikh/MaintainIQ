import { NextRequest, NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import Asset from "@/lib/models/Asset";
import { getCurrentUser } from "@/utils/getUser";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { uploadImage } from "@/utils/cloudinary";

// GET /api/assets — list all assets
export async function GET(req: NextRequest) {
  try {
    await connectMongodb();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: "i" };

    const assets = await Asset.find(query)
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, assets }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch assets", error },
      { status: 500 },
    );
  }
}

// POST /api/assets — create new asset
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectMongodb();
    const body = await req.json();

    // Generate unique asset tag
    const assetTag = body.assetTag || `MIQ-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Generate QR code pointing to the public asset page
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const qrData = `${baseUrl}/asset/${assetTag}/public`;
    const qrBase64 = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // Upload QR to Cloudinary
    const qrCodeUrl = await uploadImage(qrBase64, "maintainiq/qrcodes");

    const asset = await Asset.create({
      ...body,
      assetTag,
      qrCodeUrl,
      createdBy: user._id,
    });

    return NextResponse.json(
      { success: true, message: "Asset created successfully", asset },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create asset", error },
      { status: 500 },
    );
  }
}
