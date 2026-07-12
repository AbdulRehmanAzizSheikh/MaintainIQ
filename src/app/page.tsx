"use client";

import Link from "next/link";
import {
  Wrench,
  Shield,
  QrCode,
  Cpu,
  ArrowRight,
  Building,
  CheckCircle2,
  History,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-cyan-500 selection:text-slate-900">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>

      {/* Header */}
      <header className="border-b border-slate-800 backdrop-blur-md sticky top-0 z-50 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500 p-2 rounded-lg text-slate-950 font-bold flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Maintain<span className="text-cyan-400">IQ</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a
              href="#features"
              className="hover:text-cyan-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#sectors"
              className="hover:text-cyan-400 transition-colors"
            >
              Sectors
            </a>
            <a
              href="#how-it-works"
              className="hover:text-cyan-400 transition-colors"
            >
              Workflow
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-semibold bg-cyan-500 text-slate-950 px-4 py-2 rounded-lg hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
            >
              Register Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-400 mb-6 animate-pulse">
            <Shield className="w-3.5 h-3.5" />
            Empowering Facilities with Digital Asset Ledgers
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 leading-tight animate-fade-in">
            Give Every Asset a{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Digital Identity
            </span>{" "}
            & Permanent Service History
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Scan QR codes to report issues, receive instant AI diagnostics,
            coordinate assignments with technicians, and track accountability
            through a verified service history.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-8 h-14 bg-cyan-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 group"
            >
              Create Free Team Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 h-14 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center transition-all"
            >
              Access Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="py-20 bg-slate-900/50 border-t border-slate-800 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4">
              Unlocking Professional Maintenance Value
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              MaintainIQ is not just about QR codes. It handles full triage,
              technicians workflow, evidence capture, and preventive scheduling.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl backdrop-blur-sm">
              <div className="bg-cyan-500/10 text-cyan-400 p-3 rounded-xl w-fit mb-6">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-3">QR Public Portals</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Scan equipment QR labels to access public status pages. Report
                failures anonymously with photos and contact details instantly.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl backdrop-blur-sm">
              <div className="bg-purple-500/10 text-purple-400 p-3 rounded-xl w-fit mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-3">AI Recommendations</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Generative AI analyzes reported issues, generates root-cause
                hypotheses, maps immediate safety procedures, and estimates
                repair durations.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl backdrop-blur-sm">
              <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl w-fit mb-6">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-3">Triage & Assignment</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Supervisors allocate open tickets to technicians based on
                workload. Track statuses in real-time from assigned to resolved.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl backdrop-blur-sm">
              <div className="bg-green-500/10 text-green-400 p-3 rounded-xl w-fit mb-6">
                <History className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-3">Permanent History</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Every repair logs parts replaced, maintenance costs, and
                before/after images in a permanent service registry for
                auditing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sectors Grid */}
      <section id="sectors" className="py-20 border-t border-slate-800 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4">
              Tailored For Any Physical Workspace
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              MaintainIQ is designed to support assets in diverse settings,
              giving physical operations audit-ready visibility.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { label: "Schools & Universities", icon: Building },
              { label: "Hospitals & Clinics", icon: Building },
              { label: "Offices & Coworking", icon: Building },
              { label: "Factories & Warehouses", icon: Building },
              { label: "Housing & Real Estate", icon: Building },
              { label: "Hotels & Restaurants", icon: Building },
            ].map((sector, i) => (
              <div
                key={i}
                className="bg-slate-800/30 border border-slate-800 p-6 rounded-xl text-center flex flex-col items-center justify-center hover:border-cyan-500/30 transition-colors"
              >
                <sector.icon className="w-8 h-8 text-cyan-400 mb-4" />
                <span className="text-sm font-semibold text-slate-300">
                  {sector.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow steps */}
      <section
        id="how-it-works"
        className="py-20 bg-slate-950 border-t border-slate-800 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-16">
            The Incident Triage Lifecycle
          </h2>

          <div className="space-y-12">
            {[
              {
                step: "01",
                title: "QR Scan & Reporting",
                desc: "An occupant, student, or staff scans the asset's QR code. They report a faulty AC, leaking pipe, or broken light with an optional photo upload. No authentication is required for report submission.",
              },
              {
                step: "02",
                title: "AI Analysis",
                desc: "Our platform immediately requests Google Gemini diagnostics. The AI identifies potential root causes, offers initial troubleshooting advice, drafts a safety check, and assigns priority tags.",
              },
              {
                step: "03",
                title: "Assignment & Execution",
                desc: "The supervisor assigns the open issue to an active technician. The technician logs in, inspects the AI diagnostics, executes repairs, and logs completion, before/after evidence, parts replaced, and costs.",
              },
              {
                step: "04",
                title: "Service Records ledger",
                desc: "The system logs a permanent service record, updates the asset status back to operational, schedules the next preventive checks, and completes the accountability chain.",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 items-start md:items-center">
                <div className="text-4xl md:text-5xl font-black text-cyan-500/30 tracking-tight">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-900 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500 p-1.5 rounded text-slate-950 font-bold">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-white">
              Maintain<span className="text-cyan-400">IQ</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} MaintainIQ. Built for saylani
            hackathon batch-17.
          </p>
        </div>
      </footer>
    </div>
  );
}
