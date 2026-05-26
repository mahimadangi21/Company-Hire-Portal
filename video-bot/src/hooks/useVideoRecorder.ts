"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { RecordingChunk } from "@/types";

interface UseVideoRecorderOptions {
  question: string;
  questionIndex: number;
}

interface UseVideoRecorderReturn {
  isRecording: boolean;
  chunks: RecordingChunk[];
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<RecordingChunk>;
  initCamera: () => Promise<void>;
  releaseCamera: () => void;
  isCameraReady: boolean;
  error: string | null;
}

export function useVideoRecorder(
  options: UseVideoRecorderOptions
): UseVideoRecorderReturn {
  const { question, questionIndex } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [chunks, setChunks] = useState<RecordingChunk[]>([]);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const rawChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror and draw webcam feed
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw question overlay strip at top
    const overlayHeight = 64;
    const padding = 20;

    // Semi-transparent dark background strip
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.fillRect(0, 0, canvas.width, overlayHeight);

    // Subtle left accent line
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(0, 0, 4, overlayHeight);

    // Question number tag
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillStyle = "#93c5fd";
    ctx.fillText(`Q${questionIndex + 1}`, padding, 22);

    // Question text
    const maxWidth = canvas.width - padding * 2 - 40;
    const fontSize = 14;
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = "#ffffff";

    // Word wrap
    const words = question.split(" ");
    let line = "";
    let lineY = 40;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), padding + 30, lineY);
        line = words[i] + " ";
        lineY += fontSize + 2;
        if (lineY > overlayHeight - 6) break;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), padding + 30, lineY);

    // Recording indicator dot (red pulsing)
    if (isRecording) {
      const dotX = canvas.width - 20;
      const dotY = 20;
      const elapsed = Date.now() - startTimeRef.current;
      const opacity = 0.5 + 0.5 * Math.sin(elapsed / 300);

      ctx.beginPath();
      ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239, 68, 68, ${opacity})`;
      ctx.fill();
    }

    animationFrameRef.current = requestAnimationFrame(drawFrame);
  }, [question, questionIndex, isRecording]);

  useEffect(() => {
    if (isCameraReady) {
      animationFrameRef.current = requestAnimationFrame(drawFrame);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraReady, drawFrame]);

  const initCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (canvasRef.current) {
        canvasRef.current.width = 1280;
        canvasRef.current.height = 720;
      }

      setIsCameraReady(true);
    } catch (err) {
      setError("Could not access camera or microphone. Please check permissions.");
      console.error("Camera init error:", err);
    }
  }, []);

  const releaseCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (!canvasRef.current || !streamRef.current) return;

    rawChunksRef.current = [];
    startTimeRef.current = Date.now();

    // Get canvas stream + audio from original stream
    const canvasStream = canvasRef.current.captureStream(30);
    const audioTracks = streamRef.current.getAudioTracks();
    audioTracks.forEach((track) => canvasStream.addTrack(track));

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";

    const recorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: 2500000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        rawChunksRef.current.push(e.data);
      }
    };

    recorder.start(250); // collect chunks every 250ms
    recorderRef.current = recorder;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback((): Promise<RecordingChunk> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) return;

      const duration = (Date.now() - startTimeRef.current) / 1000;

      recorder.onstop = () => {
        const blob = new Blob(rawChunksRef.current, { type: "video/webm" });
        const chunk: RecordingChunk = {
          question,
          questionIndex,
          blob,
          duration,
        };
        setChunks((prev) => [...prev, chunk]);
        setIsRecording(false);
        resolve(chunk);
      };

      recorder.stop();
    });
  }, [question, questionIndex]);

  return {
    isRecording,
    chunks,
    videoRef,
    canvasRef,
    startRecording,
    stopRecording,
    initCamera,
    releaseCamera,
    isCameraReady,
    error,
  };
}
