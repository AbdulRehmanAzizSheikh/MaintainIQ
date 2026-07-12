"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Ticket,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Users,
  Calendar,
  Wrench,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface StatsData {
  assets: {
    total: number;
    operational: number;
    underMaintenance: number;
    faulty: number;
  };
  issues: {
    total: number;
    open: number;
    resolved: number;
    critical: number;
  };
  serviceRecords: number;
  technicians: number;
  recentIssues: Array<{
    _id: string;
    title: string;
    priority: "low" | "medium" | "high" | "critical";
    status: "open" | "assigned" | "in_progress" | "resolved" | "closed";
    createdAt: string;
    asset: {
      name: string;
      assetTag: string;
    };
  }>;
  charts: {
    issuesByPriority: Array<{ _id: string; count: number }>;
    assetsByCategory: Array<{ _id: string; count: number }>;
    monthlyServiceRecords: Array<{
      _id: { month: number; year: number };
      count: number;
    }>;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Failed to load dashboard statistics");
        const data = await res.json();
        setStats(data.stats);
      } catch (err) {
        console.error(err);
        toast.error("Could not fetch operational stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-slate-800 animate-pulse rounded-2xl"
            ></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 lg:col-span-2 bg-slate-800 animate-pulse rounded-2xl"></div>
          <div className="h-96 bg-slate-800 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!stats)
    return (
      <div className="text-slate-400">
        Failed to render dashboard workspace.
      </div>
    );

  // Chart data formatting
  const priorityChartData = [
    {
      name: "Low",
      value:
        stats.charts.issuesByPriority.find((x) => x._id === "low")?.count || 0,
      color: "#10b981",
    },
    {
      name: "Medium",
      value:
        stats.charts.issuesByPriority.find((x) => x._id === "medium")?.count ||
        0,
      color: "#eab308",
    },
    {
      name: "High",
      value:
        stats.charts.issuesByPriority.find((x) => x._id === "high")?.count || 0,
      color: "#f97316",
    },
    {
      name: "Critical",
      value:
        stats.charts.issuesByPriority.find((x) => x._id === "critical")
          ?.count || 0,
      color: "#ef4444",
    },
  ];

  const categoryChartData = stats.charts.assetsByCategory.map((cat, index) => {
    const colors = [
      "#22d3ee",
      "#a78bfa",
      "#3b82f6",
      "#10b981",
      "#fb923c",
      "#f472b6",
      "#e2e8f0",
    ];
    return {
      name: cat._id || "Other",
      value: cat.count,
      color: colors[index % colors.length],
    };
  });

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/25";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/25";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/25";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-500/10 text-emerald-400";
      case "closed":
        return "bg-slate-700/30 text-slate-400";
      case "in_progress":
        return "bg-purple-500/10 text-purple-400";
      case "assigned":
        return "bg-blue-500/10 text-blue-400";
      default:
        return "bg-amber-500/10 text-amber-400";
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Assets */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Asset Register
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {stats.assets.total}
              </h3>
            </div>
            <div className="bg-cyan-500/10 text-cyan-400 p-3.5 rounded-xl group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex gap-3 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>{" "}
              {stats.assets.operational} Good
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>{" "}
              {stats.assets.underMaintenance} Maint
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>{" "}
              {stats.assets.faulty} Fault
            </span>
          </div>
        </div>

        {/* Total Issues */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Open Tickets
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {stats.issues.open}
              </h3>
            </div>
            <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-xl group-hover:scale-110 transition-transform">
              <Ticket className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex gap-3 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            <span className="text-red-400 font-bold">
              {stats.issues.critical} Critical tickets
            </span>
            <span className="text-emerald-400 font-bold">
              {stats.issues.resolved} Resolved total
            </span>
          </div>
        </div>

        {/* Service Ledgers */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Service Logs
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {stats.serviceRecords}
              </h3>
            </div>
            <div className="bg-emerald-500/10 text-emerald-400 p-3.5 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 border-t border-slate-800/80 pt-4 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Permanent service records saved
          </div>
        </div>

        {/* Staff / Technicians */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Staff
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {stats.technicians}
              </h3>
            </div>
            <div className="bg-purple-500/10 text-purple-400 p-3.5 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 border-t border-slate-800/80 pt-4 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-slate-500" />
            Technicians allocated in system
          </div>
        </div>
      </div>

      {/* Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issues by Priority (BarChart) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl lg:col-span-2">
          <h4 className="font-bold text-white mb-6">
            Incident Distribution by Priority
          </h4>
          <div className="h-80">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priorityChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                    }}
                    labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600">
                Loading charts...
              </div>
            )}
          </div>
        </div>

        {/* Assets by Category (PieChart) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h4 className="font-bold text-white mb-6">Asset Category Analysis</h4>
          <div className="h-80 flex flex-col items-center justify-center">
            {mounted && categoryChartData.length > 0 ? (
              <>
                <div className="h-48 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-white">
                      {stats.assets.total}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Total Assets
                    </span>
                  </div>
                </div>
                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4 w-full text-xs text-slate-400">
                  {categoryChartData.slice(0, 6).map((cat, i) => (
                    <div key={i} className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      ></span>
                      <span className="truncate">
                        {cat.name}:{" "}
                        <strong className="text-white font-medium">
                          {cat.value}
                        </strong>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-sm">
                No assets registered yet. Add assets to see analysis.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Issues Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h4 className="font-bold text-white">Recent Failure Tickets</h4>
          </div>
          <Link
            href="/dashboard/issues"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            Manage All Tickets
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {stats.recentIssues.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            All clear! No active failure reports logged.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/40 text-xs font-bold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Asset Label</th>
                  <th className="px-6 py-4">Issue Description</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Logged Time</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.recentIssues.map((issue) => (
                  <tr
                    key={issue._id}
                    className="hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-white">
                        {issue.asset?.name || "Deleted Asset"}
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        {issue.asset?.assetTag || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {issue.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getPriorityBadge(issue.priority)}`}
                      >
                        {issue.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${getStatusBadge(issue.status)}`}
                      >
                        {issue.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(issue.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/dashboard/issues/${issue._id}`}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Inspect ticket &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
