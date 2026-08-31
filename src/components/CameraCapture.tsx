import { useRef, useState, useEffect, useCallback } from 'react';
import { compressImage } from '../utils/imageCompressor';
import { Camera, RefreshCw, Upload, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    if (!window.isSecureContext) {
      setErrorMsg('Camera requires a secure connection (HTTPS or localhost).');
      return;
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Camera API not supported in this browser.');
      return;
    }

    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
      setErrorMsg('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Camera access denied or unavailable: ${err.message}`);
    }
  }, [stream]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleCaptureClick = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const compressed = await compressImage(file);
            onCapture(compressed);
          }
        }, 'image/jpeg', 1.0);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const compressed = await compressImage(file);
      onCapture(compressed);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {errorMsg ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 w-full mb-4 rounded shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-700">{errorMsg}</p>
          </div>
          <p className="text-sm text-yellow-600 mt-2">Falling back to file upload.</p>
        </div>
      ) : (
        <div className="relative w-full aspect-[3/4] bg-black rounded-lg overflow-hidden shadow-lg mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {hasMultipleCameras && (
            <button 
              onClick={toggleCamera}
              className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white backdrop-blur hover:bg-black/70 transition-colors"
            >
              <RefreshCw size={20} />
            </button>
          )}
        </div>
      )}

      {/* Hidden canvas for capturing frame */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden file input for fallback/upload */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
      />

      <div className="flex gap-4 w-full">
        {!errorMsg && (
          <button 
            onClick={handleCaptureClick}
            className="flex-1 bg-[var(--color-navy)] text-white py-4 rounded-full font-bold shadow flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors"
          >
            <Camera /> Capture
          </button>
        )}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-full font-bold shadow flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors"
        >
          <Upload /> {errorMsg ? 'Upload Image' : 'Gallery'}
        </button>
      </div>
    </div>
  );
}
