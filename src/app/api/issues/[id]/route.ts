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
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectMongodb();
    const { id } = await params;

    let issueQuery = Issue.findById(id);
    if (user.role === "Technician") {
      issueQuery = Issue.findOne({ _id: id, assignedTo: user._id });
    }

    const issue = await issueQuery
      .populate("asset", "name assetTag category location status imageUrl")
      .populate("assignedTo", "username email role")
      .populate("reportedBy.userId", "username email");

    if (!issue)
      return NextResponse.json(
        { message: "Issue not found or access denied" },
        { status: 404 },
      );

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

    const previousIssue = await Issue.findById(id).populate(
      "assignedTo",
      "username email role",
    );
    if (!previousIssue)
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });

    const assignedToId = previousIssue.assignedTo
      ? (previousIssue.assignedTo as any)._id
        ? (previousIssue.assignedTo as any)._id.toString()
        : previousIssue.assignedTo.toString()
      : null;
    const isAssignedTechnician =
      assignedToId && assignedToId === user._id.toString();

    const updateData: Record<string, unknown> = {};

    if (user.role === "Technician") {
      if (!isAssignedTechnician) {
        return NextResponse.json(
          { message: "You can only update issues assigned to you." },
          { status: 403 },
        );
      }

      const allowedStatuses = ["in_progress", "resolved", "closed"];
      if (!body.status || !allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            message:
              "Technicians can only update the issue status to in_progress, resolved, or closed.",
          },
          { status: 403 },
        );
      }

      updateData.status = body.status;
    } else if (user.role === "Supervisor" || user.role === "Administrator") {
      if (body.status) updateData.status = body.status;
      if (body.priority) updateData.priority = body.priority;
      if (Object.prototype.hasOwnProperty.call(body, "assignedTo")) {
        updateData.assignedTo = body.assignedTo || null;
      }
      if (body.resolutionNotes)
        updateData.resolutionNotes = body.resolutionNotes;
    } else {
      return NextResponse.json(
        { message: "You do not have permission to update issues." },
        { status: 403 },
      );
    }

    if (updateData.status === "resolved" || updateData.status === "closed") {
      updateData.resolvedAt = new Date();
    }

    const issue = await Issue.findByIdAndUpdate(id, updateData, { new: true })
      .populate("asset", "name assetTag")
      .populate("assignedTo", "username email");

    if (!issue)
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });

    const wasAssignedTo = previousIssue?.assignedTo?.toString();
    const nowAssignedTo = issue.assignedTo?._id?.toString() || null;

    // If assigned, update asset status to under_maintenance
    if (updateData.assignedTo || issue.status === "in_progress") {
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
    if (issue.status === "resolved" || issue.status === "closed") {
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
