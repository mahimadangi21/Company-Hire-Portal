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
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onToggleFullScreen?: () => void;
  isFullscreen?: boolean;
}

export function VideoPlayerOverlay({ videoUrl, status, transcript, onTimeUpdate, videoRef, onToggleFullScreen, isFullscreen }: VideoPlayerOverlayProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

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

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-[#E2E8F0] bg-black shadow-md flex items-center justify-center group h-full w-full ${isFullscreen ? '' : 'aspect-video'}`}>
      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            controlsList="nofullscreen"
            className="w-full h-full object-contain"
            onTimeUpdate={(e) => {
              const time = e.currentTarget.currentTime;
              setCurrentTime(time);
              if (onTimeUpdate) onTimeUpdate(time);
              if (!videoDuration && !isNaN(e.currentTarget.duration)) {
                setVideoDuration(e.currentTarget.duration);
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
