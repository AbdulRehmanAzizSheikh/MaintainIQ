"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";

interface AssetForm {
  name: string;
  category: string;
  status: string;
  description: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  organization: string;
  purchaseDate: string;
  warrantyExpiry: string;
  nextServiceDate: string;
  location: { building: string; floor: string; room: string };
}

const EMPTY: AssetForm = {
  name: "",
  category: "Other",
  status: "operational",
  description: "",
  manufacturer: "",
  model: "",
  serialNumber: "",
  organization: "",
  purchaseDate: "",
  warrantyExpiry: "",
  nextServiceDate: "",
  location: { building: "", floor: "", room: "" },
};

export default function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<AssetForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Check role first
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!["Administrator", "Supervisor"].includes(d.user?.role)) {
          toast.error("Only Administrators and Supervisors can edit assets.");
          router.push("/dashboard/assets");
        }
      })
      .catch(() => router.push("/dashboard/assets"));

    // Load asset data
    fetch(`/api/assets/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.asset) {
          router.push("/dashboard/assets");
          return;
        }
        const a = d.asset;
        setForm({
          name: a.name || "",
          category: a.category || "Other",
          status: a.status || "operational",
          description: a.description || "",
          manufacturer: a.manufacturer || "",
          model: a.model || "",
          serialNumber: a.serialNumber || "",
          organization: a.organization || "",
          purchaseDate: a.purchaseDate ? a.purchaseDate.slice(0, 10) : "",
          warrantyExpiry: a.warrantyExpiry ? a.warrantyExpiry.slice(0, 10) : "",
          nextServiceDate: a.nextServiceDate
            ? a.nextServiceDate.slice(0, 10)
            : "",
          location: {
            building: a.location?.building || "",
            floor: a.location?.floor || "",
            room: a.location?.room || "",
          },
        });
      })
      .catch(() => router.push("/dashboard/assets"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Asset name is required");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        category: form.category,
        status: form.status,
        description: form.description,
        manufacturer: form.manufacturer,
        model: form.model,
        serialNumber: form.serialNumber,
        organization: form.organization,
        location: form.location,
      };
      if (form.purchaseDate) body.purchaseDate = form.purchaseDate;
      if (form.warrantyExpiry) body.warrantyExpiry = form.warrantyExpiry;
      if (form.nextServiceDate) body.nextServiceDate = form.nextServiceDate;

      const res = await fetch(`/api/assets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Asset updated!");
        router.push(`/dashboard/assets/${id}`);
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof AssetForm,
    type = "text",
    placeholder = "",
  ) => (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
      />
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-800 animate-pulse rounded" />
        <div className="h-96 bg-slate-900 border border-slate-800 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/assets/${id}`}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-white">Edit Asset</h2>
          <p className="text-sm text-slate-400">
            Administrator only — changes saved to database immediately.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left column */}
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3">
                Primary Details
              </h3>
              {field(
                "Asset Name *",
                "name",
                "text",
                "e.g. Server Room AC Unit",
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                  {[
                    "HVAC",
                    "Electrical",
                    "Plumbing",
                    "Fire Safety",
                    "IT Equipment",
                    "Furniture",
                    "Vehicle",
                    "Medical Equipment",
                    "Kitchen Equipment",
                    "Other",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                  <option value="operational">Operational</option>
                  <option value="under_maintenance">Under Maintenance</option>
                  <option value="faulty">Faulty</option>
                  <option value="decommissioned">Decommissioned</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Brief description of this asset..."
                  className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none"
                />
              </div>

              {field(
                "Department / Org",
                "organization",
                "text",
                "e.g. IT Department",
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3">
                Location
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Building
                  </label>
                  <input
                    type="text"
                    value={form.location.building}
                    placeholder="Block A"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        location: {
                          ...form.location,
                          building: e.target.value,
                        },
                      })
                    }
                    className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={form.location.floor}
                    placeholder="2nd Floor"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        location: { ...form.location, floor: e.target.value },
                      })
                    }
                    className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Room
                  </label>
                  <input
                    type="text"
                    value={form.location.room}
                    placeholder="Room 204"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        location: { ...form.location, room: e.target.value },
                      })
                    }
                    className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3">
                Manufacturer Info
              </h3>
              {field(
                "Manufacturer",
                "manufacturer",
                "text",
                "e.g. Daikin, Dell",
              )}
              {field("Model Number", "model", "text", "e.g. FTKF50TV")}
              {field("Serial Number", "serialNumber", "text", "e.g. SN-847293")}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3">
                Lifecycle Dates
              </h3>
              {field("Purchase Date", "purchaseDate", "date")}
              {field("Warranty Expiry", "warrantyExpiry", "date")}
              {field("Next Service Date", "nextServiceDate", "date")}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
          <Link
            href={`/dashboard/assets/${id}`}
            className="px-5 py-2.5 text-sm font-bold text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
