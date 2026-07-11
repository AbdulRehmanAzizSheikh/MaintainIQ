"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Suspense } from "react";
import toast from "react-hot-toast";

interface Asset {
  _id: string;
  name: string;
  assetTag: string;
  category: string;
}

interface IssueOption {
  _id: string;
  title: string;
  status: string;
}

function NewServiceRecordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillIssueId = searchParams.get("issueId") || "";
  const prefillAssetId = searchParams.get("assetId") || "";

  const [assets, setAssets] = useState<Asset[]>([]);
  const [issues, setIssues] = useState<IssueOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<string[]>([""]);

  const [form, setForm] = useState({
    asset: prefillAssetId,
    issue: prefillIssueId,
    serviceType: "repair",
    title: "",
    description: "",
    cost: "",
    duration: "",
    nextServiceDate: "",
    status: "completed",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/assets").then((r) => r.json()),
      fetch("/api/issues?status=open&status=assigned&status=in_progress").then(
        (r) => r.json(),
      ),
    ])
      .then(([assetsData, issuesData]) => {
        setAssets(assetsData.assets || []);
        setIssues(issuesData.issues || []);
      })
      .catch(() => toast.error("Failed to load data"));
  }, []);

  const handleAddPart = () => setParts([...parts, ""]);
  const handlePartChange = (index: number, val: string) => {
    const updated = [...parts];
    updated[index] = val;
    setParts(updated);
  };
  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asset || !form.title || !form.serviceType) {
      toast.error("Asset, title, and service type are required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        cost: Number(form.cost) || 0,
        duration: Number(form.duration) || undefined,
        partsReplaced: parts.filter((p) => p.trim()),
        issue: form.issue || undefined,
      };

      const res = await fetch("/api/service-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Service record logged successfully!");
        router.push("/dashboard/service-history");
      } else {
        toast.error(data.message || "Failed to log record");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Asset */}
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
          <option value="">-- Select Asset --</option>
          {assets.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name} ({a.assetTag})
            </option>
          ))}
        </select>
      </div>

      {/* Linked Issue (optional) */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1.5">
          Linked Maintenance Ticket (optional)
        </label>
        <select
          value={form.issue}
          onChange={(e) => setForm({ ...form, issue: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 text-slate-300 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
        >
          <option value="">-- No linked ticket --</option>
          {issues.map((i) => (
            <option key={i._id} value={i._id}>
              {i.title} [{i.status}]
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          Linking a ticket will automatically mark it as resolved.
        </p>
      </div>

      {/* Service Type + Title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">
            Service Type <span className="text-red-400">*</span>
          </label>
          <select
            value={form.serviceType}
            onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
          >
            <option value="repair">Repair</option>
            <option value="preventive">Preventive Maintenance</option>
            <option value="inspection">Inspection</option>
            <option value="replacement">Replacement</option>
            <option value="upgrade">Upgrade</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">
            Record Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Replaced compressor unit"
            required
            className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1.5">
          Work Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="Describe the work performed in detail..."
          className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none"
        />
      </div>

      {/* Cost + Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">
            Total Cost (PKR)
          </label>
          <input
            type="number"
            min="0"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            placeholder="0"
            className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">
            Duration (minutes)
          </label>
          <input
            type="number"
            min="0"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            placeholder="e.g. 60"
            className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
          />
        </div>
      </div>

      {/* Parts Replaced */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1.5">
          Parts Replaced
        </label>
        <div className="space-y-2">
          {parts.map((part, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={part}
                onChange={(e) => handlePartChange(i, e.target.value)}
                placeholder={`Part ${i + 1}, e.g. Air filter, Fan belt...`}
                className="flex-1 bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
              {parts.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePart(i)}
                  className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl text-xs transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddPart}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            + Add another part
          </button>
        </div>
      </div>

      {/* Next Service Date */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1.5">
          Next Scheduled Service Date
        </label>
        <input
          type="date"
          value={form.nextServiceDate}
          onChange={(e) =>
            setForm({ ...form, nextServiceDate: e.target.value })
          }
          className="w-full bg-slate-950 border border-slate-800 text-white py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {loading ? "Saving Record..." : "Save Service Record"}
      </button>
    </form>
  );
}

export default function NewServiceRecord() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/service-history"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            Log Service Record
          </h2>
          <p className="text-sm text-slate-400">
            Record completed maintenance work for the permanent service ledger.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <Suspense
          fallback={
            <div className="text-slate-400 text-sm text-center py-8">
              Loading form...
            </div>
          }
        >
          <NewServiceRecordForm />
        </Suspense>
      </div>
    </div>
  );
}
