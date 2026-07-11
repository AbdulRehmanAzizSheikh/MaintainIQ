import { NextRequest, NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import Issue from "@/lib/models/Issue";
import { getCurrentUser } from "@/utils/getUser";
import { uploadImage } from "@/utils/cloudinary";

// GET /api/issues — list all issues
export async function GET(req: NextRequest) {
  try {
    await connectMongodb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assetId = searchParams.get("asset");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assetId) query.asset = assetId;

    const issues = await Issue.find(query)
      .populate("asset", "name assetTag category location")
      .populate("assignedTo", "username email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, issues }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch issues", error },
      { status: 500 },
    );
  }
}

// POST /api/issues — create new issue (auth OR anonymous via QR)
export async function POST(req: NextRequest) {
  try {
    await connectMongodb();
    const body = await req.json();

    // Try to get logged-in user (optional for public QR reports)
    let reportedById = null;
    try {
      const user = await getCurrentUser();
      if (user) reportedById = user._id;
    } catch {}

    // Upload base64 image to Cloudinary if provided
    let imageUrl = body.imageUrl || "";
    if (imageUrl && imageUrl.startsWith("data:image/")) {
      try {
        imageUrl = await uploadImage(imageUrl, "maintainiq/issues");
      } catch (uploadErr) {
        console.error("Cloudinary public upload failed:", uploadErr);
      }
    }

    const issueData = {
      ...body,
      imageUrl,
      reportedBy: {
        userId: reportedById,
        name: body.reporterName || "Anonymous",
        email: body.reporterEmail || "",
        phone: body.reporterPhone || "",
      },
    };

    const issue = await Issue.create(issueData);

    return NextResponse.json(
      { success: true, message: "Issue reported successfully", issue },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create issue", error },
      { status: 500 },
    );
  }
}
