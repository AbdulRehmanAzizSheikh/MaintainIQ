import { NextRequest, NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import Issue from "@/lib/models/Issue";
import Asset from "@/lib/models/Asset";
import { getCurrentUser } from "@/utils/getUser";
import sendMail from "@/utils/email/send";
import issueAssignedEmail from "@/utils/email/templates/issue-assigned";

// GET /api/issues/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectMongodb();
    const { id } = await params;
    const issue = await Issue.findById(id)
      .populate("asset", "name assetTag category location status imageUrl")
      .populate("assignedTo", "username email role")
      .populate("reportedBy.userId", "username email");

    if (!issue)
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });

    return NextResponse.json({ success: true, issue }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch issue", error },
      { status: 500 },
    );
  }
}

// PUT /api/issues/[id] — update issue (assign, change status, etc.)
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

    // If resolving, set resolvedAt and update asset status
    if (body.status === "resolved" || body.status === "closed") {
      body.resolvedAt = new Date();
    }

    const previousIssue = await Issue.findById(id).populate(
      "assignedTo",
      "username email",
    );

    const issue = await Issue.findByIdAndUpdate(id, body, { new: true })
      .populate("asset", "name assetTag")
      .populate("assignedTo", "username email");

    if (!issue)
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });

    const wasAssignedTo = previousIssue?.assignedTo?.toString();
    const nowAssignedTo = issue.assignedTo?._id?.toString() || null;

    // If assigned, update asset status to under_maintenance
    if (body.assignedTo || body.status === "in_progress") {
      await Asset.findByIdAndUpdate(issue.asset, {
        status: "under_maintenance",
      });
    }

    // If assignment changed and the technician has email, send notification
    if (
      nowAssignedTo &&
      issue.assignedTo &&
      nowAssignedTo !== wasAssignedTo &&
      issue.assignedTo.email
    ) {
      const issueUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/issues/${issue._id}`;
      await sendMail({
        to: issue.assignedTo.email,
        subject: "New maintenance task assigned to you",
        htmlTemplate: issueAssignedEmail({
          technicianName: issue.assignedTo.username,
          issueTitle: issue.title,
          assetName: issue.asset?.name || "Unknown asset",
          issueUrl,
          priority: issue.priority,
          status: issue.status,
        }),
      });
    }

    // If resolved, update asset status back to operational
    if (body.status === "resolved" || body.status === "closed") {
      await Asset.findByIdAndUpdate(issue.asset, { status: "operational" });
    }

    return NextResponse.json(
      { success: true, message: "Issue updated", issue },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update issue", error },
      { status: 500 },
    );
  }
}

// DELETE /api/issues/[id]
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
    await Issue.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: "Issue deleted" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete issue", error },
      { status: 500 },
    );
  }
}
