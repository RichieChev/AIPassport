/**
 * Face detection using TensorFlow.js Face Landmarks Detection
 */

import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { FaceDetectionResult, FaceLandmarks, FaceBoundingBox } from '../types';

let detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;

/**
 * Initialize the face detection model
 */
export async function initializeFaceDetection(): Promise<void> {
  if (detector) {
    console.log('Face detector already initialized');
    return;
  }

  try {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    
    // Use TensorFlow.js backend instead of MediaPipe for better compatibility
    const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig =
      {
        runtime: 'tfjs',
        refineLandmarks: false, // Disable for better performance
        maxFaces: 1,
      };

    detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
    console.log('✓ Face detection model loaded successfully');
  } catch (error) {
    console.error('✗ Failed to load face detection model:', error);
    detector = null;
    throw error;
  }
}

/**
 * Detect faces in a video element or canvas
 */
export async function detectFaces(
  input: HTMLVideoElement | HTMLCanvasElement
): Promise<FaceDetectionResult | null> {
  if (!detector) {
    console.warn('Face detector not initialized');
    return null;
  }

  try {
    // Check input dimensions
    const width = input instanceof HTMLVideoElement ? input.videoWidth : input.width;
    const height = input instanceof HTMLVideoElement ? input.videoHeight : input.height;
    
    if (width === 0 || height === 0) {
      return null;
    }

    const faces = await detector.estimateFaces(input, {
      flipHorizontal: false,
    });

    if (faces.length === 0) {
      return null;
    }

    // Use the first detected face
    const face = faces[0];

    // Extract bounding box
    const box = face.box;
    const boundingBox: FaceBoundingBox = {
      x: box.xMin,
      y: box.yMin,
      width: box.width,
      height: box.height,
    };

    // Extract key landmarks
    // MediaPipe Face Mesh provides 468 landmarks, we need specific ones
    const keypoints = face.keypoints;

    // Key landmark indices for MediaPipe Face Mesh:
    // Left eye: 33, 133, 159, 145 (we'll use center)
    // Right eye: 362, 263, 386, 374
    // Nose tip: 1
    // Mouth: 13 (upper lip), 14 (lower lip)
    // Chin: 152

    const leftEyePoints = [33, 133, 159, 145].map((i) => keypoints[i]);
    const rightEyePoints = [362, 263, 386, 374].map((i) => keypoints[i]);

    const leftEye = {
      x: leftEyePoints.reduce((sum, p) => sum + p.x, 0) / leftEyePoints.length,
      y: leftEyePoints.reduce((sum, p) => sum + p.y, 0) / leftEyePoints.length,
    };

    const rightEye = {
      x: rightEyePoints.reduce((sum, p) => sum + p.x, 0) / rightEyePoints.length,
      y: rightEyePoints.reduce((sum, p) => sum + p.y, 0) / rightEyePoints.length,
    };

    const landmarks: FaceLandmarks = {
      leftEye,
      rightEye,
      nose: { x: keypoints[1].x, y: keypoints[1].y },
      mouth: { x: keypoints[13].x, y: keypoints[13].y },
      chin: { x: keypoints[152].x, y: keypoints[152].y },
    };

    return {
      boundingBox,
      landmarks,
      confidence: 0.9, // MediaPipe doesn't provide confidence, use default
    };
  } catch (error) {
    console.error('Error detecting faces:', error);
    return null;
  }
}

/**
 * Draw face detection overlay on canvas
 */
export function drawFaceOverlay(
  canvas: HTMLCanvasElement,
  detection: FaceDetectionResult,
  color: string = '#00ff00'
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { boundingBox, landmarks } = detection;

  // Draw bounding box
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(
    boundingBox.x,
    boundingBox.y,
    boundingBox.width,
    boundingBox.height
  );

  // Draw landmarks
  ctx.fillStyle = color;
  const landmarkSize = 4;

  Object.values(landmarks).forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, landmarkSize, 0, 2 * Math.PI);
    ctx.fill();
  });

  // Draw eye line to show tilt
  ctx.beginPath();
  ctx.moveTo(landmarks.leftEye.x, landmarks.leftEye.y);
  ctx.lineTo(landmarks.rightEye.x, landmarks.rightEye.y);
  ctx.stroke();
}

/**
 * Draw guide box overlay
 */
export function drawGuideBox(
  canvas: HTMLCanvasElement,
  videoWidth: number,
  videoHeight: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Calculate ideal face box (centered, 50-60% of height)
  const guideHeight = videoHeight * 0.55;
  const guideWidth = guideHeight * 0.75; // Roughly face aspect ratio
  const guideX = (videoWidth - guideWidth) / 2;
  const guideY = videoHeight * 0.25;

  // Draw guide box
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.strokeRect(guideX, guideY, guideWidth, guideHeight);
  ctx.setLineDash([]);

  // Draw center crosshair
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(videoWidth / 2, guideY);
  ctx.lineTo(videoWidth / 2, guideY + guideHeight);
  ctx.stroke();

  // Horizontal line (eye level)
  const eyeLineY = guideY + guideHeight * 0.4;
  ctx.beginPath();
  ctx.moveTo(guideX, eyeLineY);
  ctx.lineTo(guideX + guideWidth, eyeLineY);
  ctx.stroke();
}

/**
 * Cleanup face detection resources
 */
export async function cleanupFaceDetection(): Promise<void> {
  if (detector) {
    detector.dispose();
    detector = null;
  }
}
