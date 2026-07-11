import { NextRequest, NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import Asset from "@/lib/models/Asset";
import Issue from "@/lib/models/Issue";
import ServiceRecord from "@/lib/models/ServiceRecord";
import { getCurrentUser } from "@/utils/getUser";

// GET /api/assets/[id] — get single asset with issues + service history
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectMongodb();
    const { id } = await params;

    // Try by MongoDB _id first, then by assetTag
    let asset = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      asset = await Asset.findById(id).populate("createdBy", "username email");
    }
    if (!asset) {
      asset = await Asset.findOne({ assetTag: id }).populate(
        "createdBy",
        "username email",
      );
    }

    if (!asset)
      return NextResponse.json({ message: "Asset not found" }, { status: 404 });

    const issues = await Issue.find({ asset: asset._id })
      .populate("assignedTo", "username email")
      .sort({ createdAt: -1 });

    const serviceRecords = await ServiceRecord.find({ asset: asset._id })
      .populate("performedBy", "username email")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, asset, issues, serviceRecords },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch asset", error },
      { status: 500 },
    );
  }
}

// PUT /api/assets/[id] — update asset
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectMongodb();
    const { id } = await params;
    const body = await req.json();

    const asset = await Asset.findByIdAndUpdate(id, body, { new: true });
    if (!asset)
      return NextResponse.json({ message: "Asset not found" }, { status: 404 });

    return NextResponse.json(
      { success: true, message: "Asset updated", asset },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update asset", error },
      { status: 500 },
    );
  }
}

// DELETE /api/assets/[id] — delete asset
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectMongodb();
    const { id } = await params;
    await Asset.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: "Asset deleted" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete asset", error },
      { status: 500 },
    );
  }
}
