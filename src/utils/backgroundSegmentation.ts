/**
 * Background segmentation using TensorFlow.js BodyPix
 * Automatically removes background and replaces with white (like Zoom/Teams)
 */

import * as bodyPix from '@tensorflow-models/body-pix';

let segmentationModel: bodyPix.BodyPix | null = null;

/**
 * Initialize the background segmentation model
 */
export async function initializeSegmentation(): Promise<void> {
  if (segmentationModel) {
    console.log('Segmentation model already initialized');
    return;
  }

  try {
    console.log('Loading background segmentation model...');
    
    // Load BodyPix with optimized settings for speed
    segmentationModel = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2,
    });
    
    console.log('✓ Background segmentation model loaded');
  } catch (error) {
    console.error('✗ Failed to load segmentation model:', error);
    throw error;
  }
}

/**
 * Segment person from background and replace background with white
 */
export async function removeBackground(
  canvas: HTMLCanvasElement,
  backgroundColor: string = '#FFFFFF'
): Promise<void> {
  if (!segmentationModel) {
    console.warn('Segmentation model not initialized');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  try {
    // Perform segmentation
    const segmentation = await segmentationModel.segmentPerson(canvas, {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: 0.7,
    });

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Parse background color
    const bgColor = hexToRgb(backgroundColor);

    // Replace background pixels
    for (let i = 0; i < segmentation.data.length; i++) {
      const shouldKeep = segmentation.data[i];
      
      if (!shouldKeep) {
        // This is background - replace with white
        const pixelIndex = i * 4;
        pixels[pixelIndex] = bgColor.r;     // R
        pixels[pixelIndex + 1] = bgColor.g; // G
        pixels[pixelIndex + 2] = bgColor.b; // B
        pixels[pixelIndex + 3] = 255;       // A (fully opaque)
      }
    }

    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0);
  } catch (error) {
    console.error('Error during background segmentation:', error);
    throw error;
  }
}

/**
 * Apply blur to background (alternative to solid color)
 */
export async function blurBackground(
  canvas: HTMLCanvasElement,
  blurAmount: number = 15
): Promise<void> {
  if (!segmentationModel) {
    console.warn('Segmentation model not initialized');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  try {
    // Perform segmentation
    const segmentation = await segmentationModel.segmentPerson(canvas, {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: 0.7,
    });

    // Create a copy of the original image
    const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply blur to entire image
    ctx.filter = `blur(${blurAmount}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
    
    const blurredImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const blurredPixels = blurredImageData.data;
    const originalPixels = originalImageData.data;

    // Composite: use original for person, blurred for background
    for (let i = 0; i < segmentation.data.length; i++) {
      const shouldKeep = segmentation.data[i];
      
      if (shouldKeep) {
        // This is the person - use original pixels
        const pixelIndex = i * 4;
        blurredPixels[pixelIndex] = originalPixels[pixelIndex];         // R
        blurredPixels[pixelIndex + 1] = originalPixels[pixelIndex + 1]; // G
        blurredPixels[pixelIndex + 2] = originalPixels[pixelIndex + 2]; // B
        blurredPixels[pixelIndex + 3] = originalPixels[pixelIndex + 3]; // A
      }
    }

    // Put the composited image back
    ctx.putImageData(blurredImageData, 0, 0);
  } catch (error) {
    console.error('Error during background blur:', error);
    throw error;
  }
}

/**
 * Helper function to convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Cleanup segmentation resources
 */
export async function cleanupSegmentation(): Promise<void> {
  if (segmentationModel) {
    segmentationModel.dispose();
    segmentationModel = null;
  }
}
