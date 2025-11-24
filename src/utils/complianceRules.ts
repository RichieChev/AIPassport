/**
 * Compliance rules for passport photos
 * Based on US passport photo requirements
 */

import {
  ComplianceRule,
  ComplianceResult,
  FaceBoundingBox,
  FaceLandmarks,
  PassportPhotoConfig,
} from '../types';

// US Passport photo configuration
export const US_PASSPORT_CONFIG: PassportPhotoConfig = {
  country: 'United States',
  headHeightMinPercent: 50, // Head should be 50-69% of image height
  headHeightMaxPercent: 69,
  eyeHeightMinPercent: 56, // Eyes should be 56-69% from bottom
  eyeHeightMaxPercent: 69,
  backgroundVarianceThreshold: 30, // Max color variance for uniform background
  outputWidth: 600,
  outputHeight: 600,
  outputDPI: 300,
};

/**
 * Calculate the variance of pixel values in a region
 */
function calculateVariance(imageData: ImageData, samples: number = 100): number {
  const data = imageData.data;
  const step = Math.floor(data.length / (samples * 4));
  const values: number[] = [];

  for (let i = 0; i < data.length; i += step * 4) {
    // Calculate grayscale value
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    values.push(gray);
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Sample background pixels (corners and edges)
 */
function getBackgroundSample(
  imageData: ImageData,
  faceBox: FaceBoundingBox
): ImageData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);

  // Sample from corners and edges, avoiding the face area
  const sampleSize = 50;
  const samples: ImageData[] = [];

  // Top-left corner
  samples.push(ctx.getImageData(0, 0, sampleSize, sampleSize));
  // Top-right corner
  samples.push(
    ctx.getImageData(imageData.width - sampleSize, 0, sampleSize, sampleSize)
  );
  // Bottom-left corner
  samples.push(
    ctx.getImageData(0, imageData.height - sampleSize, sampleSize, sampleSize)
  );
  // Bottom-right corner
  samples.push(
    ctx.getImageData(
      imageData.width - sampleSize,
      imageData.height - sampleSize,
      sampleSize,
      sampleSize
    )
  );

  // Combine all samples
  const combinedData = new Uint8ClampedArray(
    samples.reduce((acc, s) => acc + s.data.length, 0)
  );
  let offset = 0;
  samples.forEach((s) => {
    combinedData.set(s.data, offset);
    offset += s.data.length;
  });

  return new ImageData(combinedData, sampleSize * 2, sampleSize * 2);
}

/**
 * Define compliance rules
 */
export const complianceRules: ComplianceRule[] = [
  {
    name: 'Head Height',
    description: 'Head must be between 50% and 69% of image height',
    check: (imageData, faceBox, landmarks, width, height) => {
      const headHeightPercent = (faceBox.height / height) * 100;
      return (
        headHeightPercent >= US_PASSPORT_CONFIG.headHeightMinPercent &&
        headHeightPercent <= US_PASSPORT_CONFIG.headHeightMaxPercent
      );
    },
  },
  {
    name: 'Eye Position',
    description: 'Eyes must be positioned between 56% and 69% from bottom',
    check: (imageData, faceBox, landmarks, width, height) => {
      const eyeY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
      const eyeHeightPercent = ((height - eyeY) / height) * 100;
      return (
        eyeHeightPercent >= US_PASSPORT_CONFIG.eyeHeightMinPercent &&
        eyeHeightPercent <= US_PASSPORT_CONFIG.eyeHeightMaxPercent
      );
    },
  },
  {
    name: 'Face Centered',
    description: 'Face must be horizontally centered',
    check: (imageData, faceBox, landmarks, width, height) => {
      const faceCenter = faceBox.x + faceBox.width / 2;
      const imageCenter = width / 2;
      const offset = Math.abs(faceCenter - imageCenter);
      const maxOffset = width * 0.15; // Allow 15% deviation
      return offset < maxOffset;
    },
  },
  {
    name: 'Eyes Level',
    description: 'Eyes must be level (no significant head tilt)',
    check: (imageData, faceBox, landmarks, width, height) => {
      const leftEye = landmarks.leftEye;
      const rightEye = landmarks.rightEye;
      const eyeDiff = Math.abs(leftEye.y - rightEye.y);
      const eyeDistance = Math.abs(leftEye.x - rightEye.x);
      const tiltRatio = eyeDiff / eyeDistance;
      return tiltRatio < 0.1; // Less than 10% tilt
    },
  },
  {
    name: 'Uniform Background',
    description: 'Background must be uniform (low color variance)',
    check: (imageData, faceBox, landmarks, width, height) => {
      const backgroundSample = getBackgroundSample(imageData, faceBox);
      const variance = calculateVariance(backgroundSample);
      return variance < US_PASSPORT_CONFIG.backgroundVarianceThreshold;
    },
  },
];

/**
 * Check compliance against all rules
 */
export function checkCompliance(
  imageData: ImageData,
  faceBox: FaceBoundingBox,
  landmarks: FaceLandmarks
): ComplianceResult {
  const width = imageData.width;
  const height = imageData.height;
  const results: { rule: ComplianceRule; passed: boolean }[] = [];

  complianceRules.forEach((rule) => {
    const passed = rule.check(imageData, faceBox, landmarks, width, height);
    results.push({ rule, passed });
  });

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const score = Math.round((passedCount / totalCount) * 100);

  const reasons = results
    .filter((r) => !r.passed)
    .map((r) => `${r.rule.name}: ${r.rule.description}`);

  return {
    passed: passedCount === totalCount,
    reasons,
    score,
  };
}

/**
 * Get human-readable compliance summary
 */
export function getComplianceSummary(result: ComplianceResult): string {
  if (result.passed) {
    return '✓ Photo meets all US passport requirements';
  }
  return `✗ Photo does not meet requirements (${result.score}% compliant)`;
}
