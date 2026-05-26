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
        className={`grid gap-6 ${isFullscreen ? 'bg-[#050810] p-6 h-screen w-screen overflow-hidden grid-cols-1 md:grid-cols-3' : 'grid-cols-1 lg:grid-cols-3'}`}
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
        <div className={`p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex flex-col ${isFullscreen ? 'h-full' : 'h-full max-h-[60vh] lg:max-h-[80vh]'}`}>
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-white/30" />
            Live Transcript
          </h3>
          
          <div 
            ref={transcriptContainerRef}
            className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
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
                        ? "bg-blue-500/10 border-blue-500/30" 
                        : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]"
                    }`}
                    onClick={() => handleTimestampClick(entry.timestamp_start)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isActive ? "bg-blue-500/20 border border-blue-500/30" : "bg-white/5 border border-white/10"
                        }`}>
                          <span className={`text-[10px] font-bold ${isActive ? "text-blue-400" : "text-white/40"}`}>Q</span>
                        </div>
                        <p className={`text-sm font-medium ${isActive ? "text-blue-200" : "text-white/70"}`}>
                          {entry.question}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-white/30">
                        {Math.floor(entry.timestamp_start / 60)}:{(Math.floor(entry.timestamp_start % 60)).toString().padStart(2, '0')}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-3 mt-3">
                      <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-2.5 h-2.5 text-white/40" />
                      </div>
                      <p className={`text-sm leading-relaxed ${isActive ? "text-white/90" : "text-white/40"}`}>
                        {entry.text || <span className="italic opacity-50">Transcribing...</span>}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <MessageSquare className="w-8 h-8 text-white/10 mb-3" />
                <p className="text-white/30 text-sm">Transcript will appear here once processed.</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {interview.summary ? (
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            AI Interview Summary
          </h3>
          <div className="prose prose-invert prose-sm max-w-none text-white/70 whitespace-pre-wrap">
            {interview.summary}
          </div>
        </div>
      ) : interview.status === "completed" ? (
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex flex-col items-center justify-center text-center">
          <Sparkles className="w-8 h-8 text-white/10 mb-3 animate-pulse" />
          <h3 className="text-white/50 text-sm font-semibold mb-1">Generating AI Summary</h3>
          <p className="text-white/30 text-xs">The summary is being generated by Groq. Please refresh the page in a moment.</p>
        </div>
      ) : null}
    </div>
  );
}
