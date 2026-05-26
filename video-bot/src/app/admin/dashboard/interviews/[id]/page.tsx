"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Interview, TranscriptEntry } from "@/types";
import { InterviewPlayerLayout } from "@/components/interview-player-layout";
import { formatDateTime, getShareUrl, timeAgo, copyToClipboard } from "@/lib/utils";
import { Logo } from "@/components/logo";
import {
  ArrowLeft,
  Video,
  Download,
  Share2,
  Copy,
  CheckCircle2,
  Clock,
  MessageSquare,
  Loader2,
  Play,
  User,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function InterviewReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);



  const fetchInterview = useCallback(async () => {
    try {
      const res = await fetch(`/api/interviews/${id}`);
      const { data } = await res.json();
      setInterview(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  const copyShareLink = async () => {
    if (!interview) return;
    copyToClipboard(getShareUrl(interview.share_token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!interview?.video_url) return;
    const a = document.createElement("a");
    a.href = interview.video_url;
    a.download = `${interview.candidate_name.replace(/\s+/g, "-")}-interview.webm`;
    a.click();
  };

  const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || "http://localhost:5173";

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this interview? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/interviews/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.href = PORTAL_URL;
      }
    } catch (err) {
      console.error("Failed to delete interview", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/20" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center text-center">
        <div>
          <p className="text-white/50 text-lg mb-4">Interview not found</p>
          <a href={PORTAL_URL}>
            <Button variant="outline" className="border-white/10 text-white/60">
              Back to dashboard
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050810]">
      {/* Top nav */}
      <div className="border-b border-white/[0.06] bg-[#080c14] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href={PORTAL_URL} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <Logo href={PORTAL_URL} size="sm" />
          <span className="text-white/20">/</span>
          <span className="text-white/60 text-sm">Interview Review</span>
        </div>

        <div className="flex items-center gap-2">
          {interview.status === "completed" && (
            <>
              <Button
                onClick={copyShareLink}
                variant="outline"
                size="sm"
                className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 gap-2"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Share review"}
              </Button>
              {interview.video_url && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Candidate info card */}
        <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {interview.candidate_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">{interview.candidate_name}</h1>
            <p className="text-white/40 text-sm">{interview.candidate_email} · {interview.job_role}</p>
          </div>
          <Badge variant={interview.status === "completed" ? "completed" : "pending"}>
            {interview.status === "completed" ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
          </Badge>
        </div>

        <InterviewPlayerLayout interview={interview} />

        {/* Details section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-white/30 text-xs mb-1">Created</p>
                <p className="text-white/70 text-sm">{formatDateTime(interview.created_at)}</p>
                <p className="text-white/30 text-xs mt-0.5">{timeAgo(interview.created_at)}</p>
              </div>
              {interview.completed_at && (
                <div>
                  <p className="text-white/30 text-xs mb-1">Completed</p>
                  <p className="text-white/70 text-sm">{formatDateTime(interview.completed_at)}</p>
                </div>
              )}
              <div>
                <p className="text-white/30 text-xs mb-1">Expires</p>
                <p className="text-white/70 text-sm">{formatDateTime(interview.expires_at)}</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">
              Questions ({interview.questions.length})
            </h3>
            <div className="space-y-3">
              {interview.questions.map((q: string, i: number) => (
                <div key={i} className="flex gap-3">
                  <span className="text-white/20 text-xs font-mono mt-0.5">Q{i + 1}</span>
                  <p className="text-white/50 text-sm leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </div>

          {interview.status === "completed" && (
            <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Share Link</h3>
              <p className="text-white/30 text-xs mb-3">
                Share this link to give read-only access to this candidate&apos;s review
              </p>
              <button
                onClick={copyShareLink}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 text-sm transition-all"
              >
                {copied ? (
                  <><CheckCircle2 className="w-4 h-4 text-emerald-400" />Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" />Copy share link</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
