"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Cpu,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";

interface Issue {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  imageUrl?: string;
  aiSuggestion?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  asset: {
    _id: string;
    name: string;
    assetTag: string;
    category: string;
    location: { building: string; floor: string; room: string };
  };
  assignedTo?: { _id: string; username: string; email: string };
  reportedBy: { name: string; email: string; phone: string };
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
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

export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({
    status: "",
    assignedTo: "",
    priority: "",
    resolutionNotes: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [issueRes, usersRes] = await Promise.all([
          fetch(`/api/issues/${id}`),
          fetch("/api/users"),
        ]);
        const issueData = await issueRes.json();
        const usersData = await usersRes.json();

        if (!issueRes.ok) throw new Error("Issue not found");

        setIssue(issueData.issue);
        setUsers(usersData.users || []);
        setForm({
          status: issueData.issue.status,
          assignedTo: issueData.issue.assignedTo?._id || "",
          priority: issueData.issue.priority,
          resolutionNotes: issueData.issue.resolutionNotes || "",
        });
      } catch {
        toast.error("Failed to load issue details");
        router.push("/dashboard/issues");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        status: form.status,
        priority: form.priority,
        resolutionNotes: form.resolutionNotes,
      };
      if (form.assignedTo) payload.assignedTo = form.assignedTo;

      const res = await fetch(`/api/issues/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Issue updated successfully!");
        setIssue(data.issue);
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const getAiRecommendation = async () => {
    if (!issue) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetName: issue.asset?.name,
          category: issue.asset?.category,
          issueTitle: issue.title,
          issueDescription: issue.description,
        }),
      });
      const data = await res.json();
      if (res.ok && data.recommendation) {
        // Save AI suggestion to issue
        await fetch(`/api/issues/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aiSuggestion: data.recommendation }),
        });
        setIssue((prev) =>
          prev ? { ...prev, aiSuggestion: data.recommendation } : prev,
        );
        toast.success(data.isMock ? "Smart AI diagnostics generated!" : "AI recommendation fetched!");
      } else {
        toast.error("AI recommendation failed");
      }
    } catch {
      toast.error("AI service unavailable");
    } finally {
      setAiLoading(false);
    }
  };

  const logServiceRecord = () => {
    router.push(
      `/dashboard/service-history/new?issueId=${id}&assetId=${issue?.asset?._id}`,
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-800 animate-pulse rounded" />
        <div className="h-64 bg-slate-800 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!issue) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/dashboard/issues"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${PRIORITY_STYLES[issue.priority] || ""}`}
            >
              {issue.priority}
            </span>
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${STATUS_STYLES[issue.status] || ""}`}
            >
              {issue.status.replace("_", " ")}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">{issue.title}</h2>
          <p className="text-sm text-slate-400 mt-1">{issue.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details + Update Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Asset Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              Asset Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Name</span>
                <p className="text-white font-semibold mt-0.5">{issue.asset?.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Asset Tag</span>
                <p className="font-mono text-cyan-400 font-bold mt-0.5">
                  {issue.asset?.assetTag}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Category</span>
                <p className="text-white mt-0.5">{issue.asset?.category}</p>
              </div>
              <div>
                <span className="text-slate-400">Location</span>
                <p className="text-white mt-0.5 text-xs leading-relaxed">
                  {[
                    issue.asset?.location?.building,
                    issue.asset?.location?.floor,
                    issue.asset?.location?.room,
                  ]
                    .filter(Boolean)
                    .join(" / ") || "Not specified"}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <Link
                href={`/dashboard/assets/${issue.asset?._id}`}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View full asset profile →
              </Link>
            </div>
          </div>

          {/* Reported By */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Reporter Information
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Name</span>
                <p className="text-white font-semibold mt-0.5">
                  {issue.reportedBy?.name || "Anonymous"}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Email</span>
                <p className="text-white mt-0.5">
                  {issue.reportedBy?.email || "—"}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Phone</span>
                <p className="text-white mt-0.5">
                  {issue.reportedBy?.phone || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Issue Image */}
          {issue.imageUrl && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                Submitted Evidence Photo
              </h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={issue.imageUrl}
                alt="Issue evidence"
                className="w-full max-w-md rounded-xl border border-slate-700 object-cover"
              />
            </div>
          )}

          {/* AI Recommendation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                AI Maintenance Diagnostics
              </h3>
              <button
                onClick={getAiRecommendation}
                disabled={aiLoading}
                className="text-xs font-bold px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all disabled:opacity-50"
              >
                {aiLoading ? "Analyzing..." : issue.aiSuggestion ? "Re-analyze" : "Get AI Diagnosis"}
              </button>
            </div>
            {issue.aiSuggestion ? (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                {issue.aiSuggestion}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                Click &ldquo;Get AI Diagnosis&rdquo; to receive Gemini-powered root cause analysis and maintenance recommendations.
              </p>
            )}
          </div>
        </div>

        {/* Right: Update Panel */}
        <div className="space-y-5">
          {/* Triage Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Triage & Assign
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Assign Technician
                </label>
                <select
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                  <option value="">— Unassigned —</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Resolution Notes
                </label>
                <textarea
                  value={form.resolutionNotes}
                  onChange={(e) =>
                    setForm({ ...form, resolutionNotes: e.target.value })
                  }
                  rows={3}
                  placeholder="What was done to resolve this issue?"
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Log Service Record */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Service Record
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Once the repair is done, log a service record with parts replaced, cost, and photos.
            </p>
            <button
              onClick={logServiceRecord}
              className="w-full py-2.5 text-sm font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 rounded-xl hover:bg-emerald-500/10 transition-all"
            >
              + Log Service Record
            </button>
          </div>

          {/* Timestamps */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Timeline
            </h3>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Reported</span>
                <span className="text-slate-300">
                  {new Date(issue.createdAt).toLocaleString()}
                </span>
              </div>
              {issue.resolvedAt && (
                <div className="flex justify-between">
                  <span>Resolved</span>
                  <span className="text-emerald-400">
                    {new Date(issue.resolvedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
