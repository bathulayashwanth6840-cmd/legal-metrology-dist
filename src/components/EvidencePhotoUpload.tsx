// src/components/EvidencePhotoUpload.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Camera, FolderOpen, RefreshCw, Trash2, CheckCircle2, AlertCircle, FileImage, X, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { fileToDataUrl, handleImageError } from '../utils/imageUtils';

export interface AttachedEvidence {
  dataUrl: string;
  name: string;
  size: number;
  type: string;
}

interface EvidencePhotoUploadProps {
  evidence: AttachedEvidence | null;
  onChange: (evidence: AttachedEvidence | null) => void;
  className?: string;
  maxSizeBytes?: number; // Defaults to 10MB
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Format bytes into human-readable string (KB/MB)
 */
function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Map MIME type to friendly display label
 */
function getFormatLabel(mimeType: string, fileName?: string): string {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPEG Image';
  if (mimeType.includes('png')) return 'PNG Image';
  if (mimeType.includes('webp')) return 'WEBP Image';
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'JPEG Image';
    if (ext === 'png') return 'PNG Image';
    if (ext === 'webp') return 'WEBP Image';
  }
  return 'Image File';
}

export default function EvidencePhotoUpload({
  evidence,
  onChange,
  className = '',
  maxSizeBytes = DEFAULT_MAX_SIZE,
}: EvidencePhotoUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = useCallback(
    async (file: File) => {
      setError(null);

      // 1. File existence check
      if (!file) {
        setError('No image file selected.');
        return;
      }

      // 2. Type validation
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      const isMimeSupported = SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase());
      const isExtSupported = SUPPORTED_EXTENSIONS.includes(fileExt);

      if (!isMimeSupported && !isExtSupported) {
        setError(
          `Unsupported file format (${file.type || fileExt || 'unknown'}). Please upload a JPG, JPEG, PNG, or WEBP image.`
        );
        return;
      }

      // 3. Size validation
      if (file.size > maxSizeBytes) {
        setError(
          `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of ${formatFileSize(maxSizeBytes)}. Please select a smaller photo.`
        );
        return;
      }

      setIsProcessing(true);

      try {
        // Compress image client-side to optimize memory and transmission while preserving label text
        let processedFile = file;
        try {
          processedFile = await compressImage(file, 1800, 0.88);
        } catch {
          // If canvas compression fails, fallback gracefully to original file
          processedFile = file;
        }

        const dataUrl = await fileToDataUrl(processedFile);

        // Verify that the data URL is a valid renderable image
        await new Promise<void>((resolve, reject) => {
          const testImg = new Image();
          testImg.onload = () => resolve();
          testImg.onerror = () => reject(new Error('Corrupted image'));
          testImg.src = dataUrl;
        });

        const newEvidence: AttachedEvidence = {
          dataUrl,
          name: file.name || 'product_evidence.jpg',
          size: processedFile.size || file.size,
          type: processedFile.type || file.type || 'image/jpeg',
        };

        onChange(newEvidence);
      } catch {
        setError(
          'Unable to read the image file. The file may be corrupted or unreadable. Please try another photo.'
        );
        onChange(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [maxSizeBytes, onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
    // Reset inputs so the same file can be re-selected if retried
    e.target.value = '';
  };

  const handleTakePhoto = () => {
    setError(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleUploadGallery = () => {
    setError(null);
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  const handleRemove = () => {
    setError(null);
    onChange(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        id="evidence-camera-capture-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-label="Capture photo using device camera"
        onChange={handleFileChange}
      />

      <input
        ref={galleryInputRef}
        id="evidence-gallery-upload-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload photo from device gallery or files"
        onChange={handleFileChange}
      />

      {/* Screen Reader Announcement */}
      <div className="sr-only" aria-live="polite">
        {evidence
          ? `Label photo attached: ${evidence.name}, size ${formatFileSize(evidence.size)}`
          : 'No evidence photo attached'}
      </div>

      {/* COMPONENT HEADER */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base" role="img" aria-label="Camera">
            📸
          </span>
          <span className="font-black text-slate-900 text-xs uppercase tracking-wider">
            ATTACH EVIDENCE / PRODUCT PHOTO
          </span>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider">
          Optional
        </span>
      </div>

      {/* HELPFUL TEXT */}
      <p className="text-[11px] text-slate-500 leading-normal">
        Upload a clear photo of the product label, packaging, MRP sticker, or other relevant evidence.
      </p>

      {/* ERROR ALERT */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start justify-between gap-2 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-600 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 p-0.5 rounded cursor-pointer transition-colors"
            aria-label="Dismiss error message"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* STATE 1: NO IMAGE ATTACHED (INITIAL STATE) */}
      {!evidence ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 transition-all duration-200 text-center ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-50'
          }`}
        >
          {isProcessing ? (
            <div className="py-4 flex flex-col items-center justify-center gap-2 text-slate-600">
              <RefreshCw size={24} className="animate-spin text-blue-600" aria-hidden="true" />
              <span className="text-xs font-bold">Optimizing and attaching evidence photo...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ImageIcon size={20} aria-hidden="true" />
              </div>

              {/* ACTION BUTTONS (MOBILE FRIENDLY / RESPONSIVE) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-[var(--color-navy)] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.98]"
                  aria-label="Take photo using camera"
                >
                  <Camera size={16} aria-hidden="true" />
                  <span>📷 Take Photo</span>
                </button>

                <button
                  type="button"
                  onClick={handleUploadGallery}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                  aria-label="Upload photo from gallery"
                >
                  <FolderOpen size={16} className="text-blue-600" aria-hidden="true" />
                  <span>📁 Upload from Gallery</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 font-medium">
                Supported: <strong className="text-slate-600">JPG, JPEG, PNG, WEBP</strong> (Max 10MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        /* STATE 2: IMAGE ATTACHED (PREVIEW & METADATA) */
        <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 space-y-3 animate-in fade-in zoom-in-98 duration-150">
          {/* Top Row: Success Indicator */}
          <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" aria-hidden="true" />
              <span>✓ Label photo attached</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
              Ready for Submission
            </span>
          </div>

          {/* Main Preview & Metadata Row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
            {/* Thumbnail Preview */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-emerald-300/80 bg-slate-900 flex-shrink-0 relative shadow-xs">
              <img
                src={evidence.dataUrl}
                alt="Attached product evidence photo preview"
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e)}
              />
            </div>

            {/* Metadata & Actions */}
            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
              <div>
                <p
                  className="font-bold text-slate-900 text-xs truncate max-w-full"
                  title={evidence.name}
                >
                  {evidence.name}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1 mt-0.5 font-medium">
                  <FileImage size={12} className="text-slate-400" aria-hidden="true" />
                  <span>{getFormatLabel(evidence.type, evidence.name)}</span>
                  <span>•</span>
                  <span>{formatFileSize(evidence.size)}</span>
                </p>
              </div>

              {/* Post-Upload Action Buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="min-h-[38px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Retake or replace evidence photo"
                >
                  <RefreshCw size={13} className="text-blue-600" aria-hidden="true" />
                  <span>🔄 Retake</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="min-h-[38px] px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  aria-label="Remove attached evidence photo"
                >
                  <Trash2 size={13} className="text-rose-600" aria-hidden="true" />
                  <span>🗑 Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
