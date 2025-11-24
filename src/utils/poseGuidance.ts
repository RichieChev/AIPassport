/**
 * Pose guidance logic for real-time coaching
 */

import { FaceBoundingBox, FaceLandmarks, PoseGuidance } from '../types';

interface GuidanceParams {
  videoWidth: number;
  videoHeight: number;
  faceBox: FaceBoundingBox;
  landmarks: FaceLandmarks;
}

/**
 * Calculate pose guidance based on face detection results
 */
export function calculatePoseGuidance({
  videoWidth,
  videoHeight,
  faceBox,
  landmarks,
}: GuidanceParams): PoseGuidance {
  // Only log if video dimensions are valid
  if (videoWidth === 0 || videoHeight === 0) {
    return {
      message: '⏳ Initializing...',
      type: 'info' as const,
      isOptimal: false,
    };
  }

  // Define ideal face size (50-60% of frame height)
  const idealFaceHeightMin = videoHeight * 0.5;
  const idealFaceHeightMax = videoHeight * 0.6;

  // Define ideal horizontal position (centered)
  const idealCenterX = videoWidth / 2;
  const faceCenterX = faceBox.x + faceBox.width / 2;

  // Define ideal vertical position (slightly above center)
  const idealCenterY = videoHeight * 0.45;
  const faceCenterY = faceBox.y + faceBox.height / 2;

  // Check face size
  if (faceBox.height < idealFaceHeightMin * 0.8) {
    return {
      message: '📏 Move closer to the camera',
      type: 'warning' as const,
      isOptimal: false,
    };
  }

  if (faceBox.height > idealFaceHeightMax * 1.2) {
    return {
      message: '📏 Step back a little',
      type: 'warning' as const,
      isOptimal: false,
    };
  }

  // Check horizontal centering
  const horizontalOffset = Math.abs(faceCenterX - idealCenterX);
  const maxHorizontalOffset = videoWidth * 0.15;

  if (horizontalOffset > maxHorizontalOffset) {
    if (faceCenterX < idealCenterX) {
      return {
        message: '⬅️ Move slightly to your right',
        type: 'warning' as const,
        isOptimal: false,
      };
    } else {
      return {
        message: '➡️ Move slightly to your left',
        type: 'warning' as const,
        isOptimal: false,
      };
    }
  }

  // Check vertical centering
  const verticalOffset = Math.abs(faceCenterY - idealCenterY);
  const maxVerticalOffset = videoHeight * 0.15;

  if (verticalOffset > maxVerticalOffset) {
    if (faceCenterY < idealCenterY) {
      return {
        message: '⬇️ Move down slightly',
        type: 'warning' as const,
        isOptimal: false,
      };
    } else {
      return {
        message: '⬆️ Move up slightly',
        type: 'warning' as const,
        isOptimal: false,
      };
    }
  }

  // Check head tilt (eyes should be level)
  const leftEye = landmarks.leftEye;
  const rightEye = landmarks.rightEye;
  const eyeDiff = Math.abs(leftEye.y - rightEye.y);
  const eyeDistance = Math.abs(leftEye.x - rightEye.x);
  const tiltRatio = eyeDiff / eyeDistance;

  if (tiltRatio > 0.1) {
    if (leftEye.y < rightEye.y) {
      return {
        message: '🔄 Tilt your head slightly to the right',
        type: 'warning' as const,
        isOptimal: false,
      };
    } else {
      return {
        message: '🔄 Tilt your head slightly to the left',
        type: 'warning' as const,
        isOptimal: false,
      };
    }
  }

  // Check if face is in optimal position
  const isOptimalSize =
    faceBox.height >= idealFaceHeightMin && faceBox.height <= idealFaceHeightMax;
  const isOptimalPosition =
    horizontalOffset < maxHorizontalOffset * 0.5 &&
    verticalOffset < maxVerticalOffset * 0.5;
  const isOptimalTilt = tiltRatio < 0.05;

  if (isOptimalSize && isOptimalPosition && isOptimalTilt) {
    return {
      message: '✅ Perfect! Hold still and capture',
      type: 'success' as const,
      isOptimal: true,
    };
  }

  // Minor adjustments needed
  return {
    message: '👍 Almost there! Make small adjustments',
    type: 'info' as const,
    isOptimal: false,
  };
}

/**
 * Get guidance color based on type
 */
export function getGuidanceColor(type: PoseGuidance['type']): string {
  switch (type) {
    case 'success':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    case 'info':
    default:
      return 'text-blue-500';
  }
}

/**
 * Get guidance background color based on type
 */
export function getGuidanceBackgroundColor(type: PoseGuidance['type']): string {
  switch (type) {
    case 'success':
      return 'bg-green-500/20';
    case 'warning':
      return 'bg-yellow-500/20';
    case 'error':
      return 'bg-red-500/20';
    case 'info':
    default:
      return 'bg-blue-500/20';
  }
}
