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
      recentIssues,
      issuesByPriority,
      assetsByCategory,
      monthlyServiceRecords,
    ] = await Promise.all([
      Asset.countDocuments(),
      Asset.countDocuments({ status: "operational" }),
      Asset.countDocuments({ status: "under_maintenance" }),
      Asset.countDocuments({ status: "faulty" }),
      Issue.countDocuments(),
      Issue.countDocuments({ status: { $in: ["open", "assigned", "in_progress"] } }),
      Issue.countDocuments({ status: { $in: ["resolved", "closed"] } }),
      Issue.countDocuments({ priority: "critical", status: { $ne: "closed" } }),
      ServiceRecord.countDocuments(),
      User.countDocuments({ role: "Technician" }),
      Issue.find()
        .populate("asset", "name assetTag")
        .sort({ createdAt: -1 })
        .limit(5),
      Issue.aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Asset.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
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
          },
          serviceRecords: totalServiceRecords,
          technicians: totalTechnicians,
          recentIssues,
          charts: {
            issuesByPriority,
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
