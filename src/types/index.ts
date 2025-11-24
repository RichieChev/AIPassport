/**
 * Type definitions for the Passport Photo Assistant
 */

export interface FaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  nose: { x: number; y: number };
  mouth: { x: number; y: number };
  chin: { x: number; y: number };
}

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceDetectionResult {
  boundingBox: FaceBoundingBox;
  landmarks: FaceLandmarks;
  confidence: number;
}

export interface PoseGuidance {
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isOptimal: boolean;
}

export interface ComplianceRule {
  name: string;
  description: string;
  check: (
    imageData: ImageData,
    faceBox: FaceBoundingBox,
    landmarks: FaceLandmarks,
    imageWidth: number,
    imageHeight: number
  ) => boolean;
}

export interface ComplianceResult {
  passed: boolean;
  reasons: string[];
  score: number; // 0-100
}

export interface PassportPhotoConfig {
  country: string;
  headHeightMinPercent: number;
  headHeightMaxPercent: number;
  eyeHeightMinPercent: number;
  eyeHeightMaxPercent: number;
  backgroundVarianceThreshold: number;
  outputWidth: number;
  outputHeight: number;
  outputDPI: number;
}

export type AppState = 'capture' | 'review' | 'export';

export interface CapturedPhoto {
  imageData: string; // base64 data URL
  faceDetection: FaceDetectionResult | null;
  timestamp: number;
}
