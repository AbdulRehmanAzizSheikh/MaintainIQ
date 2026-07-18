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
    reportedToday: number;
    solvedToday: number;
  };
  serviceRecords: number;
  users: {
    totalAccounts: number;
    administrators: number;
    supervisors: number;
    technicians: number;
    reporters: number;
  };
  recentIssues: Array<{
    _id: string;
    title: string;
    description: string;
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
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchDashboard = async () => {
      try {
        const [statsRes, userRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/auth/me"),
        ]);

        if (!statsRes.ok)
          throw new Error("Failed to load dashboard statistics");
        if (!userRes.ok) throw new Error("Not authenticated");

        const statsData = await statsRes.json();
        const userData = await userRes.json();

        setStats(statsData.stats);
        setUserRole(userData.user?.role || "");
      } catch (err) {
        console.error(err);
        toast.error("Could not fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
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

  const unResolvedIssues = stats.issues.total - stats.issues.resolved;
  const solvedToday = stats.issues.solvedToday;
  const reportedToday = stats.issues.reportedToday;

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

  const renderAdminSummary = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Accounts
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-3">
            {stats.users.totalAccounts}
          </h3>
          <p className="text-sm text-slate-500 mt-3">
            All registered users in the system.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Technicians
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-3">
            {stats.users.technicians}
          </h3>
          <p className="text-sm text-slate-500 mt-3">
            Active technical staff with assigned tickets.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Supervisors
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-3">
            {stats.users.supervisors}
          </h3>
          <p className="text-sm text-slate-500 mt-3">
            Leads with full asset and issue permissions.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Reporters
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-3">
            {stats.users.reporters}
          </h3>
          <p className="text-sm text-slate-500 mt-3">
            Issue reporters and read-only users.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Assets
              </p>
              <h3 className="text-4xl font-extrabold text-white mt-3">
                {stats.assets.total}
              </h3>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-cyan-500/10 text-cyan-300 text-xs border border-cyan-500/20">
              Read-only count
            </span>
          </div>
          <div className="mt-4 text-sm text-slate-500">
            Asset registry records available to administrators and supervisors.
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl min-w-55">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tickets resolved
          </p>
          <h3 className="text-4xl font-extrabold text-white mt-3">
            {stats.issues.resolved}
          </h3>
          <p className="text-sm text-slate-500 mt-4">
            Solved tickets since system launch.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs uppercase text-slate-400 tracking-wider mb-2">
            Issues solved
          </p>
          <h4 className="text-3xl font-extrabold text-white">
            {stats.issues.resolved}
          </h4>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs uppercase text-slate-400 tracking-wider mb-2">
            Issues open
          </p>
          <h4 className="text-3xl font-extrabold text-white">
            {unResolvedIssues}
          </h4>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs uppercase text-slate-400 tracking-wider mb-2">
            Reported today
          </p>
          <h4 className="text-3xl font-extrabold text-white">
            {reportedToday}
          </h4>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs uppercase text-slate-400 tracking-wider mb-2">
            Solved today
          </p>
          <h4 className="text-3xl font-extrabold text-white">{solvedToday}</h4>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Priority breakdown
            </p>
            <h3 className="text-xl font-bold text-white mt-2">
              Ticket urgency by priority
            </h3>
          </div>
          <div>
            <Link
              href="/dashboard/users"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-950 rounded-xl text-sm font-bold hover:bg-cyan-400 transition-all"
            >
              Manage Users
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {priorityChartData.map((entry) => (
            <div
              key={entry.name}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-4"
            >
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                {entry.name}
              </p>
              <p className="text-3xl font-extrabold text-white">
                {entry.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderTechnicianSummary = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Assigned Issues
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-3">
            {stats.issues.open}
          </h3>
          <p className="text-sm text-slate-500 mt-3">
            Assigned tickets currently open or in progress.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Solved by you
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-3">
            {stats.issues.resolved}
          </h3>
          <p className="text-sm text-slate-500 mt-3">
            Tickets resolved via service records.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Assets
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-3">
            {stats.assets.total}
          </h3>
          <p className="text-sm text-slate-500 mt-3">
            Read-only count of all assets.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Technicians
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-3">
            {stats.users.technicians}
          </h3>
          <p className="text-sm text-slate-500 mt-3">
            Total technical staff on the system.
          </p>
        </div>
      </div>
    </>
  );

  const renderReporterSummary = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Assets
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-3">
            {stats.assets.total}
          </h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Technicians
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-3">
            {stats.users.technicians}
          </h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Supervisors
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-3">
            {stats.users.supervisors}
          </h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Issues Today
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-3">
            {reportedToday}
          </h3>
          <p className="text-sm text-slate-500 mt-3">
            New tickets reported in the last 24 hours.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Issues Solved Today
          </p>
          <h3 className="text-4xl font-extrabold text-white mt-3">
            {solvedToday}
          </h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Unresolved Issues
          </p>
          <h3 className="text-4xl font-extrabold text-white mt-3">
            {unResolvedIssues}
          </h3>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-8">
      {userRole === "Administrator" || userRole === "Supervisor"
        ? renderAdminSummary()
        : userRole === "Technician"
          ? renderTechnicianSummary()
          : renderReporterSummary()}
    </div>
  );
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
  </div>;

  {
    /* Staff / Technicians */
  }
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
  </div>;

  {
    /* Charts & Analytics */
  }
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
  </div>;

  {
    /* Recent Issues Table */
  }
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
  </div>;
}
