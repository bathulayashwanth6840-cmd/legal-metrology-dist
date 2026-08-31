import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { X, Check, ZoomIn, ZoomOut, Crop } from 'lucide-react';


interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  sideLabel: string;
  onClose: () => void;
  onSaveCrop: (croppedFile: File) => void;
}

export default function ImageCropModal({
  isOpen,
  imageSrc,
  sideLabel,
  onClose,
  onSaveCrop,
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
      console.error('Failed to crop image', e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Crop size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Crop {sideLabel} Image</h3>
              <p className="text-xs text-slate-400">Drag to adjust position and zoom in on product text</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="relative w-full h-80 sm:h-96 bg-black flex-1 min-h-[280px]">
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

        {/* Zoom Controls */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="text-slate-400" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <ZoomIn size={16} className="text-slate-400" />
            <span className="text-xs font-mono text-slate-400 w-10 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Cropping...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Save Crop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
