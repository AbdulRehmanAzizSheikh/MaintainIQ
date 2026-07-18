"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Wrench,
  LayoutDashboard,
  Boxes,
  AlertTriangle,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Loader2,
  ClipboardList,
  Users,
  ShieldAlert,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: "Administrator" | "Technician" | "Reporter" | "Supervisor";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("Session expired. Please log in.");
        const data = await res.json();
        setUser(data.user);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to load user profile";
        toast.error(msg);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (!loading && user?.role === "Reporter" && pathname !== "/dashboard") {
      router.replace("/dashboard");
    }
  }, [loading, user, pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  const navItems = [
    {
      name: "Dashboard Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
      roles: ["Administrator", "Supervisor", "Technician", "Reporter"],
    },
    {
      name: "Asset Registry",
      href: "/dashboard/assets",
      icon: Boxes,
      exact: false,
      roles: ["Administrator", "Supervisor", "Technician"],
    },
    {
      name: "Issue Triage",
      href: "/dashboard/issues",
      icon: AlertTriangle,
      exact: false,
      roles: ["Administrator", "Supervisor", "Technician"],
    },
    {
      name: "Service History",
      href: "/dashboard/service-history",
      icon: ClipboardList,
      exact: false,
      roles: ["Administrator", "Supervisor", "Technician"],
    },
    {
      name: "User Management",
      href: "/dashboard/users",
      icon: Users,
      exact: false,
      roles: ["Administrator"], // Admin only
    },
  ];

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-semibold tracking-wide">
          Loading MaintainIQ Workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      <Toaster position="top-right" />

      {/* Mobile Top Bar */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-cyan-500 p-1.5 rounded-lg text-slate-950">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg text-white">
            Maintain<span className="text-cyan-400">IQ</span>
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-300 hover:text-white p-1 focus:outline-none"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200 ease-in-out md:static flex flex-col w-64 bg-slate-900 border-r border-slate-800 z-50 shrink-0`}
      >
        {/* Brand */}
        <div className="hidden md:flex items-center gap-2.5 px-6 py-6 border-b border-slate-800">
          <div className="bg-cyan-500 p-2 rounded-xl text-slate-950 font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Maintain<span className="text-cyan-400">IQ</span>
          </span>
        </div>

        {/* User Card */}
        <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-cyan-500/10 text-cyan-400 p-2.5 rounded-xl shrink-0">
            <UserIcon className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-slate-200 text-sm truncate">
              {user?.username}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">
                Role
              </span>
              <span className="inline-flex text-[10px] uppercase font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/40">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems
            .filter((item) => user && item.roles.includes(user.role))
            .map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.name}
                  {item.roles.length === 1 &&
                    item.roles[0] === "Administrator" &&
                    !isActive && (
                      <ShieldAlert className="w-3.5 h-3.5 ml-auto text-purple-400 shrink-0" />
                    )}
                </Link>
              );
            })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-h-screen overflow-x-hidden">
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
