"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  UserCircle,
  Trash2,
  ChevronDown,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

interface UserRow {
  _id: string;
  username: string;
  email: string;
  role: "Administrator" | "Supervisor" | "Technician" | "Reporter";
  createdAt: string;
  verify?: { status: boolean };
}

const ROLE_STYLES: Record<string, string> = {
  Administrator: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Supervisor:    "bg-cyan-500/10    text-cyan-400    border-cyan-500/20",
  Technician:    "bg-blue-500/10    text-blue-400    border-blue-500/20",
  Reporter:      "bg-slate-700/40   text-slate-400   border-slate-600/30",
};

const ROLE_ICON: Record<string, React.ReactNode> = {
  Administrator: <ShieldAlert className="w-3.5 h-3.5" />,
  Supervisor:    <ShieldCheck className="w-3.5 h-3.5" />,
  Technician:    <Wrench className="w-3.5 h-3.5" />,
  Reporter:      <UserCircle className="w-3.5 h-3.5" />,
};

// Roles Admin can assign through UI (Administrator must be DB-only)
const ASSIGNABLE_ROLES = ["Supervisor", "Technician", "Reporter"] as const;

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      // Verify current user is Administrator
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (!meRes.ok || meData.user?.role !== "Administrator") {
        toast.error("Access denied. Administrators only.");
        router.push("/dashboard");
        return;
      }
      setCurrentUserId(meData.user._id);

      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, role: newRole as UserRow["role"] } : u,
          ),
        );
      } else {
        toast.error(data.message || "Role update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${username} deleted.`);
        setUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  // Role counts for summary bar
  const counts = users.reduce(
    (acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 bg-slate-800 animate-pulse rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-900 border border-slate-800 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-cyan-400" />
          User Management
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Assign roles to registered users. Administrator role can only be set directly in the database.
        </p>
      </div>

      {/* Role restriction notice */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/80 leading-relaxed">
          <strong className="text-amber-300">Administrator role</strong> can only be granted directly
          via the MongoDB database (for security). Use MongoDB Atlas or Compass to set{" "}
          <code className="bg-slate-800 px-1 py-0.5 rounded">role: &quot;Administrator&quot;</code> on a user document.
          All other roles (Supervisor, Technician, Reporter) can be changed here.
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["Administrator", "Supervisor", "Technician", "Reporter"] as const).map((r) => (
          <div key={r} className={`rounded-xl border p-3.5 ${ROLE_STYLES[r]}`}>
            <div className="flex items-center gap-2 mb-1">
              {ROLE_ICON[r]}
              <span className="text-[11px] font-black uppercase tracking-wider">{r}</span>
            </div>
            <span className="text-2xl font-extrabold">{counts[r] || 0}</span>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead className="bg-slate-950/50 text-xs font-bold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4 text-left">User</th>
                <th className="px-5 py-4 text-left">Email</th>
                <th className="px-5 py-4 text-left">Current Role</th>
                <th className="px-5 py-4 text-left">Change Role</th>
                <th className="px-5 py-4 text-left">Joined</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((user) => {
                const isSelf = user._id === currentUserId;
                const isAdmin = user.role === "Administrator";
                const isUpdating = updatingId === user._id;
                const isDeleting = deletingId === user._id;

                return (
                  <tr key={user._id} className="hover:bg-slate-800/20 transition-colors">
                    {/* Name */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 uppercase shrink-0">
                          {user.username[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {user.username}
                            {isSelf && (
                              <span className="ml-2 text-[10px] text-cyan-400 font-bold">(you)</span>
                            )}
                          </div>
                          {user.verify && (
                            <span className={`text-[10px] font-semibold ${user.verify.status ? "text-emerald-400" : "text-slate-500"}`}>
                              {user.verify.status ? "✓ Verified" : "Not verified"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400 text-xs">
                      {user.email}
                    </td>

                    {/* Current Role Badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${ROLE_STYLES[user.role]}`}>
                        {ROLE_ICON[user.role]}
                        {user.role}
                      </span>
                    </td>

                    {/* Role Change Dropdown */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {isSelf || isAdmin ? (
                        <span className="text-xs text-slate-600 italic">
                          {isSelf ? "Cannot change own role" : "Admin — change via DB"}
                        </span>
                      ) : (
                        <div className="relative inline-block">
                          <select
                            disabled={isUpdating}
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            className="appearance-none pl-3 pr-8 py-1.5 bg-slate-950 border border-slate-700 text-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 cursor-pointer"
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                          {isUpdating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 rounded-lg">
                              <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Delete */}
                    <td className="px-5 py-4 text-right">
                      {isSelf || isAdmin ? (
                        <span className="text-xs text-slate-700">—</span>
                      ) : (
                        <button
                          onClick={() => handleDelete(user._id, user.username)}
                          disabled={isDeleting}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-40"
                          title="Delete user"
                        >
                          {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="p-12 text-center text-slate-500 text-sm">
              No users found.
            </div>
          )}
        </div>
      </div>

      {/* How to make first Admin */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          How to Grant Administrator Access
        </h3>
        <ol className="space-y-2 text-xs text-slate-400 leading-relaxed list-decimal list-inside">
          <li>Register a normal account on <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">/auth/register</code></li>
          <li>Open <strong className="text-slate-300">MongoDB Atlas</strong> → your cluster → database → <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">users</code> collection</li>
          <li>Find the user document by email</li>
          <li>
            Click <strong className="text-slate-300">Edit</strong> and change:
            <code className="ml-1 bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">&quot;role&quot;: &quot;Administrator&quot;</code>
          </li>
          <li>Save — that user now has full Admin access on next login</li>
        </ol>
        <p className="text-xs text-slate-600 mt-3">
          Or run this in MongoDB Shell:{" "}
          <code className="text-cyan-500/80">
            db.users.updateOne(&#123; email: &quot;you@example.com&quot; &#125;, &#123; $set: &#123; role: &quot;Administrator&quot; &#125; &#125;)
          </code>
        </p>
      </div>
    </div>
  );
}
