// src/components/CameraCapture.tsx
import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, RotateCcw, VideoOff } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface CameraCaptureProps {
  isOpen: boolean;
  sideLabel?: string;
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({
  isOpen,
  sideLabel = 'PRODUCT LABEL',
  onCapture,
  onClose,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedBlobUrl, setCapturedBlobUrl] = useState<string>('');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Helper to stop all active stream tracks
  const stopCurrentStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore error on stop
        }
      });
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user') => {
      // Clear previous error and captured states
      setErrorMsg('');

      if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setErrorMsg('Camera access requires a secure connection (HTTPS or localhost). Please use file upload instead.');
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg('Camera is not supported in this browser. Please use gallery/file upload.');
        return;
      }

      // Stop any existing tracks before starting a new one
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.play().catch(() => {
            // Autoplay policies handling
          });
        }

        // Check if multiple camera devices exist
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoDevices.length > 1);
        } catch {
          setHasMultipleCameras(false);
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings or use file upload.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMsg('No camera device found on this system. Please use file upload.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setErrorMsg('Camera is currently in use by another application.');
        } else {
          setErrorMsg(`Camera error: ${err.message || 'Unable to access camera.'}`);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Start camera whenever modal opens or facing mode toggles
  useEffect(() => {
    if (isOpen && !capturedBlobUrl) {
      startCamera(facingMode);
    }

    return () => {
      // Clean up when unmounting or closing
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, facingMode]);

  // Toggle between rear/front cameras
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame from live video feed
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          const rawFile = new File(
            [blob],
            `${sideLabel.toLowerCase().replace(/\s+/g, '_')}_camera_${Date.now()}.jpg`,
            { type: 'image/jpeg' }
          );

          setIsProcessing(true);
          try {
            const compressed = await compressImage(rawFile, 1600, 0.88);
            const previewUrl = URL.createObjectURL(compressed);
            setCapturedFile(compressed);
            setCapturedBlobUrl(previewUrl);

            // Stop live feed while viewing captured frame
            stopCurrentStream();
          } catch (e) {
            console.error('Compression error:', e);
          } finally {
            setIsProcessing(false);
          }
        }
      },
      'image/jpeg',
      0.95
    );
  };

  // Retake photo
  const handleRetake = () => {
    if (capturedBlobUrl) {
      URL.revokeObjectURL(capturedBlobUrl);
      setCapturedBlobUrl('');
      setCapturedFile(null);
    }
    startCamera(facingMode);
  };

  // Confirm photo and pass to parent
  const handleConfirm = () => {
    if (capturedFile) {
      onCapture(capturedFile);
      handleClose();
    }
  };

  // Handle closing modal
  const handleClose = () => {
    stopCurrentStream();
    if (capturedBlobUrl) {
      URL.revokeObjectURL(capturedBlobUrl);
      setCapturedBlobUrl('');
      setCapturedFile(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 uppercase tracking-wide">
                Capture {sideLabel}
              </h3>
              <p className="text-xs text-slate-400">Position label text inside the viewfinder</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close camera"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera / Viewfinder Body */}
        <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center max-w-sm">
              <div className="w-12 h-12 rounded-full bg-red-900/40 text-red-400 flex items-center justify-center mx-auto mb-3">
                <VideoOff size={24} />
              </div>
              <p className="text-sm font-semibold text-red-300 mb-2">Camera Unavailable</p>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">{errorMsg}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-colors"
              >
                Close & Use Upload Instead
              </button>
            </div>
          ) : capturedBlobUrl ? (
            // Captured Image Preview
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedBlobUrl}
                alt="Captured product label"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-700/60 text-green-400 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow">
                <Check size={13} /> Photo Captured
              </div>
            </div>
          ) : (
            // Live Video Feed
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Guideline Box */}
              <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-white/40 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                </div>
                <div className="text-center">
                  <span className="bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[11px] font-medium text-slate-300">
                    Align text clearly
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-blue-400" />
                </div>
              </div>

              {/* Switch Camera Button */}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={toggleCamera}
                  title="Switch front/back camera"
                  className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white p-2.5 rounded-full hover:bg-black/80 transition-colors shadow-lg"
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>
          )}

          {/* Hidden canvas for drawing frame */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Modal Controls Footer */}
        <div className="px-5 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          {!errorMsg && (
            <div className="flex items-center gap-2.5">
              {capturedBlobUrl ? (
                <>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw size={15} /> Retake
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-green-600/30"
                  >
                    <Check size={16} /> Use Photo
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleCapture}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  <Camera size={16} /> Capture
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
