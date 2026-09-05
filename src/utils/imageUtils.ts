// src/utils/imageUtils.ts

/**
 * High-reliability Image Utility for LegalMetriX
 * Handles resolution of Base64 Data URLs, Object URLs, Remote Backend Upload URLs,
 * and fallback placeholders for evidence photos.
 */

export const FALLBACK_EVIDENCE_PLACEHOLDER = '/legal_metrology_logo.jpg';

/**
 * Converts a File or Blob into a permanent Base64 Data URL string
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Resolves any image path or URL into a valid displayable browser URL
 * @param imagePath - Raw image path, base64 data URL, blob URL, or backend filename
 * @param apiUrl - Backend API base URL
 */
export function resolveImageUrl(
  imagePath: string | null | undefined,
  apiUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:8000'
): string {
  if (!imagePath || typeof imagePath !== 'string') {
    return FALLBACK_EVIDENCE_PLACEHOLDER;
  }

  const trimmed = imagePath.trim();
  if (!trimmed) {
    return FALLBACK_EVIDENCE_PLACEHOLDER;
  }

  // 1. If it's already a Data URL (base64)
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // 2. If it's already an absolute HTTP / HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 3. If it's a blob URL
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 4. If it's a relative path from the app root (e.g. /legal_metrology_logo.jpg)
  if (trimmed.startsWith('/') && !trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  // 5. Backend relative path handling
  const cleanBase = apiUrl.replace(/\/+$/, '');
  
  if (trimmed.startsWith('/uploads/')) {
    return `${cleanBase}${trimmed}`;
  }

  if (trimmed.startsWith('uploads/')) {
    return `${cleanBase}/${trimmed}`;
  }

  // 6. Plain filename (e.g. "20260905_123456_sample.jpg")
  return `${cleanBase}/uploads/${trimmed}`;
}

/**
 * Safe Image Error Handler to prevent broken image icons in the UI
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = FALLBACK_EVIDENCE_PLACEHOLDER
) {
  const target = event.currentTarget;
  if (target.src !== fallbackSrc) {
    target.onerror = null; // Prevent infinite loop if fallback fails
    target.src = fallbackSrc;
  }
}
