import { NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import Asset from "@/lib/models/Asset";
import Issue from "@/lib/models/Issue";
import ServiceRecord from "@/lib/models/ServiceRecord";
import User from "@/lib/models/User";

// GET /api/dashboard/stats
export async function GET() {
  try {
    await connectMongodb();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalAssets,
      operationalAssets,
      underMaintenanceAssets,
      faultyAssets,
      totalIssues,
      openIssues,
      resolvedIssues,
      criticalIssues,
      totalServiceRecords,
      totalTechnicians,
      totalSupervisors,
      totalReporters,
      totalAdmins,
      totalAccounts,
      issuesReportedToday,
      issuesSolvedToday,
      recentIssues,
      issuesByPriority,
      issuesByStatus,
      assetsByCategory,
      monthlyServiceRecords,
    ] = await Promise.all([
      Asset.countDocuments(),
      Asset.countDocuments({ status: "operational" }),
      Asset.countDocuments({ status: "under_maintenance" }),
      Asset.countDocuments({ status: "faulty" }),
      Issue.countDocuments(),
      Issue.countDocuments({
        status: { $in: ["open", "assigned", "in_progress"] },
      }),
      Issue.countDocuments({ status: { $in: ["resolved", "closed"] } }),
      Issue.countDocuments({ priority: "critical", status: { $ne: "closed" } }),
      ServiceRecord.countDocuments(),
      User.countDocuments({ role: "Technician" }),
      User.countDocuments({ role: "Supervisor" }),
      User.countDocuments({ role: "Reporter" }),
      User.countDocuments({ role: "Administrator" }),
      User.countDocuments(),
      Issue.countDocuments({ createdAt: { $gte: today } }),
      Issue.countDocuments({
        status: { $in: ["resolved", "closed"] },
        updatedAt: { $gte: today },
      }),
      Issue.find()
        .populate("asset", "name assetTag")
        .sort({ createdAt: -1 })
        .limit(5),
      Issue.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Issue.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Asset.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
      ServiceRecord.aggregate([
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 6 },
      ]),
    ]);

    return NextResponse.json(
      {
        success: true,
        stats: {
          assets: {
            total: totalAssets,
            operational: operationalAssets,
            underMaintenance: underMaintenanceAssets,
            faulty: faultyAssets,
          },
          issues: {
            total: totalIssues,
            open: openIssues,
            resolved: resolvedIssues,
            critical: criticalIssues,
            reportedToday: issuesReportedToday,
            solvedToday: issuesSolvedToday,
          },
          users: {
            totalAccounts,
            administrators: totalAdmins,
            supervisors: totalSupervisors,
            technicians: totalTechnicians,
            reporters: totalReporters,
          },
          serviceRecords: totalServiceRecords,
          recentIssues,
          charts: {
            issuesByPriority,
            issuesByStatus,
            assetsByCategory,
            monthlyServiceRecords,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch stats", error },
      { status: 500 },
    );
  }
}
