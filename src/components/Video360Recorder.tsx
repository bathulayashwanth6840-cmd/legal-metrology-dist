// src/components/Video360Recorder.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Video, Camera, Upload, RotateCw, CheckCircle2,
  AlertTriangle, Play, Square, Sparkles, RefreshCw
} from 'lucide-react';
import { extractBest360Keyframes } from '../utils/video360Processor';
import type { Extracted360Result, SurfaceCoverageInfo } from '../utils/video360Processor';

interface Video360RecorderProps {
  onKeyframesExtracted: (result: Extracted360Result) => void;
  onCancel?: () => void;
}

export default function Video360Recorder({ onKeyframesExtracted }: Video360RecorderProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStatusText, setAnalyzeStatusText] = useState('');
  const [extractionResult, setExtractionResult] = useState<Extracted360Result | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(err.message || 'Could not access camera. You can still upload a 360° video file.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTab]);

  // Start recording
  const handleStartRecording = () => {
    if (!cameraStream) return;
    recordedChunksRef.current = [];
    setRecordSeconds(0);
    setExtractionResult(null);

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(cameraStream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const fullBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        await processVideoBlob(fullBlob);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // 10-second automatic recording with rotation cues
      let count = 0;
      timerRef.current = setInterval(() => {
        count += 1;
        setRecordSeconds(count);
        if (count >= 10) {
          handleStopRecording();
        }
      }, 1000);
    } catch (e: any) {
      setCameraError(`Failed to start video recording: ${e.message}`);
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Process video blob through frame extraction engine
  const processVideoBlob = async (blobOrFile: Blob | File) => {
    setIsAnalyzing(true);
    setAnalyzeProgress(10);
    setAnalyzeStatusText('Initializing 360° intelligent frame analyzer...');
    try {
      const result = await extractBest360Keyframes(blobOrFile, (prog, text) => {
        setAnalyzeProgress(prog);
        setAnalyzeStatusText(text);
      });
      setExtractionResult(result);
    } catch (e: any) {
      setCameraError(`Video processing failed: ${e.message || e}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processVideoBlob(file);
  };

  const rotationAngle = Math.min(360, Math.round((recordSeconds / 10) * 360));

  return (
    <div className="bg-white rounded-3xl border border-blue-200 shadow-sm overflow-hidden space-y-6 p-6">
      {/* 360° Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <RotateCw size={20} className={isRecording ? 'animate-spin' : ''} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-lg">360° Single-Clip Video Scanner</h3>
                <span className="text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AI Keyframe Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Slowly rotate package 360° in one smooth clip. High-resolution keyframes are automatically extracted and filtered for OCR.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Toggle: Live Camera vs Video File Upload */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera size={14} /> Record Live
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload size={14} /> Upload Video
          </button>
        </div>
      </div>

      {/* Camera Error Message */}
      {cameraError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3">
          <AlertTriangle size={18} className="text-rose-600 flex-shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Main Interactive Panel */}
      {activeTab === 'camera' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Viewfinder with 360° Overlay */}
          <div className="lg:col-span-7 relative bg-slate-950 rounded-2xl overflow-hidden aspect-video sm:aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
            <video
              ref={videoPreviewRef}
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Live 360° HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
              {/* Top Bar: Angle & Progress */}
              <div className="flex justify-between items-center">
                <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                  <RotateCw size={12} className={isRecording ? 'text-emerald-400 animate-spin' : 'text-blue-400'} />
                  Rotation Angle: <strong className="text-blue-300">{rotationAngle}°</strong> / 360°
                </span>

                {isRecording && (
                  <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" /> REC {recordSeconds}s
                  </span>
                )}
              </div>

              {/* Center Guidance Reticle */}
              <div className="self-center flex flex-col items-center text-center">
                <div className={`w-36 h-36 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
                  isRecording ? 'border-emerald-400 bg-emerald-500/10 scale-105' : 'border-blue-400/60 bg-blue-500/5'
                }`}>
                  <span className="text-[11px] font-bold text-white/90 bg-black/60 px-2 py-1 rounded-md">
                    {isRecording ? (
                      recordSeconds < 3 ? 'Front Panel' :
                      recordSeconds < 5 ? 'Right Side' :
                      recordSeconds < 8 ? 'Back Details' : 'Left Side'
                    ) : (
                      'Keep in Center'
                    )}
                  </span>
                </div>
              </div>

              {/* Bottom Instructions */}
              <div className="bg-black/70 backdrop-blur-md rounded-xl p-2 text-center text-white text-xs border border-white/10">
                {isRecording ? (
                  <span className="text-emerald-300 font-bold">
                    🔄 Rotate package smoothly in hand or on a turntable ({10 - recordSeconds}s remaining)...
                  </span>
                ) : (
                  <span className="text-slate-300">
                    Press <strong>Start 360° Recording</strong> and rotate package one full turn.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls & Rotation Instructions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-600" />
                360° Continuous Clip Guidelines
              </h4>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-black">1.</span>
                  <span>Hold product approx. <strong>25–35 cm</strong> from the camera in good lighting.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-black">2.</span>
                  <span>Rotate the package steadily in 360 degrees so all faces are shown.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-black">3.</span>
                  <span>The AI extractor automatically removes motion blur and picks crisp frames.</span>
                </li>
              </ul>
            </div>

            {/* Recording Trigger Buttons */}
            <div>
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={isAnalyzing}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Play size={18} fill="white" /> Start 360° Video Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer animate-pulse"
                >
                  <Square size={18} fill="white" /> Stop & Analyze 360° Clip ({recordSeconds}s)
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Video File Upload Alternative */
        <div className="p-8 border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-3xl text-center space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <Video size={28} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Upload Pre-recorded 360° Video Clip</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Select any MP4, WebM, or MOV rotation video of the packaged product. Keyframes will be analyzed locally.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            Select Video File
          </button>
        </div>
      )}

      {/* Frame Extraction Analysis Progress */}
      {isAnalyzing && (
        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-lg">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin text-blue-400" />
              {analyzeStatusText}
            </span>
            <span className="font-mono text-blue-300 font-bold">{analyzeProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${analyzeProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Extracted 360° Keyframes & Coverage Matrix ─────────────────────── */}
      {extractionResult && (
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                360° Keyframe Extraction Summary
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Extracted <strong>{extractionResult.framesSelected}</strong> sharp candidate surfaces from {extractionResult.framesAnalyzed} rotation frames (Avg Sharpness: {extractionResult.averageSharpness}%).
              </p>
            </div>

            <button
              type="button"
              onClick={() => onKeyframesExtracted(extractionResult)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles size={14} /> Apply 360° Frames & Evaluate
            </button>
          </div>

          {/* Keyframe Thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(extractionResult.keyframes).map(([side, kf]) => {
              if (!kf) return null;
              return (
                <div key={side} className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs space-y-1.5">
                  <div className="relative aspect-4/3 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                    <img src={kf.previewUrl} alt={`${side} keyframe`} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">
                      {side}
                    </span>
                    <span className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[8px] px-1 py-0.5 rounded font-mono">
                      {kf.timestampFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold px-1">
                    <span>Sharpness:</span>
                    <span className="text-emerald-700 font-mono">{kf.sharpness}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 360° Surface Coverage Matrix */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              360° Scan Coverage Matrix
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {extractionResult.coverageList.map((cov: SurfaceCoverageInfo) => (
                <div
                  key={cov.side}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                    cov.status === 'VERIFIED'
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : cov.status === 'NEEDS_REVIEW'
                      ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                      : 'bg-rose-50/60 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold uppercase text-[10px]">{cov.side}</span>
                    <span className="font-black text-[10px]">
                      {cov.status === 'VERIFIED' ? '✅' : cov.status === 'NEEDS_REVIEW' ? '⚠️' : '❌'}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">
                    {cov.coveragePercent}% coverage
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1">
              ℹ️ Unverified surfaces are marked for manual review and will not falsely penalize compliance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
