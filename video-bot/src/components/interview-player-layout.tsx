"use client";

import { useState, useRef, useEffect } from "react";
import { VideoPlayerOverlay } from "@/components/video-player-overlay";
import { MessageSquare, User, Sparkles } from "lucide-react";
import type { TranscriptEntry } from "@/types";

interface InterviewPlayerLayoutProps {
  interview: any;
}

export function InterviewPlayerLayout({ interview }: InterviewPlayerLayoutProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  
  // Create a ref for the active transcript container to auto-scroll
  const activeTranscriptRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (activeTranscriptRef.current && transcriptContainerRef.current) {
      const container = transcriptContainerRef.current;
      const activeEl = activeTranscriptRef.current;
      
      // Calculate position
      const containerHalfHeight = container.clientHeight / 2;
      const activeHalfHeight = activeEl.clientHeight / 2;
      
      container.scrollTo({
        top: activeEl.offsetTop - containerHalfHeight + activeHalfHeight,
        behavior: "smooth"
      });
    }
  }, [currentTime]);

  const handleTimestampClick = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      layoutRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const transcript = interview.transcript as TranscriptEntry[] | null;

  return (
    <div className="space-y-6">
      <div 
        ref={layoutRef} 
        className={`grid gap-6 ${isFullscreen ? 'bg-[#F8FAFC] p-6 h-screen w-screen overflow-hidden grid-cols-1 md:grid-cols-3' : 'grid-cols-1 lg:grid-cols-3'}`}
      >
        <div className={`col-span-2 ${isFullscreen ? 'h-full flex flex-col justify-center' : 'space-y-5'}`}>
          <VideoPlayerOverlay
            videoUrl={interview.video_url}
            status={interview.status}
            transcript={interview.transcript}
            onTimeUpdate={setCurrentTime}
            videoRef={videoRef}
            onToggleFullScreen={handleToggleFullScreen}
            isFullscreen={isFullscreen}
          />
        </div>

        <div className={`col-span-1 h-full ${isFullscreen ? 'overflow-hidden' : ''}`}>
          <div className={`p-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex flex-col ${isFullscreen ? 'h-full' : 'h-full max-h-[60vh] lg:max-h-[80vh]'}`}>
            <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Live Transcript
            </h3>
            
            <div 
              ref={transcriptContainerRef}
              className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
            >
              {transcript && transcript.length > 0 ? (
                transcript.map((entry: TranscriptEntry, i: number) => {
                  const isActive = currentTime >= entry.timestamp_start && currentTime <= entry.timestamp_end;
                  
                  return (
                    <div 
                      key={i} 
                      ref={isActive ? activeTranscriptRef : null}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isActive 
                          ? "bg-blue-50/80 border-blue-200 shadow-sm" 
                          : "bg-slate-50/50 border-slate-100/70 hover:bg-slate-50/80"
                      }`}
                      onClick={() => handleTimestampClick(entry.timestamp_start)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isActive ? "bg-blue-100 border border-blue-200" : "bg-slate-100 border border-slate-200"
                          }`}>
                            <span className={`text-[10px] font-bold ${isActive ? "text-blue-600" : "text-slate-500"}`}>Q</span>
                          </div>
                          <p className={`text-sm font-medium ${isActive ? "text-blue-900 font-semibold" : "text-slate-800"}`}>
                            {entry.question}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-slate-400 font-semibold">
                          {Math.floor(entry.timestamp_start / 60)}:{(Math.floor(entry.timestamp_start % 60)).toString().padStart(2, '0')}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-3 mt-3">
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-2.5 h-2.5 text-slate-500" />
                        </div>
                        <p className={`text-sm leading-relaxed ${isActive ? "text-slate-750" : "text-slate-500"}`}>
                          {entry.text || <span className="italic opacity-50">Transcribing...</span>}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <MessageSquare className="w-8 h-8 text-slate-300 mb-3" />
                  <p className="text-slate-400 text-sm">Transcript will appear here once processed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {interview.summary ? (
        <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
          <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            AI Interview Summary
          </h3>
          <div className="prose prose-slate prose-sm max-w-none text-slate-650 whitespace-pre-wrap">
            {interview.summary}
          </div>
        </div>
      ) : interview.status === "completed" ? (
        <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex flex-col items-center justify-center text-center">
          <Sparkles className="w-8 h-8 text-slate-300 mb-3 animate-pulse" />
          <h3 className="text-slate-500 text-sm font-semibold mb-1">Generating AI Summary</h3>
          <p className="text-slate-400 text-xs">The summary is being generated by Groq. Please refresh the page in a moment.</p>
        </div>
      ) : null}
    </div>
  );
}
