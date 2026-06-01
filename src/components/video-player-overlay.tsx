"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Maximize } from "lucide-react";

interface TranscriptEntry {
  question: string;
  text?: string;
  timestamp_start: number;
  timestamp_end: number;
}

interface VideoPlayerOverlayProps {
  videoUrl: string | null;
  status: string;
  transcript?: any; // any because it comes from DB Json
  onTimeUpdate?: (time: number) => void;
  videoRef?: any;
  onToggleFullScreen?: () => void;
  isFullscreen?: boolean;
}

export function VideoPlayerOverlay({ videoUrl, status, transcript, onTimeUpdate, videoRef, onToggleFullScreen, isFullscreen }: VideoPlayerOverlayProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [activeClipIndex, setActiveClipIndex] = useState<number | null>(null);

  const handleFullScreen = () => {
    if (onToggleFullScreen) {
      onToggleFullScreen();
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const resolvedVideoUrl = (() => {
    if (!videoUrl) return "/sample-video.mp4";
    const clean = String(videoUrl).trim();
    if (clean === "" || clean === "—" || clean === "null" || clean === "undefined" || clean.includes("mixkit.co")) {
      return "/sample-video.mp4";
    }
    return clean;
  })();

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-[#E2E8F0] bg-black shadow-md flex flex-col items-center justify-center group h-full w-full ${isFullscreen ? '' : 'aspect-video'}`}>
      {resolvedVideoUrl ? (
        <>
          <video
            ref={videoRef}
            src={resolvedVideoUrl}
            controls
            controlsList="nofullscreen"
            className="w-full flex-1 object-contain min-h-0"
            onTimeUpdate={(e) => {
              const time = e.currentTarget.currentTime;
              setCurrentTime(time);
              if (onTimeUpdate) onTimeUpdate(time);
              if (!videoDuration && !isNaN(e.currentTarget.duration)) {
                setVideoDuration(e.currentTarget.duration);
              }
              
              if (activeClipIndex !== null && videoRef && videoRef.current && transcript && transcript[activeClipIndex]) {
                const endTime = transcript[activeClipIndex].timestamp_end;
                if (endTime && videoRef.current.currentTime >= endTime) {
                  videoRef.current.pause();
                  setActiveClipIndex(null);
                }
              }
            }}
          />
          
          <button 
            onClick={handleFullScreen}
            className="absolute bottom-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-lg text-white transition-colors opacity-0 group-hover:opacity-100"
            title="Full Screen"
          >
            <Maximize className="w-4 h-4" />
          </button>
          
          {transcript && transcript.length > 0 && (
            <div className="w-full flex gap-2 overflow-x-auto p-2 bg-[#1e293b] flex-shrink-0 z-50 items-center justify-center">
              <button
                onClick={() => {
                  if (activeClipIndex !== null && activeClipIndex > 0) {
                    const prevIndex = activeClipIndex - 1;
                    if (videoRef && videoRef.current) {
                      videoRef.current.currentTime = transcript[prevIndex].timestamp_start || 0;
                      videoRef.current.play().catch(console.error);
                      setActiveClipIndex(prevIndex);
                    }
                  }
                }}
                disabled={activeClipIndex === null || activeClipIndex === 0}
                className="px-2 py-1 text-xs font-bold bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &larr; Prev
              </button>
              
              <div className="flex gap-2 overflow-x-auto">
                {transcript.map((t: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (videoRef && videoRef.current) {
                        videoRef.current.currentTime = t.timestamp_start || 0;
                        videoRef.current.play().catch(console.error);
                        setActiveClipIndex(i);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded shadow-sm border transition-all whitespace-nowrap
                      ${activeClipIndex === i 
                        ? 'bg-emerald-500 text-white border-emerald-400' 
                        : 'bg-slate-700 text-white hover:bg-slate-600 border-slate-600'
                      }`}
                  >
                    Q{i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (activeClipIndex !== null && activeClipIndex < transcript.length - 1) {
                    const nextIndex = activeClipIndex + 1;
                    if (videoRef && videoRef.current) {
                      videoRef.current.currentTime = transcript[nextIndex].timestamp_start || 0;
                      videoRef.current.play().catch(console.error);
                      setActiveClipIndex(nextIndex);
                    }
                  }
                }}
                disabled={activeClipIndex === null || activeClipIndex === transcript.length - 1}
                className="px-2 py-1 text-xs font-bold bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next &rarr;
              </button>
            </div>
          )}
          
          {(() => {
            if (!transcript || !Array.isArray(transcript) || transcript.length === 0) return null;
            
            const isOldFormat = transcript.every((t: any) => t.timestamp_start === 0);
            let activeT;
            
            if (isOldFormat && videoDuration > 0) {
              const segmentLength = videoDuration / transcript.length;
              const index = Math.min(Math.floor(currentTime / segmentLength), transcript.length - 1);
              activeT = transcript[Math.max(0, index)];
            } else {
              activeT = transcript.find((t: any) => currentTime >= t.timestamp_start && currentTime <= t.timestamp_end);
            }
            
            if (!activeT) return null;
            
            return (
              <div className="absolute bottom-20 left-0 right-0 px-8 pointer-events-none transition-opacity duration-300 z-40">
                <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl max-w-2xl mx-auto">
                  <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    Question
                  </p>
                  <p className="text-white text-lg font-medium">{activeT.question}</p>
                </div>
              </div>
            );
          })()}
        </>
      ) : (
        <div className="text-center py-20">
          <Play className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">
            {status === "pending"
              ? "Interview not yet completed"
              : "Video unavailable"}
          </p>
        </div>
      )}
    </div>
  );
}
