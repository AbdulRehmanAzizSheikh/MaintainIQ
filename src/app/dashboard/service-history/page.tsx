"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, DollarSign, Wrench, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

interface ServiceRecord {
  _id: string;
  title: string;
  serviceType: string;
  description: string;
  cost: number;
  status: string;
  createdAt: string;
  asset: { _id?: string; name: string; assetTag: string; category: string };
  performedBy: { username: string; email: string };
  issue?: { title: string };
  partsReplaced?: string[];
}

export default function ServiceHistoryPage() {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/service-records")
      .then((r) => r.json())
      .then((d) => setRecords(d.records || []))
      .catch(() => toast.error("Could not load service history"))
      .finally(() => setLoading(false));
  }, []);

  const TYPE_COLORS: Record<string, string> = {
    repair: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    preventive: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    inspection: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    replacement: "text-red-400 bg-red-500/10 border-red-500/20",
    upgrade: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            Service History Ledger
          </h2>
          <p className="text-sm text-slate-400">
            Permanent record of all maintenance work performed on facility
            assets.
          </p>
        </div>
        <Link
          href="/dashboard/service-history/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all text-sm shadow-lg shadow-cyan-500/10 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Service Record
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-slate-900 border border-slate-800 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="font-bold text-white mb-2">No Service Records Yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            Once technicians complete repairs, service records are logged here
            permanently for audit and accountability.
          </p>
          <Link
            href="/dashboard/service-history/new"
            className="inline-flex px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 text-xs transition-all"
          >
            Log First Service Record
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => (
            <div
              key={rec._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${TYPE_COLORS[rec.serviceType] || "text-slate-400 bg-slate-800 border-slate-700"}`}
                    >
                      {rec.serviceType}
                    </span>
                    {rec.issue && (
                      <span className="text-xs text-slate-500">
                        Linked ticket: {rec.issue.title}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white">{rec.title}</h3>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                    {rec.description}
                  </p>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                      {rec.asset?.name} ({rec.asset?.assetTag})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </span>
                    {rec.cost > 0 && (
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        PKR {rec.cost.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {rec.partsReplaced && rec.partsReplaced.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {rec.partsReplaced.map((part, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-400 mb-1">Technician</div>
                  <div className="font-semibold text-white text-sm">
                    {rec.performedBy?.username || "Unknown"}
                  </div>
                  <Link
                    href={`/dashboard/assets/${rec.asset?._id || ""}`}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-2 justify-end transition-colors"
                  >
                    Asset Profile
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
