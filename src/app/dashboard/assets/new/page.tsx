"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wrench, ArrowLeft, Save, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function NewAsset() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    category: "Other",
    status: "operational",
    location: {
      building: "",
      floor: "",
      room: "",
    },
    description: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    warrantyExpiry: "",
    organization: "",
    nextServiceDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Asset Name is required");
      return;
    }

    setLoading(true);
    try {
      // Build body mapping dates correctly (only sending if filled)
      const submitData: Record<string, unknown> = {
        name: formData.name,
        category: formData.category,
        status: formData.status,
        location: formData.location,
        description: formData.description,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serialNumber: formData.serialNumber,
        organization: formData.organization,
      };

      if (formData.purchaseDate)
        submitData.purchaseDate = new Date(formData.purchaseDate);
      if (formData.warrantyExpiry)
        submitData.warrantyExpiry = new Date(formData.warrantyExpiry);
      if (formData.nextServiceDate)
        submitData.nextServiceDate = new Date(formData.nextServiceDate);

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Asset registered successfully!");
        router.push("/dashboard/assets");
      } else {
        toast.error(data.message || "Failed to register asset");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error creating asset");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUserRole(d.user?.role || "");
        if (!["Administrator", "Supervisor"].includes(d.user?.role)) {
          toast.error(
            "Only Administrators and Supervisors can register assets.",
          );
          router.push("/dashboard");
        }
      })
      .catch(() => router.push("/dashboard"));
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/assets"
          className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-white">Register Asset</h2>
          <p className="text-xs text-slate-400">
            Initialize a new physical asset ledger and generate its QR code.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* General and Location Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Details Card */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                Primary Specifications
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                  >
                    Asset Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="e.g. Server Room AC 1"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                  >
                    Category *
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  >
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
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                >
                  Asset Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="e.g. Wall mounted Daikin inverter AC, 1.5 ton capacity. Mounted on West wall."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none"
                />
              </div>
            </div>

            {/* Location Specs */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Physical Placement
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="building"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                  >
                    Building
                  </label>
                  <input
                    id="building"
                    type="text"
                    placeholder="e.g. Block A"
                    value={formData.location.building}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          building: e.target.value,
                        },
                      })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="floor"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                  >
                    Floor
                  </label>
                  <input
                    id="floor"
                    type="text"
                    placeholder="e.g. 2nd Floor"
                    value={formData.location.floor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          floor: e.target.value,
                        },
                      })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="room"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                  >
                    Room / Area
                  </label>
                  <input
                    id="room"
                    type="text"
                    placeholder="e.g. Server Room 204"
                    value={formData.location.room}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          room: e.target.value,
                        },
                      })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right-hand side Column for manufacturer, warranty and dates */}
          <div className="space-y-6">
            {/* Manufacturing specs */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-white border-b border-slate-800 pb-3">
                Manufacture Registry
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="manufacturer"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                  >
                    Manufacturer
                  </label>
                  <input
                    id="manufacturer"
                    type="text"
                    placeholder="e.g. Daikin, Dell"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({ ...formData, manufacturer: e.target.value })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="model"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                  >
                    Model Number
                  </label>
                  <input
                    id="model"
                    type="text"
                    placeholder="e.g. FTKF50TV16U"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="serialNumber"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                  >
                    Serial Number
                  </label>
                  <input
                    id="serialNumber"
                    type="text"
                    placeholder="e.g. SN-84729472"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, serialNumber: e.target.value })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="organization"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                  >
                    Department / Org
                  </label>
                  <input
                    id="organization"
                    type="text"
                    placeholder="e.g. IT Department"
                    value={formData.organization}
                    onChange={(e) =>
                      setFormData({ ...formData, organization: e.target.value })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Lifecycle and Dates */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-white border-b border-slate-800 pb-3">
                Operational Timeline
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="status"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                  >
                    Initial Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  >
                    <option value="operational">Operational</option>
                    <option value="under_maintenance">Under Maintenance</option>
                    <option value="faulty">Faulty (Needs Service)</option>
                    <option value="decommissioned">Decommissioned</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="purchaseDate"
                    className="block text-xs font-bold text-slate-400 tracking-wider mb-2"
                  >
                    Purchase Date
                  </label>
                  <input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="warrantyExpiry"
                    className="block text-xs font-bold text-slate-400 tracking-wider mb-2"
                  >
                    Warranty Expiry Date
                  </label>
                  <input
                    id="warrantyExpiry"
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warrantyExpiry: e.target.value,
                      })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="nextServiceDate"
                    className="block text-xs font-bold text-slate-400 tracking-wider mb-2"
                  >
                    Next Preventive Service Date
                  </label>
                  <input
                    id="nextServiceDate"
                    type="date"
                    value={formData.nextServiceDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nextServiceDate: e.target.value,
                      })
                    }
                    className="block w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-4 border-t border-slate-800 pt-6">
          <Link
            href="/dashboard/assets"
            className="px-6 py-3 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4.5 h-4.5" />
            {loading ? "Registering..." : "Save Asset"}
          </button>
        </div>
      </form>
    </div>
  );
}
