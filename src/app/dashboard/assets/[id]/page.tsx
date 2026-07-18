"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  QrCode,
  Download,
  Settings,
  Wrench,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  Tag,
  Building,
  Pencil,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

interface AssetDetails {
  _id: string;
  name: string;
  assetTag: string;
  category: string;
  location: {
    building: string;
    floor: string;
    room: string;
  };
  description: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  status: "operational" | "under_maintenance" | "decommissioned" | "faulty";
  qrCodeUrl: string;
  organization: string;
  nextServiceDate: string;
  lastServiceDate: string;
}

interface Issue {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "assigned" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  assignedTo?: {
    username: string;
  };
}

interface ServiceRecord {
  _id: string;
  serviceType:
    | "repair"
    | "preventive"
    | "inspection"
    | "replacement"
    | "upgrade";
  title: string;
  description: string;
  performedBy: {
    username: string;
    email: string;
  };
  cost: number;
  partsReplaced: string[];
  createdAt: string;
}

export default function AssetDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [asset, setAsset] = useState<AssetDetails | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [deleting, setDeleting] = useState(false);

  const fetchAssetDetails = async () => {
    try {
      const res = await fetch(`/api/assets/${id}`);
      if (!res.ok) throw new Error("Failed to load asset details");
      const data = await res.json();
      setAsset(data.asset);
      setIssues(data.issues || []);
      setRecords(data.serviceRecords || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch asset information");
      router.push("/dashboard/assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetDetails();
    // Get current user role
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserRole(d.user?.role || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!asset) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/assets/${asset._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success("Asset status updated!");
        fetchAssetDetails();
      } else {
        toast.error("Failed to update asset status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!asset) return;
    if (
      !confirm(
        `Delete "${asset.name}"? This will also remove all linked data. Cannot be undone.`,
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/assets/${asset._id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Asset deleted");
        router.push("/dashboard/assets");
      } else {
        toast.error(data.message || "Delete failed");
        setDeleting(false);
      }
    } catch {
      toast.error("Network error");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-112.5 lg:col-span-2 bg-slate-800 animate-pulse rounded-2xl"></div>
          <div className="h-112.5 bg-slate-800 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!asset) return <div className="text-slate-400">Asset not found.</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      case "under_maintenance":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/25";
      case "faulty":
        return "bg-red-500/10 text-red-400 border-red-500/25";
      default:
        return "bg-slate-700/35 text-slate-400 border-slate-700/50";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/assets"
            className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-extrabold text-white">
                {asset.name}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(asset.status)}`}
              >
                {asset.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Asset Tag: {asset.assetTag}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/asset/${asset.assetTag}/public`}
            target="_blank"
            className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-cyan-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            Scan Preview
          </Link>
          {/* Edit — Admin/Supervisor only */}
          {["Administrator", "Supervisor"].includes(userRole) && (
            <Link
              href={`/dashboard/assets/${asset._id}/edit`}
              className="px-4 py-2.5 border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Asset
            </Link>
          )}
          {/* Delete — Admin/Supervisor only */}
          {["Administrator", "Supervisor"].includes(userRole) && (
            <button
              onClick={handleDeleteAsset}
              disabled={deleting}
              className="px-4 py-2.5 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {deleting ? (
                <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: General Profile Specifications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
            <h3 className="font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Technical Specifications
            </h3>

            {/* Grid details */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                  Category
                </span>
                <span className="text-white font-semibold">
                  {asset.category}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                  Organization / Dept
                </span>
                <span className="text-white font-semibold">
                  {asset.organization || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                  Manufacturer
                </span>
                <span className="text-slate-300">
                  {asset.manufacturer || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                  Model Number
                </span>
                <span className="text-slate-300">{asset.model || "N/A"}</span>
              </div>
              <div className="col-span-2 border-t border-slate-850 my-1 pt-3">
                <span className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                  Serial Number
                </span>
                <span className="text-slate-300 font-mono text-xs">
                  {asset.serialNumber || "N/A"}
                </span>
              </div>

              {/* Physical placement */}
              <div className="col-span-2 border-t border-slate-850 pt-4 flex gap-6 items-center">
                <div className="bg-slate-950 p-2.5 rounded-xl text-cyan-400">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Placement Location
                  </span>
                  <span className="text-slate-300 font-semibold text-xs mt-0.5">
                    {asset.location.building || "No Building"} /{" "}
                    {asset.location.floor || "No Floor"} /{" "}
                    {asset.location.room || "No Room"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-slate-850 pt-4 space-y-1.5">
              <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">
                Details Description
              </span>
              <p className="text-slate-400 text-sm leading-relaxed">
                {asset.description ||
                  "No description provided for this physical asset."}
              </p>
            </div>
          </div>

          {/* Dates information */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Lifecycle Dates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl text-center">
                <span className="block text-slate-500 uppercase font-bold tracking-wider mb-1">
                  Purchase Date
                </span>
                <span className="text-white font-semibold">
                  {asset.purchaseDate
                    ? new Date(asset.purchaseDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl text-center">
                <span className="block text-slate-500 uppercase font-bold tracking-wider mb-1">
                  Warranty Expiry
                </span>
                <span className="text-white font-semibold">
                  {asset.warrantyExpiry
                    ? new Date(asset.warrantyExpiry).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl text-center">
                <span className="block text-slate-500 uppercase font-bold tracking-wider mb-1">
                  Last Serviced
                </span>
                <span className="text-emerald-400 font-semibold">
                  {asset.lastServiceDate
                    ? new Date(asset.lastServiceDate).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl text-center">
                <span className="block text-slate-500 uppercase font-bold tracking-wider mb-1">
                  Next Service Due
                </span>
                <span className="text-cyan-400 font-semibold">
                  {asset.nextServiceDate
                    ? new Date(asset.nextServiceDate).toLocaleDateString()
                    : "Not Scheduled"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: QR Identity card and actions */}
        <div className="space-y-6">
          {/* QR Identity Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center flex flex-col items-center justify-center">
            <h3 className="font-bold text-white border-b border-slate-800 pb-3 mb-6 w-full flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-cyan-400" />
              Digital Asset Identity
            </h3>

            {asset.qrCodeUrl ? (
              <div className="space-y-6 flex flex-col items-center">
                <div className="bg-white p-3 rounded-2xl border border-slate-700 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.qrCodeUrl}
                    alt={`${asset.name} QR Tag`}
                    className="w-48 h-48 rounded"
                  />
                </div>
                <div className="text-xs text-slate-400 leading-relaxed max-w-55">
                  Affix this code to the physical asset. Anyone can scan it to
                  submit failure tickets.
                </div>
                <a
                  href={asset.qrCodeUrl}
                  download={`QR-${asset.assetTag}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </a>
              </div>
            ) : (
              <div className="p-8 text-slate-500">
                QR code failed to generate.
              </div>
            )}
          </div>

          {/* Statusoverride control */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Status override
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Set Operational Status
              </label>
              <select
                disabled={updatingStatus}
                value={asset.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-850 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm disabled:opacity-50"
              >
                <option value="operational">Operational (Online)</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="faulty">Faulty (Breakdown)</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket log and Service History Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-slate-800 pt-8">
        {/* Active tickets */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            Failure Ticketing Log ({issues.length})
          </h3>

          {issues.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No reported issues for this asset.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {issues.map((issue) => (
                <div
                  key={issue._id}
                  className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {issue.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                      <span>&bull;</span>
                      <span className="capitalize">
                        {issue.priority} Priority
                      </span>
                      {issue.assignedTo && (
                        <>
                          <span>&bull;</span>
                          <span>Assigned: {issue.assignedTo.username}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        issue.status === "resolved"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-cyan-500/10 text-cyan-400"
                      }`}
                    >
                      {issue.status}
                    </span>
                    <Link
                      href={`/dashboard/issues/${issue._id}`}
                      className="p-1 text-slate-500 hover:text-white transition-colors"
                    >
                      &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance records */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Permanent Service Ledger ({records.length})
          </h3>

          {records.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No maintenance entries saved.
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1 relative pl-4 border-l border-slate-800">
              {records.map((record) => (
                <div
                  key={record._id}
                  className="relative space-y-1 bg-slate-950 p-4 border border-slate-850 rounded-xl"
                >
                  {/* Timeline point */}
                  <span className="absolute -left-5.5 top-5.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900"></span>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-black bg-emerald-500/10 text-emerald-400">
                      {record.serviceType}
                    </span>
                  </div>

                  <h5 className="font-bold text-sm text-white">
                    {record.title}
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {record.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-900 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      Cost:{" "}
                      <strong className="text-white font-medium">
                        ${record.cost}
                      </strong>
                    </span>
                    <span>Done: {record.performedBy?.username || "Staff"}</span>
                  </div>

                  {record.partsReplaced && record.partsReplaced.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2">
                      <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="text-[10px] text-slate-500 mr-1 font-bold">
                        Parts:
                      </span>
                      {record.partsReplaced.map((part, pIdx) => (
                        <span
                          key={pIdx}
                          className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
