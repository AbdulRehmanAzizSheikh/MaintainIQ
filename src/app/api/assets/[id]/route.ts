import { NextRequest, NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import Asset from "@/lib/models/Asset";
import Issue from "@/lib/models/Issue";
import ServiceRecord from "@/lib/models/ServiceRecord";
import { getCurrentUser } from "@/utils/getUser";

// GET /api/assets/[id] — public (QR page needs this without auth)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectMongodb();
    const { id } = await params;

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
// Rules:
//   • Administrator → can edit everything
//   • Supervisor    → can only update status field (not full edit)
//   • Technician    → can only update status field
//   • Reporter      → no access
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Reporter cannot edit assets at all
    if (user.role === "Reporter") {
      return NextResponse.json(
        { message: "Reporters cannot edit assets." },
        { status: 403 },
      );
    }

    await connectMongodb();
    const { id } = await params;
    const body = await req.json();

    const isFullEditor = ["Administrator", "Supervisor"].includes(user.role);
    const isStatusUpdater = user.role === "Technician";

    let updateData: Record<string, unknown> = {};
    if (isFullEditor) {
      updateData = body;
    } else if (isStatusUpdater) {
      if (!body.status) {
        return NextResponse.json(
          {
            message:
              "Technicians can only update asset status. Administrators and Supervisors can update full asset details.",
          },
          { status: 403 },
        );
      }
      updateData = { status: body.status };
    } else {
      return NextResponse.json(
        { message: "You do not have permission to update this asset." },
        { status: 403 },
      );
    }

    const asset = await Asset.findByIdAndUpdate(id, updateData, { new: true });
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

// DELETE /api/assets/[id] — ONLY Administrator
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Only Administrator and Supervisor can delete
    if (!["Administrator", "Supervisor"].includes(user.role)) {
      return NextResponse.json(
        { message: "Only Administrators and Supervisors can delete assets." },
        { status: 403 },
      );
    }

    await connectMongodb();
    const { id } = await params;

    const asset = await Asset.findById(id);
    if (!asset)
      return NextResponse.json({ message: "Asset not found" }, { status: 404 });

    await Promise.all([
      Issue.deleteMany({ asset: asset._id }),
      ServiceRecord.deleteMany({ asset: asset._id }),
      asset.deleteOne(),
    ]);

    return NextResponse.json(
      { success: true, message: "Asset deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete asset", error },
      { status: 500 },
    );
  }
}
