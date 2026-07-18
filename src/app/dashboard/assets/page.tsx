"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  QrCode,
  Download,
  Eye,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

interface Asset {
  _id: string;
  name: string;
  assetTag: string;
  category: string;
  location: {
    building: string;
    floor: string;
    room: string;
  };
  status: "operational" | "under_maintenance" | "decommissioned" | "faulty";
  qrCodeUrl: string;
  createdAt: string;
}

export default function AssetsList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [userRole, setUserRole] = useState<string>("");

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (status) params.append("status", status);

      const res = await fetch(`/api/assets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load assets");
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch assets register");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserRole(d.user?.role || ""))
      .catch(() => setUserRole(""));

    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssets();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "under_maintenance":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "faulty":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-700/30 text-slate-400 border-slate-700/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            Asset Inventory
          </h2>
          <p className="text-sm text-slate-400">
            Manage facility assets, monitor status, and export QR codes.
          </p>
        </div>
        {["Administrator", "Supervisor"].includes(userRole) && (
          <Link
            href="/dashboard/assets/new"
            className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all text-sm shadow-lg shadow-cyan-500/10 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            Add New Asset
          </Link>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row gap-4 items-center justify-between"
        >
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Search by asset name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
            />
          </div>

          <div className="flex flex-wrap w-full md:w-auto items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span>Filters:</span>
            </div>

            {/* Category Select */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            >
              <option value="">All Categories</option>
              <option value="HVAC">HVAC</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Fire Safety">Fire Safety</option>
              <option value="IT Equipment">IT Equipment</option>
              <option value="Furniture">Furniture</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Medical Equipment">Medical Equipment</option>
              <option value="Kitchen Equipment">Kitchen Equipment</option>
              <option value="Other">Other</option>
            </select>

            {/* Status Select */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="operational">Operational</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="faulty">Faulty</option>
              <option value="decommissioned">Decommissioned</option>
            </select>
          </div>
        </form>
      </div>

      {/* Asset Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-slate-900 border border-slate-800 animate-pulse rounded-xl"
            ></div>
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="font-bold text-white mb-2">No Assets Found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            Register your physical assets to generate their QR codes and start
            tracking maintenance issues.
          </p>
          <Link
            href="/dashboard/assets/new"
            className="inline-flex px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 text-xs transition-all"
          >
            Register First Asset
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/40 text-xs font-bold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Asset Detail</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">QR Link</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assets.map((asset) => (
                  <tr
                    key={asset._id}
                    className="hover:bg-slate-800/20 transition-colors"
                  >
                    {/* Name and Tag */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-white">{asset.name}</div>
                      <span className="text-xs text-slate-500 font-mono font-semibold">
                        {asset.assetTag}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-slate-300 font-medium">
                        {asset.category}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      <div className="text-xs leading-relaxed">
                        {asset.location.building && (
                          <span>Bldg: {asset.location.building}</span>
                        )}
                        {asset.location.floor && (
                          <span className="block">
                            Flr: {asset.location.floor}
                          </span>
                        )}
                        {asset.location.room && (
                          <span className="block">
                            Rm: {asset.location.room}
                          </span>
                        )}
                        {!asset.location.building &&
                          !asset.location.floor &&
                          !asset.location.room && <span>N/A</span>}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(asset.status)}`}
                      >
                        {asset.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* QR Code preview */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asset.qrCodeUrl ? (
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={asset.qrCodeUrl}
                            alt="QR code"
                            className="w-10 h-10 rounded border border-slate-700 bg-white p-0.5"
                          />
                          <a
                            href={asset.qrCodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">
                          No QR URL
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-3.5">
                        <Link
                          href={`/dashboard/assets/${asset._id}`}
                          className="font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Profile
                        </Link>
                        <Link
                          href={`/asset/${asset.assetTag}/public`}
                          target="_blank"
                          className="font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Public Page
                        </Link>
                      </div>
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
