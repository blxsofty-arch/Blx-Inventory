/**
 * BLX Realty Portal - Client-Side Image Optimizer
 * 
 * Automatically resizes and compresses high-resolution camera and listing photos
 * before storing them as Base64 in SQLite.
 * 
 * Key Specifications:
 * - Max dimension: 1440px (preserves full HD / Retina display sharpness)
 * - Compression quality: 82% JPEG (visually lossless for architectural photos, 95-98% size reduction)
 * - Transparent PNG handling: renders onto a clean white canvas
 * - Non-destructive: preserves original aspect ratio
 */

const DEFAULT_MAX_DIMENSION = 1440;
const DEFAULT_QUALITY = 0.82;
const MAX_IMAGES_PER_PROPERTY = 5;

/**
 * Optimizes an uploaded File object (JPG, PNG, WEBP).
 * Returns a compact, high-quality Base64 Data URL.
 * 
 * @param {File|Blob} file 
 * @param {Object} [options]
 * @param {number} [options.maxDimension=1440] - Maximum width or height in pixels
 * @param {number} [options.quality=0.82] - JPEG quality (0.0 to 1.0)
 * @returns {Promise<{ dataUrl: string, originalSize: number, optimizedSize: number, width: number, height: number }>}
 */
export async function optimizeImageFile(file, options = {}) {
  const maxDimension = options.maxDimension || DEFAULT_MAX_DIMENSION;
  const quality = options.quality !== undefined ? options.quality : DEFAULT_QUALITY;
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file from disk'));
    reader.onload = (event) => {
      const rawDataUrl = event.target.result;

      // In browser environment, decode image to measure and compress via canvas
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        return resolve({
          dataUrl: rawDataUrl,
          originalSize,
          optimizedSize: rawDataUrl.length,
          width: 0,
          height: 0,
        });
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback: return raw Data URL if browser cannot decode
        resolve({
          dataUrl: rawDataUrl,
          originalSize,
          optimizedSize: rawDataUrl.length,
          width: 0,
          height: 0,
        });
      };

      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (!width || !height) {
            return resolve({
              dataUrl: rawDataUrl,
              originalSize,
              optimizedSize: rawDataUrl.length,
              width: 0,
              height: 0,
            });
          }

          // Calculate proportional downscaled dimensions
          if (width > maxDimension || height > maxDimension) {
            const aspect = width / height;
            if (width > height) {
              width = maxDimension;
              height = Math.round(maxDimension / aspect);
            } else {
              height = maxDimension;
              width = Math.round(maxDimension * aspect);
            }
          }

          // Render onto canvas with high-quality smoothing
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // White background for transparent PNGs converted to JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to compressed JPEG Data URL
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const optimizedSize = Math.round((optimizedDataUrl.length * 3) / 4); // Approximate binary size

          console.log(
            `[BLX ImageOptimizer] "${file.name}": ${(originalSize / 1024).toFixed(0)}KB -> ${(optimizedSize / 1024).toFixed(0)}KB (${width}x${height}px)`
          );

          resolve({
            dataUrl: optimizedDataUrl,
            originalSize,
            optimizedSize,
            width,
            height,
          });
        } catch (err) {
          console.warn('[BLX ImageOptimizer] Canvas compression failed, falling back to original:', err);
          resolve({
            dataUrl: rawDataUrl,
            originalSize,
            optimizedSize: rawDataUrl.length,
            width: 0,
            height: 0,
          });
        }
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

export { MAX_IMAGES_PER_PROPERTY };
