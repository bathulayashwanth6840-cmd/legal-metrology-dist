// src/utils/imageQuality.ts

export interface ImageQualityResult {
  isValid: boolean;
  warnings: string[];
  width: number;
  height: number;
  brightness?: number;
  blurScore?: number;
}

/**
 * Fast, non-blocking client-side image quality assessment using HTML5 Canvas.
 * Checks resolution, luminance (too dark / overexposed), and estimated blur.
 */
export async function checkImageQuality(file: File): Promise<ImageQualityResult> {
  return new Promise((resolve) => {
    const warnings: string[] = [];
    const reader = new FileReader();

    reader.onerror = () => {
      resolve({
        isValid: true,
        warnings: ['Unable to analyze image quality prior to scan.'],
        width: 0,
        height: 0,
      });
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        resolve({
          isValid: true,
          warnings: ['Could not decode image for quality check.'],
          width: 0,
          height: 0,
        });
      };

      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        // 1. Resolution Check
        if (width < 400 || height < 400) {
          warnings.push('⚠ Low resolution image. Small text might be hard to recognize.');
        }

        try {
          // Downsample to a small canvas (120x120) for instant, lightweight pixel analysis
          const canvas = document.createElement('canvas');
          const sampleSize = 120;
          canvas.width = sampleSize;
          canvas.height = sampleSize;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (!ctx) {
            resolve({ isValid: true, warnings, width, height });
            return;
          }

          ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
          const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
          const data = imgData.data;

          let totalLuminance = 0;
          const grayPixels: number[] = new Array(sampleSize * sampleSize);

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Standard relative luminance
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalLuminance += lum;
            grayPixels[i / 4] = lum;
          }

          const avgBrightness = totalLuminance / (sampleSize * sampleSize);

          // 2. Exposure / Brightness Check
          if (avgBrightness < 45) {
            warnings.push('⚠ Image is too dark. Try better lighting for higher OCR accuracy.');
          } else if (avgBrightness > 225) {
            warnings.push('⚠ Image is overexposed or has strong glare.');
          }

          // 3. Quick Laplacian variance approximation on 120x120 grayscale
          let laplacianSum = 0;
          let laplacianCount = 0;
          for (let y = 1; y < sampleSize - 1; y += 2) {
            for (let x = 1; x < sampleSize - 1; x += 2) {
              const idx = y * sampleSize + x;
              const center = grayPixels[idx];
              const top = grayPixels[idx - sampleSize];
              const bottom = grayPixels[idx + sampleSize];
              const left = grayPixels[idx - 1];
              const right = grayPixels[idx + 1];

              const laplacian = Math.abs(4 * center - top - bottom - left - right);
              laplacianSum += laplacian;
              laplacianCount++;
            }
          }

          const blurScore = laplacianCount > 0 ? laplacianSum / laplacianCount : 100;
          if (blurScore < 7.0) {
            warnings.push('⚠ Image may be blurry or out of focus. Text might be hard to read.');
          }

          resolve({
            isValid: true,
            warnings,
            width,
            height,
            brightness: Math.round(avgBrightness),
            blurScore: Math.round(blurScore * 10) / 10,
          });
        } catch {
          // If canvas read fails (e.g. security origin issues), fail open
          resolve({ isValid: true, warnings, width, height });
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
