"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import toast from "react-hot-toast";

interface Asset {
  _id: string;
  name: string;
  assetTag: string;
  category: string;
}

export default function NewIssuePage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    asset: "",
    title: "",
    description: "",
    priority: "medium",
  });

  useEffect(() => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((d) => setAssets(d.assets || []))
      .catch(() => toast.error("Failed to load assets"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asset || !form.title || !form.description) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Issue logged successfully!");
        router.push(`/dashboard/issues/${data.issue._id}`);
      } else {
        toast.error(data.message || "Failed to log issue");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/issues"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-white">Log Manual Issue</h2>
          <p className="text-sm text-slate-400">Manually report a maintenance issue from the dashboard.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              Asset <span className="text-red-400">*</span>
            </label>
            <select
              value={form.asset}
              onChange={(e) => setForm({ ...form, asset: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            >
              <option value="">-- Select an Asset --</option>
              {assets.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.assetTag}) — {a.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              Issue Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. AC not cooling, light flickering..."
              required
              className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Describe the issue in detail..."
              required
              className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            >
              <option value="low">Low — Minor inconvenience, non-urgent</option>
              <option value="medium">Medium — Affects productivity, needs attention</option>
              <option value="high">High — Significant disruption, urgent</option>
              <option value="critical">Critical — Safety risk, immediate action required</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {loading ? "Logging Issue..." : "Log Issue"}
          </button>
        </form>
      </div>
    </div>
  );
}
