"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wrench, ShieldCheck, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

function VerifyForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) toast.error("Email not found in URL. Go back and try again.");
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Email verified! Redirecting to login…");
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 1000);
      } else {
        toast.error(data.message || "Verification failed");
        setLoading(false);
      }
    } catch {
      toast.error("Network error");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/verify/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) toast.success("New code sent!");
      else toast.error(data.message || "Could not resend");
    } catch {
      toast.error("Network error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
      <p className="text-sm text-slate-400 text-center mb-1">Code sent to:</p>
      <p className="text-sm font-bold text-cyan-400 text-center mb-6 break-all">
        {email || "unknown"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2 text-center">
            6-Digit Verification Code
          </label>
          <input
            type="text"
            maxLength={6}
            inputMode="numeric"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full py-3 text-center text-2xl font-bold tracking-widest bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Email"
          )}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-400 border-t border-slate-700/50 pt-4">
        <span>Didn&apos;t receive it?</span>
        <button
          onClick={handleResend}
          disabled={resending}
          className="flex items-center gap-1.5 font-bold text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`}
          />
          Resend Code
        </button>
      </div>

      <div className="mt-4 text-center text-xs text-slate-500">
        Already verified?{" "}
        <Link
          href="/auth/login"
          className="text-cyan-400 hover:text-cyan-300 font-semibold"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <Toaster position="top-center" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="bg-cyan-500 p-2 rounded-xl text-slate-950">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Maintain<span className="text-cyan-400">IQ</span>
            </span>
          </Link>
          <div className="mx-auto w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Verify your email
          </h2>
        </div>

        <Suspense
          fallback={
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center text-slate-400 text-sm">
              Loading...
            </div>
          }
        >
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}
