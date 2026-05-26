import Link from "next/link";
import { Logo } from "@/components/logo";
import {
  Video,
  Shield,
  Zap,
  Users,
  ChevronRight,
  Play,
  CheckCircle2,
  Sparkles,
  Clock,
  Globe,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050810] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#050810]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo href="/" size="md" />
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="text-sm text-white/70 hover:text-white transition-colors font-medium px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/admin/signup"
              className="text-sm font-semibold bg-white text-[#050810] hover:bg-white/90 transition-all px-4 py-2 rounded-xl"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/60 mb-8">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>AI-powered video interviews by kadellabs</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-blue-400 font-medium">Now available</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
            <span className="text-white">Screen candidates</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              like never before
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
            Send a secure interview link. Let AI guide your candidate through 
            structured questions. Review a professionally merged video recording — 
            all in one seamless platform.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/admin/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all duration-200 text-sm shadow-lg shadow-blue-500/20"
            >
              Start for free
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white font-medium px-6 py-3.5 rounded-2xl border border-white/10 hover:border-white/20 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              See how it works
            </a>
          </div>
        </div>

        {/* Product mockup */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-[#0d1117] shadow-2xl shadow-black/50">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#080c14]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 ml-2">
                <div className="bg-white/5 rounded-md px-3 py-1 text-xs text-white/30 max-w-xs">
                  kadellabs.app/admin/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="p-6 grid grid-cols-4 gap-4">
              {/* Stats cards */}
              {[
                { label: "Total Interviews", value: "248", color: "blue" },
                { label: "Completed", value: "186", color: "emerald" },
                { label: "Pending", value: "42", color: "amber" },
                { label: "This Week", value: "20", color: "violet" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
                  <p className="text-white/40 text-xs mb-2">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <div className={`mt-2 h-1 rounded-full bg-${stat.color}-500/30 overflow-hidden`}>
                    <div className={`h-full w-3/4 bg-${stat.color}-500 rounded-full`} />
                  </div>
                </div>
              ))}

              {/* Candidate list preview */}
              <div className="col-span-4 bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-3">
                <p className="text-white/50 text-xs font-medium mb-3">Recent Candidates</p>
                {[
                  { name: "Sarah Chen", role: "Senior Engineer", status: "completed" },
                  { name: "Marcus Johnson", role: "Product Manager", status: "pending" },
                  { name: "Priya Patel", role: "Design Lead", status: "completed" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{c.name}</p>
                        <p className="text-white/40 text-xs">{c.role}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      c.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                    }`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow below */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-600/20 blur-[60px] rounded-full pointer-events-none" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold tracking-wider uppercase mb-4">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Everything you need
            </h2>
            <p className="text-white/50 mt-4 text-lg max-w-2xl mx-auto">
              A complete interview screening pipeline — from invitation to review.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "AI Voice Questions",
                description:
                  "Browser-native speech synthesis guides candidates through each question naturally, without needing an external AI service.",
                color: "blue",
              },
              {
                icon: Video,
                title: "Merged Interview Video",
                description:
                  "All candidate answers are automatically merged into one final professional video with question overlays embedded directly.",
                color: "violet",
              },
              {
                icon: Shield,
                title: "One-Time Secure Links",
                description:
                  "Each interview link is unique, expires on your set date, and locks after completion to prevent re-entry.",
                color: "emerald",
              },
              {
                icon: Users,
                title: "Shareable Review Links",
                description:
                  "Share a read-only candidate review page with hiring managers or clients — no login required, no access to other data.",
                color: "amber",
              },
              {
                icon: Globe,
                title: "Beautiful Email Invites",
                description:
                  "Send polished HTML email invitations to candidates and completion notifications to your team via Gmail.",
                color: "pink",
              },
              {
                icon: Clock,
                title: "Timestamped Transcripts",
                description:
                  "Every answer is stored with timestamps and text transcripts so you can quickly navigate to specific moments.",
                color: "cyan",
              },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                >
                  <div className={`w-10 h-10 rounded-xl bg-${feat.color}-500/10 border border-${feat.color}-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 text-${feat.color}-400`} />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feat.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-400 text-sm font-semibold tracking-wider uppercase mb-4">Workflow</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Interview in 4 steps
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                step: "01",
                title: "Create the interview",
                desc: "Enter candidate details, job role, and 3–5 custom interview questions. Set an expiration date.",
              },
              {
                step: "02",
                title: "Send the invite",
                desc: "A one-time secure link is generated and sent to the candidate via a beautiful email.",
              },
              {
                step: "03",
                title: "Candidate completes interview",
                desc: "AI reads each question aloud. Candidate records their answers one by one at their own pace.",
              },
              {
                step: "04",
                title: "Review the recording",
                desc: "A single merged video with embedded overlays appears in your dashboard — ready to review or share.",
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-6 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                <div className="text-5xl font-black text-white/[0.06] flex-shrink-0 leading-none">{s.step}</div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security section */}
      <section id="security" className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Built for trust</h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto mb-10">
            Security and privacy are built-in from day one — not an afterthought.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-left">
            {[
              "One-time interview links that expire",
              "No re-entry after completion",
              "Supabase Row Level Security",
              "Protected admin-only routes",
              "Secure cloud video storage",
              "No AI voice recorded in final video",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-white/60 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-violet-600/20 rounded-3xl blur-xl" />
            <div className="relative border border-white/10 rounded-3xl p-12 bg-white/[0.03]">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                Ready to hire smarter?
              </h2>
              <p className="text-white/50 text-lg mb-8">
                Set up your first AI video interview in under 2 minutes.
              </p>
              <Link
                href="/admin/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-200 text-base shadow-xl shadow-blue-500/20"
              >
                Get started for free
                <ChevronRight className="w-4 h-4" />
              </Link>
              <p className="text-white/30 text-sm mt-4">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <Logo href="/" size="sm" />
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} kadellabs. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-white/30">
            <Link href="/admin/login" className="hover:text-white/60 transition-colors">Admin Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
