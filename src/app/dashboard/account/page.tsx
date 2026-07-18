"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Camera, Lock, Save } from "lucide-react";

interface ProfileForm {
  name: string;
  email: string;
  avatarUrl: string;
  currentPassword: string;
  newPassword: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    avatarUrl: "",
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Unauthorized");
        return data;
      })
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          name: data.user.username || "",
          email: data.user.email || "",
          avatarUrl: data.user.avatarUrl || "",
        }));
      })
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageBase64 = reader.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageBase64, folder: "profile" }),
        });
        const data = await res.json();
        if (res.ok) {
          setForm((prev) => ({ ...prev, avatarUrl: data.url }));
          toast.success("Profile picture uploaded");
        } else {
          toast.error(data.message || "Upload failed");
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        avatarUrl: form.avatarUrl,
      };
      if (form.currentPassword && form.newPassword) {
        body.currentPassword = form.currentPassword;
        body.newPassword = form.newPassword;
      }
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully");
        setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
      } else {
        toast.error(data.message || "Save failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading profile…</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            Account Settings
          </h2>
          <p className="text-sm text-slate-400">
            Update your name, password, and profile photo.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-28 h-28 rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden">
              {form.avatarUrl ? (
                <img
                  src={form.avatarUrl}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  A
                </div>
              )}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white cursor-pointer hover:bg-slate-700 transition-all">
              <Camera className="w-4 h-4" /> Upload photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
            </label>
            {uploading && (
              <span className="text-xs text-slate-500">Uploading…</span>
            )}
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                Email
              </label>
              <input
                value={form.email}
                readOnly
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
              Current password
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) =>
                setForm({ ...form, currentPassword: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
              New password
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-2xl transition-all disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
