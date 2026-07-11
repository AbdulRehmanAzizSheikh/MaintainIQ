"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, AlertTriangle, Eye, User } from "lucide-react";
import toast from "react-hot-toast";

interface Issue {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "assigned" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  asset: { name: string; assetTag: string; category: string };
  assignedTo?: { username: string; email: string };
  reportedBy: { name: string; email: string };
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-400",
  assigned: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-purple-500/10 text-purple-400",
  resolved: "bg-emerald-500/10 text-emerald-400",
  closed: "bg-slate-700/30 text-slate-400",
};

export default function IssuesList() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      const res = await fetch(`/api/issues?${params.toString()}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setIssues(data.issues || []);
    } catch {
      toast.error("Could not load maintenance tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  const filtered = issues.filter(
    (i) =>
      !searchQ ||
      i.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      i.asset?.name?.toLowerCase().includes(searchQ.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Maintenance Tickets</h2>
          <p className="text-sm text-slate-400">
            Triage, assign, and track all reported facility issues.
          </p>
        </div>
        <Link
          href="/dashboard/issues/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all text-sm shadow-lg shadow-cyan-500/10 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Manual Issue
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by issue title or asset..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Filter className="w-4 h-4 text-cyan-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-900 border border-slate-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="font-bold text-white mb-2">No Tickets Found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            No maintenance tickets match your current filters. Issues reported via QR codes appear here.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/40 text-xs font-bold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Issue</th>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Reported</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((issue) => (
                  <tr key={issue._id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-semibold text-white truncate">{issue.title}</div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{issue.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{issue.asset?.name || "N/A"}</div>
                      <span className="text-xs font-mono text-slate-500">{issue.asset?.assetTag}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${PRIORITY_STYLES[issue.priority] || ""}`}>
                        {issue.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${STATUS_STYLES[issue.status] || ""}`}>
                        {issue.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {issue.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-xs font-medium text-slate-300">{issue.assignedTo.username}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/issues/${issue._id}`}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 justify-end transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
