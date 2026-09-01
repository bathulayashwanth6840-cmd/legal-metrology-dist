// src/components/ImageCropModal.tsx
import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { X, Check, ZoomIn, ZoomOut, Crop, RotateCcw, FastForward } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  sideLabel: string;
  onClose: () => void;
  onSaveCrop: (croppedFile: File) => void;
  onSkipCrop?: () => void;
}

export default function ImageCropModal({
  isOpen,
  imageSrc,
  sideLabel,
  onClose,
  onSaveCrop,
  onSkipCrop,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const onCropChange = (newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixelsVal: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsVal);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    try {
      setIsProcessing(true);
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        `${sideLabel.toLowerCase().replace(/\s+/g, '_')}_cropped_${Date.now()}.jpg`
      );
      onSaveCrop(croppedFile);
      onClose();
    } catch (e) {
      console.error('Failed to crop image:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    if (onSkipCrop) {
      onSkipCrop();
    }
    onClose();
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Crop size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 uppercase tracking-wide">
                Crop {sideLabel} Image
              </h3>
              <p className="text-xs text-slate-400">Drag to adjust position and zoom in on product text</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close crop modal"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="relative w-full h-72 sm:h-96 bg-black flex-1 min-h-[260px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
          />
        </div>

        {/* Zoom & Reset Toolbar */}
        <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <span className="text-xs font-mono text-slate-400 w-9 text-right">
                {zoom.toFixed(1)}x
              </span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 bg-slate-800/90 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <FastForward size={14} /> Skip Crop
              </button>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Confirm Crop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
