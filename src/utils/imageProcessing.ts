/**
 * Image processing utilities for background removal and adjustments
 */

import { FaceBoundingBox } from '../types';
// import { removeBackground } from './backgroundSegmentation'; // Temporarily disabled

/**
 * Replace background with solid white color
 * Uses a simple approach: detect person using edge detection and color similarity
 */
export async function replaceBackground(
  canvas: HTMLCanvasElement,
  faceBox: FaceBoundingBox
): Promise<HTMLCanvasElement> {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Create a mask for the person (simple approach using face region expansion)
  const mask = createPersonMask(imageData, faceBox);

  // Replace background pixels with white
  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    if (!mask[pixelIndex]) {
      data[i] = 255; // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      // Alpha stays the same
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Create a simple person mask based on face bounding box
 * Expands the face box to include shoulders and applies edge smoothing
 */
function createPersonMask(
  imageData: ImageData,
  faceBox: FaceBoundingBox
): boolean[] {
  const width = imageData.width;
  const height = imageData.height;
  const mask = new Array(width * height).fill(false);

  // Expand face box to include shoulders (roughly 2.5x height, 1.8x width)
  const personBox = {
    x: Math.max(0, faceBox.x - faceBox.width * 0.4),
    y: Math.max(0, faceBox.y - faceBox.height * 0.2),
    width: Math.min(width, faceBox.width * 1.8),
    height: Math.min(height, faceBox.height * 2.5),
  };

  // Mark person region as foreground
  for (let y = personBox.y; y < personBox.y + personBox.height; y++) {
    for (let x = personBox.x; x < personBox.x + personBox.width; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const index = Math.floor(y) * width + Math.floor(x);
        mask[index] = true;
      }
    }
  }

  // Apply simple edge smoothing using elliptical shape
  const centerX = personBox.x + personBox.width / 2;
  const centerY = personBox.y + personBox.height / 2;
  const radiusX = personBox.width / 2;
  const radiusY = personBox.height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const distance = dx * dx + dy * dy;

      if (distance <= 1) {
        const index = y * width + x;
        mask[index] = true;
      }
    }
  }

  return mask;
}

/**
 * Adjust brightness and contrast to improve photo quality
 */
export function adjustLighting(
  canvas: HTMLCanvasElement,
  brightness: number = 1.1,
  contrast: number = 1.15
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

  for (let i = 0; i < data.length; i += 4) {
    // Apply brightness
    let r = data[i] * brightness;
    let g = data[i + 1] * brightness;
    let b = data[i + 2] * brightness;

    // Apply contrast
    r = factor * (r - 128) + 128;
    g = factor * (g - 128) + 128;
    b = factor * (b - 128) + 128;

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Calculate average brightness of face region
 */
export function calculateFaceBrightness(
  canvas: HTMLCanvasElement,
  faceBox: FaceBoundingBox
): number {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(
    faceBox.x,
    faceBox.y,
    faceBox.width,
    faceBox.height
  );
  const data = imageData.data;

  let totalBrightness = 0;
  let pixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    totalBrightness += brightness;
    pixelCount++;
  }

  return totalBrightness / pixelCount;
}

/**
 * Process captured image: no processing, return as-is
 * All processing disabled due to artifacts
 */
export async function processCapturedImage(
  canvas: HTMLCanvasElement,
  _faceBox: FaceBoundingBox
): Promise<HTMLCanvasElement> {
  // All image processing disabled - was causing artifacts
  // Just return the canvas as-is
  console.log('✓ Image ready (no processing applied)');
  
  return canvas;
}

/**
 * Simple background replacement (fallback method)
 */
async function replaceBackgroundSimple(
  canvas: HTMLCanvasElement,
  faceBox: FaceBoundingBox
): Promise<HTMLCanvasElement> {
  const _ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Create a mask for the person
  const mask = createPersonMask(imageData, faceBox);

  // Replace background pixels with white
  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    if (!mask[pixelIndex]) {
      data[i] = 255; // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Crop and resize image to passport photo dimensions
 */
export function cropToPassportSize(
  canvas: HTMLCanvasElement,
  faceBox: FaceBoundingBox,
  outputWidth: number = 600,
  outputHeight: number = 600
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;

  // Calculate crop region centered on face
  const faceCenter = {
    x: faceBox.x + faceBox.width / 2,
    y: faceBox.y + faceBox.height / 2,
  };

  // Determine crop size (use the larger dimension to maintain aspect ratio)
  const cropSize = Math.min(canvas.width, canvas.height);

  // Calculate crop coordinates
  let cropX = faceCenter.x - cropSize / 2;
  let cropY = faceCenter.y - cropSize / 2;

  // Adjust if crop goes out of bounds
  cropX = Math.max(0, Math.min(cropX, canvas.width - cropSize));
  cropY = Math.max(0, Math.min(cropY, canvas.height - cropSize));

  // Create temporary canvas for cropping
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = cropSize;
  tempCanvas.height = cropSize;
  const tempCtx = tempCanvas.getContext('2d')!;

  // Draw cropped region
  tempCtx.drawImage(
    canvas,
    cropX,
    cropY,
    cropSize,
    cropSize,
    0,
    0,
    cropSize,
    cropSize
  );

  // Create output canvas with desired dimensions
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;
  const outputCtx = outputCanvas.getContext('2d')!;

  // Draw resized image
  outputCtx.drawImage(tempCanvas, 0, 0, outputWidth, outputHeight);

  return outputCanvas;
}

/**
 * Convert canvas to downloadable blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = 'image/jpeg',
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Download canvas as image file
 */
export async function downloadImage(
  canvas: HTMLCanvasElement,
  filename: string = 'passport-photo.jpg'
): Promise<void> {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
