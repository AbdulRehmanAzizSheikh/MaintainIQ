"use client";

import { useEffect, useState, use } from "react";
import { Wrench, MapPin, Tag, Calendar, AlertTriangle, CheckCircle, Clock, Send, Camera, Cpu } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface Asset {
  _id: string;
  name: string;
  assetTag: string;
  category: string;
  description: string;
  manufacturer: string;
  model: string;
  status: string;
  imageUrl?: string;
  location: { building: string; floor: string; room: string };
  lastServiceDate?: string;
  nextServiceDate?: string;
}

interface IssueRecord {
  _id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  operational: { label: "Operational", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
  under_maintenance: { label: "Under Maintenance", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
  faulty: { label: "Faulty", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: AlertTriangle },
  decommissioned: { label: "Decommissioned", color: "text-slate-400 bg-slate-700/30 border-slate-700/50", icon: AlertTriangle },
};

export default function PublicAssetPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = use(params);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Report form
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    reporterName: "",
    reporterEmail: "",
    reporterPhone: "",
    imageUrl: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/assets/${tag}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setAsset(data.asset);
        // Only show recent open/in_progress issues publicly
        setIssues(
          (data.issues || []).filter(
            (i: IssueRecord) =>
              i.status === "open" || i.status === "in_progress" || i.status === "assigned",
          ),
        );
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tag]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setImagePreview(base64);
      setForm({ ...form, imageUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast.error("Title and description are required");
      return;
    }
    if (!asset) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: asset._id,
          title: form.title,
          description: form.description,
          priority: form.priority,
          reporterName: form.reporterName || "Anonymous",
          reporterEmail: form.reporterEmail,
          reporterPhone: form.reporterPhone,
          imageUrl: form.imageUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Issue reported! Our maintenance team has been notified.");
        setShowForm(false);
        setForm({ title: "", description: "", priority: "medium", reporterName: "", reporterEmail: "", reporterPhone: "", imageUrl: "" });
        setImagePreview("");
        // Refresh issues
        const refreshed = await fetch(`/api/assets/${tag}`);
        const refreshData = await refreshed.json();
        setIssues(
          (refreshData.issues || []).filter(
            (i: IssueRecord) => i.status === "open" || i.status === "in_progress" || i.status === "assigned",
          ),
        );
      } else {
        toast.error(data.message || "Failed to submit report");
      }
    } catch {
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm font-medium">Loading asset profile...</span>
        </div>
      </div>
    );
  }

  if (notFound || !asset) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Asset Not Found</h1>
          <p className="text-slate-400 text-sm max-w-sm">
            The QR code you scanned ({tag}) does not match any registered asset in our system.
          </p>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[asset.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.operational;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <Toaster position="top-center" />

      {/* Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-2.5">
        <div className="bg-cyan-500 p-1.5 rounded-lg text-slate-950">
          <Wrench className="w-4 h-4" />
        </div>
        <span className="font-extrabold text-white">
          Maintain<span className="text-cyan-400">IQ</span>
        </span>
        <span className="ml-auto text-xs text-slate-500 font-mono">{asset.assetTag}</span>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Asset Identity Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {asset.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-full h-40 object-cover"
            />
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold text-white">{asset.name}</h1>
                <span className="text-xs font-mono text-cyan-400 font-bold">{asset.assetTag}</span>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${statusCfg.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusCfg.label}
              </span>
            </div>

            {asset.description && (
              <p className="text-sm text-slate-400 mt-3">{asset.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-slate-300">{asset.category}</span>
              </div>
              {(asset.location?.building || asset.location?.floor || asset.location?.room) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-300 truncate">
                    {[asset.location.building, asset.location.floor, asset.location.room]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
              {asset.manufacturer && (
                <div className="flex items-center gap-2 col-span-2">
                  <Cpu className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-300">{asset.manufacturer} {asset.model || ""}</span>
                </div>
              )}
              {asset.lastServiceDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-300">
                    Last: {new Date(asset.lastServiceDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {asset.nextServiceDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-cyan-400 font-semibold">
                    Due: {new Date(asset.nextServiceDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Issues */}
        {issues.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
            <h2 className="font-bold text-amber-400 text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Active Issues ({issues.length})
            </h2>
            <div className="space-y-2">
              {issues.map((issue) => (
                <div key={issue._id} className="flex items-center justify-between bg-slate-900/60 rounded-xl px-3 py-2">
                  <span className="text-sm text-slate-300 font-medium">{issue.title}</span>
                  <span className="text-xs text-amber-400 font-semibold uppercase ml-2 shrink-0">
                    {issue.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Issue Button / Form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-red-500/10 flex items-center justify-center gap-2 text-base"
          >
            <AlertTriangle className="w-5 h-5" />
            Report an Issue with this Asset
          </button>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="font-extrabold text-white mb-5 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Report Maintenance Issue
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Issue Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. AC not cooling, light not working..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  required
                  placeholder="Describe what you see — when did it start, what sounds or behavior..."
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Priority Level
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                  <option value="low">Low — Minor, not urgent</option>
                  <option value="medium">Medium — Needs attention soon</option>
                  <option value="high">High — Causing disruption</option>
                  <option value="critical">Critical — Safety hazard!</option>
                </select>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Attach Photo (optional)
                </label>
                <label className="flex items-center gap-3 cursor-pointer w-full bg-slate-950 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 py-3 px-4 rounded-xl transition-all text-sm">
                  <Camera className="w-5 h-5 shrink-0" />
                  <span>{imagePreview ? "Photo attached ✓" : "Tap to take photo or upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 w-full max-h-48 object-cover rounded-xl border border-slate-700"
                  />
                )}
              </div>

              {/* Reporter Info */}
              <div className="pt-3 border-t border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-3">
                  Your Contact Info (optional, for follow-up)
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={form.reporterName}
                    onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
                    placeholder="Your name"
                    className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                  <input
                    type="email"
                    value={form.reporterEmail}
                    onChange={(e) => setForm({ ...form, reporterEmail: e.target.value })}
                    placeholder="Email address"
                    className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                  <input
                    type="tel"
                    value={form.reporterPhone}
                    onChange={(e) => setForm({ ...form, reporterPhone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-600 pb-4">
          Powered by{" "}
          <span className="font-bold text-slate-500">MaintainIQ</span> — Digital Asset Maintenance Platform
        </div>
      </div>
    </div>
  );
}
