import { NextRequest, NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import ServiceRecord from "@/lib/models/ServiceRecord";
import Asset from "@/lib/models/Asset";
import Issue from "@/lib/models/Issue";
import { getCurrentUser } from "@/utils/getUser";

// GET /api/service-records
export async function GET(req: NextRequest) {
  try {
    await connectMongodb();
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get("asset");
    const query: Record<string, unknown> = {};
    if (assetId) query.asset = assetId;

    const records = await ServiceRecord.find(query)
      .populate("asset", "name assetTag category")
      .populate("performedBy", "username email")
      .populate("issue", "title status")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, records }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch service records", error },
      { status: 500 },
    );
  }
}

// POST /api/service-records
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectMongodb();
    const body = await req.json();

    const record = await ServiceRecord.create({
      ...body,
      performedBy: user._id,
    });

    // Update asset last/next service date
    const updateData: Record<string, unknown> = {
      lastServiceDate: new Date(),
    };
    if (body.nextServiceDate) updateData.nextServiceDate = body.nextServiceDate;

    await Asset.findByIdAndUpdate(body.asset, updateData);

    // If linked issue, mark it resolved
    if (body.issue) {
      await Issue.findByIdAndUpdate(body.issue, {
        status: "resolved",
        resolvedAt: new Date(),
        resolutionNotes: body.description,
      });
    }

    return NextResponse.json(
      { success: true, message: "Service record created", record },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create service record", error },
      { status: 500 },
    );
  }
}
