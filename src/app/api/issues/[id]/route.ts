import { NextRequest, NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import Issue from "@/lib/models/Issue";
import Asset from "@/lib/models/Asset";
import { getCurrentUser } from "@/utils/getUser";
import sendMail from "@/utils/email/send";

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

    const existingIssue = await Issue.findById(id)
      .populate("asset", "name assetTag")
      .populate("assignedTo", "username email")
      .populate("reportedBy.userId", "username email");

    if (!existingIssue)
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });

    const isAdminOrSupervisor =
      user.role === "Administrator" || user.role === "Supervisor";
    const isTechnician = user.role === "Technician";

    const updateData: Record<string, unknown> = {};

    if (isAdminOrSupervisor) {
      if (body.assignedTo !== undefined)
        updateData.assignedTo = body.assignedTo;
      if (body.priority !== undefined) updateData.priority = body.priority;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.resolutionNotes !== undefined)
        updateData.resolutionNotes = body.resolutionNotes;
      if (body.aiSuggestion !== undefined)
        updateData.aiSuggestion = body.aiSuggestion;
    } else if (isTechnician) {
      const assignedId = existingIssue.assignedTo?._id?.toString();
      if (assignedId !== user._id.toString()) {
        return NextResponse.json(
          { message: "Only assigned technicians can update this issue." },
          { status: 403 },
        );
      }
      if (body.assignedTo && body.assignedTo !== assignedId) {
        return NextResponse.json(
          { message: "Technicians cannot reassign issues." },
          { status: 403 },
        );
      }
      if (body.status !== undefined) updateData.status = body.status;
      if (body.resolutionNotes !== undefined)
        updateData.resolutionNotes = body.resolutionNotes;
    } else {
      return NextResponse.json(
        { message: "You do not have permission to update issues." },
        { status: 403 },
      );
    }

    if (body.status === "resolved" || body.status === "closed") {
      updateData.resolvedAt = new Date();
    }

    const issue = await Issue.findByIdAndUpdate(id, updateData, { new: true })
      .populate("asset", "name assetTag")
      .populate("assignedTo", "username email");

    if (!issue)
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });

    const assignmentChanged =
      isAdminOrSupervisor &&
      body.assignedTo &&
      existingIssue.assignedTo?._id?.toString() !== body.assignedTo;

    if (body.assignedTo && issue.status === "open" && !body.status) {
      issue.status = "assigned";
      await Issue.findByIdAndUpdate(id, { status: "assigned" });
    }

    if (assignmentChanged && issue.assignedTo?.email) {
      await sendMail({
        to: issue.assignedTo.email,
        subject: `Issue assigned: ${issue.title}`,
        htmlTemplate: `
          <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.6;">
            <h2 style="color:#0f172a;">New issue assigned</h2>
            <p><strong>${issue.title}</strong></p>
            <p>${issue.description}</p>
            <p><strong>Asset:</strong> ${issue.asset?.name} (${issue.asset?.assetTag})</p>
            <p><strong>Urgency:</strong> ${issue.priority}</p>
            <p><strong>Current status:</strong> ${issue.status}</p>
            <p style="margin-top:24px;">Please log in to MaintainIQ to review and resolve this ticket.</p>
          </div>
        `,
      });
    }

    if (body.assignedTo || body.status === "in_progress") {
      await Asset.findByIdAndUpdate(issue.asset, {
        status: "under_maintenance",
      });
    }

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

    if (!["Administrator", "Supervisor"].includes(user.role)) {
      return NextResponse.json(
        { message: "Only Administrators and Supervisors can delete issues." },
        { status: 403 },
      );
    }

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
