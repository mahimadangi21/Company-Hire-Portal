"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Interview, RecordingChunk } from "@/types";
import { isExpired } from "@/lib/utils";
import { Logo } from "@/components/logo";
import {
  Video,
  Mic,
  Play,
  Square,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mergeVideoChunks, uploadVideoToSupabase } from "@/lib/video/merge";

type Stage =
  | "loading"
  | "welcome"
  | "permissions"
  | "instructions"
  | "interview"
  | "processing"
  | "completed"
  | "error"
  | "expired"
  | "already-completed";

export default function InterviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [stage, setStage] = useState<Stage>("loading");
  const [interview, setInterview] = useState<Interview | null>(null);
  const [error, setError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [allChunks, setAllChunks] = useState<RecordingChunk[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const rawChunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isRecordingRef = useRef(false);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedCamera, setSelectedCamera] = useState<string>("");

  // Fetch interview
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/interviews/${id}`);
        if (!res.ok) { setStage("error"); setError("Interview not found."); return; }
        const { data } = await res.json();
        if (!data) { setStage("error"); setError("Interview not found."); return; }

        if (data.status === "completed") { setStage("already-completed"); return; }
        if (isExpired(data.expires_at)) { setStage("expired"); return; }

        setInterview(data);
        setStage("welcome");
      } catch {
        setStage("error");
        setError("Failed to load the interview. Please try again.");
      }
    };
    load();
  }, [id]);

  // Draw canvas loop
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !interview) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const question = interview.questions[currentQuestionIndex];

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    if (isRecordingRef.current) {
      // Overlay strip
      const overlayH = 68;
      const pad = 18;

      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, overlayH);

      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(0, 0, 4, overlayH);

      ctx.font = "bold 11px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#93c5fd";
      ctx.fillText(`Q${currentQuestionIndex + 1}`, pad, 22);

      const maxW = canvas.width - pad * 2 - 40;
      ctx.font = "14px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      const words = question.split(" ");
      let line = "";
      let lineY = 42;
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        if (ctx.measureText(testLine).width > maxW && i > 0) {
          ctx.fillText(line.trim(), pad + 32, lineY);
          line = words[i] + " ";
          lineY += 16;
          if (lineY > overlayH - 6) break;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), pad + 32, lineY);

      // REC dot
      const elapsed = Date.now() - startTimeRef.current;
      const opacity = 0.5 + 0.5 * Math.sin(elapsed / 300);
      ctx.beginPath();
      ctx.arc(canvas.width - 20, 20, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239, 68, 68, ${opacity})`;
      ctx.fill();
    }

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [currentQuestionIndex, interview]);

  useEffect(() => {
    if (isCameraReady) {
      animFrameRef.current = requestAnimationFrame(drawFrame);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isCameraReady, drawFrame]);

  // Re-attach stream if video element unmounts/remounts between stages
  useEffect(() => {
    if (streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
    if (canvasRef.current) {
      canvasRef.current.width = 1280;
      canvasRef.current.height = 720;
    }
  }, [stage]);

  const initCamera = async (micId?: string, camId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: camId ? { deviceId: { exact: camId } } : true,
        audio: micId ? { deviceId: { exact: micId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
      
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices);
      
      if (!micId && !camId) {
        const audioInput = allDevices.find(d => d.kind === "audioinput");
        const videoInput = allDevices.find(d => d.kind === "videoinput");
        if (audioInput) setSelectedMic(audioInput.deviceId);
        if (videoInput) setSelectedCamera(videoInput.deviceId);
      }

      setStage("instructions");
    } catch (err: any) {
      console.error("Camera error:", err);
      setError(`Could not access camera or microphone: ${err.name || err.message}. Please allow permissions and try again.`);
    }
  };

  const handleDeviceChange = async (type: "audio" | "video", deviceId: string) => {
    if (type === "audio") setSelectedMic(deviceId);
    if (type === "video") setSelectedCamera(deviceId);
    
    const newMic = type === "audio" ? deviceId : selectedMic;
    const newCam = type === "video" ? deviceId : selectedCamera;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    await initCamera(newMic, newCam);
  };

  const speakQuestion = (text: string) => {
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  };

  const startInterview = async () => {
    setStage("interview");
    if (interview) {
      await speakQuestion(interview.questions[0]);
    }
  };

  const startRecording = () => {
    if (!canvasRef.current || !streamRef.current) return;
    
    if (!recorderRef.current) {
      rawChunksRef.current = [];
      // Use the raw stream directly to guarantee flawless audio/video capture from any mic
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const recorder = new MediaRecorder(streamRef.current, { mimeType, videoBitsPerSecond: 1000000 });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) rawChunksRef.current.push(e.data); };
      recorderRef.current = recorder;
    }



    startTimeRef.current = Date.now();
    isRecordingRef.current = true;

    if (recorderRef.current.state === "inactive") {
      recorderRef.current.start(250);
    } else if (recorderRef.current.state === "paused") {
      recorderRef.current.resume();
    }
    
    setIsRecording(true);
  };

  const stopRecording = (): RecordingChunk => {
    const duration = (Date.now() - startTimeRef.current) / 1000;
    isRecordingRef.current = false;
    setIsRecording(false);
    
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.pause();
    }

    const chunk: RecordingChunk = {
      question: interview!.questions[currentQuestionIndex],
      questionIndex: currentQuestionIndex,
      blob: new Blob(), // We no longer use individual blobs
      duration,
    };
    
    setAllChunks((prev) => [...prev, chunk]);
    return chunk;
  };

  const handleSubmitAnswer = async () => {
    const chunk = stopRecording();
    const nextIndex = currentQuestionIndex + 1;
    const isLast = !interview || nextIndex >= interview.questions.length;

    if (isLast) {
      // It's the last question, so we actually stop the recorder to get the final file
      const finalBlob = await new Promise<Blob>((resolve) => {
        const recorder = recorderRef.current;
        if (!recorder) return resolve(new Blob());
        
        recorder.onstop = () => {
          resolve(new Blob(rawChunksRef.current, { type: "video/webm" }));
        };
        
        if (recorder.state !== "inactive") {
          recorder.stop();
        } else {
          resolve(new Blob(rawChunksRef.current, { type: "video/webm" }));
        }
      });

      // Process and upload
      await processAndUpload([...allChunks, chunk], finalBlob);
    } else {
      setCurrentQuestionIndex(nextIndex);
      // Speak next question
      if (interview) {
        await speakQuestion(interview.questions[nextIndex]);
      }
    }
  };

  const processAndUpload = async (chunks: RecordingChunk[], finalBlob: Blob) => {
    setStage("processing");
    try {
      setProcessingProgress(20);

      // Stop camera
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());

      setProcessingProgress(40);

      // We already have the merged blob directly from MediaRecorder!
      setProcessingProgress(65);

      // Upload to Supabase
      const videoUrl = await uploadVideoToSupabase(
        finalBlob,
        id,
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      setProcessingProgress(85);

      // Build timestamp entries
      let currentOffset = 0;
      const questionTimestamps = chunks.map((c) => {
        const start = currentOffset;
        currentOffset += c.duration;
        return {
          question: c.question,
          timestamp_start: start,
          timestamp_end: currentOffset,
        };
      });

      // Mark completed
      await fetch(`/api/interviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completed_at: new Date().toISOString(),
          video_url: videoUrl,
          transcript: questionTimestamps,
        }),
      });

      setProcessingProgress(100);

      // Send completion email to admin (best effort)
      fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "completion",
          to: process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@company.com",
          candidateName: interview?.candidate_name,
          jobRole: interview?.job_role,
          reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard/interviews/${id}`,
        }),
      }).catch(() => {}); // non-blocking

      setStage("completed");
    } catch (err) {
      console.error(err);
      setStage("error");
      setError("Failed to process your interview. Please contact support.");
    }
  };

  // ---- UI Renders ----

  // ---- UI Renders ----

  if (stage === "loading") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (stage === "expired") {
    return (
      <FullScreenMessage
        icon={<AlertCircle className="w-10 h-10 text-amber-500" />}
        color="amber"
        title="Link Expired"
        message="This interview link has expired. Please contact your recruiter for a new link."
      />
    );
  }

  if (stage === "already-completed") {
    return (
      <FullScreenMessage
        icon={<CheckCircle2 className="w-10 h-10 text-emerald-500" />}
        color="emerald"
        title="Already Completed"
        message="This interview has already been completed. Thank you for your time!"
      />
    );
  }

  if (stage === "error") {
    return (
      <FullScreenMessage
        icon={<AlertCircle className="w-10 h-10 text-red-500" />}
        color="red"
        title="Something went wrong"
        message={error || "An unexpected error occurred."}
      />
    );
  }

  if (stage === "completed") {
    return (
      <FullScreenMessage
        icon={<CheckCircle2 className="w-14 h-14 text-emerald-500" />}
        color="emerald"
        title="Interview Complete! 🎉"
        message={`Thank you, ${interview?.candidate_name?.split(" ")[0]}! Your interview for ${interview?.job_role} has been submitted. We'll be in touch soon.`}
        subtitle="You can now close this tab."
      />
    );
  }

  if (stage === "processing") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-800">
        <div className="text-center max-w-sm p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing your interview</h2>
          <p className="text-slate-500 text-sm mb-6 font-medium">
            Merging your answers and uploading the final video...
          </p>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
          <p className="text-slate-400 text-xs font-bold mt-3">{processingProgress}%</p>
        </div>
      </div>
    );
  }

  if (stage === "welcome" && interview) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-slate-800">
        <div className="max-w-lg w-full text-center p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
            <Video className="w-8 h-8 text-white" />
          </div>
          <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">Video Interview</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Hello, {interview.candidate_name.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-400 text-base mb-1">
            You&apos;re interviewing for
          </p>
          <p className="text-slate-800 font-bold text-lg mb-8">{interview.job_role}</p>

          <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-slate-50/50 text-left space-y-3 mb-8">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">What to expect</p>
            {[
              `${interview.questions.length} questions asked by our AI`,
              "You control when to start and stop recording each answer",
              "Your webcam and microphone will be used",
              "Ensure you're in a quiet, well-lit space",
              "This is a one-time link — do not refresh the page",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-slate-600 text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setStage("permissions")}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20"
          >
            Continue to Setup
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "permissions") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-slate-800">
        <div className="max-w-lg w-full text-center p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          <div className="flex gap-4 justify-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm">
              <Video className="w-6 h-6 text-slate-500" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm">
              <Mic className="w-6 h-6 text-slate-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Camera & Microphone Access</h2>
          <p className="text-slate-500 text-sm mb-8">
            We need access to your camera and microphone to record your interview answers. When prompted, click &quot;Allow&quot;.
          </p>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm mb-5 font-medium shadow-sm">
              {error}
            </div>
          )}

          <Button
            onClick={() => initCamera()}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20"
          >
            Grant Access & Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "instructions" && interview) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-slate-800">
        <div className="max-w-3xl w-full p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Webcam preview */}
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-200 aspect-video shadow-md">
              <canvas ref={canvasRef} className="w-full h-full object-cover hidden" />
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline style={{ transform: "scaleX(-1)" }} />
              {isCameraReady && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 rounded-full px-2.5 py-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white text-xs font-semibold">Camera ready</span>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to start?</h2>
              <div className="space-y-4 mb-6">
                {[
                  { step: "1", text: "AI reads the question aloud", icon: Volume2 },
                  { step: "2", text: 'Click "Start Answer" to begin recording', icon: Mic },
                  { step: "3", text: 'Click "Submit Answer" when done', icon: Square },
                  { step: "4", text: "Repeat for all questions", icon: ChevronRight },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Icon className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <p className="text-slate-600 text-sm font-medium leading-relaxed mt-0.5">{s.text}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 mb-6 bg-slate-50/50 p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
                <div>
                  <label className="text-xs text-slate-500 font-bold mb-1.5 block">Microphone</label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                    value={selectedMic}
                    onChange={(e) => handleDeviceChange("audio", e.target.value)}
                  >
                    {devices.filter(d => d.kind === "audioinput").map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 5)}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold mb-1.5 block">Camera</label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                    value={selectedCamera}
                    onChange={(e) => handleDeviceChange("video", e.target.value)}
                  >
                    {devices.filter(d => d.kind === "videoinput").map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}`}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={startInterview}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20"
              >
                <Play className="w-4 h-4 mr-2" />
                Begin Interview
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main interview stage
  if (stage === "interview" && interview) {
    const question = interview.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === interview.questions.length - 1;

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
            style={{ width: `${((currentQuestionIndex + 1) / interview.questions.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white flex items-center justify-between shadow-sm">
          <Logo href="/" size="sm" />
          <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
            <span>Question {currentQuestionIndex + 1} of {interview.questions.length}</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-4xl w-full p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Webcam */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-200 aspect-video shadow-md">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  style={{ transform: "scaleX(-1)" }}
                />
                <canvas ref={canvasRef} className="hidden" />

                {isRecording && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500/90 rounded-full px-2.5 py-1">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-white text-xs font-semibold">REC</span>
                  </div>
                )}

                {isSpeaking && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 rounded-full px-2.5 py-1">
                    <Volume2 className="w-3 h-3 text-blue-400 animate-pulse" />
                    <span className="text-white/70 text-xs font-semibold">AI speaking...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col justify-center gap-6">
              {/* Question card */}
              <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/50 shadow-sm">
                <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">
                  Question {currentQuestionIndex + 1}
                </p>
                <p className="text-slate-800 text-lg leading-relaxed font-bold">{question}</p>
              </div>

              {/* Status */}
              {isSpeaking && (
                <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                  <Volume2 className="w-4 h-4 text-blue-500 animate-pulse" />
                  AI is reading the question...
                </div>
              )}

              {!isSpeaking && !isRecording && (
                <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                  <Mic className="w-4 h-4 text-slate-400" />
                  Ready to record your answer
                </div>
              )}

              {isRecording && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-semibold">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Recording your answer...
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    disabled={isSpeaking}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-40"
                    id="start-answer-btn"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitAnswer}
                    className="w-full h-12 bg-red-50 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20"
                    id="submit-answer-btn"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    {isLastQuestion ? "Submit Final Answer" : "Submit Answer"}
                  </Button>
                )}

                <Button
                  onClick={() => speakQuestion(question)}
                  disabled={isSpeaking || isRecording}
                  variant="ghost"
                  className="w-full h-10 text-slate-400 hover:text-slate-700 text-sm disabled:opacity-30"
                >
                  <Volume2 className="w-3.5 h-3.5 mr-2" />
                  Replay question
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function FullScreenMessage({
  icon,
  color,
  title,
  message,
  subtitle,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  message: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className={`w-20 h-20 rounded-3xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mx-auto mb-6`}>
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
        <p className="text-white/40 leading-relaxed">{message}</p>
        {subtitle && <p className="text-white/20 text-sm mt-4">{subtitle}</p>}
      </div>
    </div>
  );
}
