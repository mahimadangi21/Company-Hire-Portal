import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { MessageSquare, User, CheckCircle2, Play } from "lucide-react";
import { InterviewPlayerLayout } from "@/components/interview-player-layout";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("interviews")
    .select("candidate_name, job_role")
    .eq("share_token", token)
    .single();

  if (!data) return { title: "Interview Review — Happy" };
  return {
    title: `${data.candidate_name} — ${data.job_role} | Happy Interview`,
    description: `Review video interview for ${data.candidate_name} applying for ${data.job_role}`,
    robots: "noindex, nofollow",
  };
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createAdminClient();

  const { data: interview, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("share_token", token)
    .eq("status", "completed")
    .single();

  if (error || !interview) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      {/* Nav */}
      <div className="border-b border-white/[0.06] bg-[#080c14] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo href="/" size="sm" />
          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/30 text-xs">
            Candidate Review
          </span>
        </div>
        <p className="text-white/20 text-xs">Read-only view</p>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Candidate header */}
        <div className="flex items-center gap-5 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-white font-bold text-xl">
            {interview.candidate_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-white font-bold text-xl">{interview.candidate_name}</h1>
            <p className="text-white/40 text-sm mt-0.5">{interview.job_role}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </div>
          <div className="text-right">
            <p className="text-white/20 text-xs">Completed</p>
            <p className="text-white/50 text-sm mt-0.5">{formatDateTime(interview.completed_at)}</p>
          </div>
        </div>

        <InterviewPlayerLayout interview={interview} />

        {/* Notice */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <p className="text-white/20 text-xs leading-relaxed">
            This is a read-only shared view of this candidate&apos;s interview. 
            You do not have access to any other candidate or platform data.
          </p>
        </div>
      </div>
    </div>
  );
}
