/**
 * Custom hook for pose guidance
 */

import { useMemo } from 'react';
import { FaceDetectionResult, PoseGuidance } from '../types';
import { calculatePoseGuidance } from '../utils/poseGuidance';

interface UsePoseGuidanceOptions {
  faceDetection: FaceDetectionResult | null;
  videoWidth: number;
  videoHeight: number;
}

export function usePoseGuidance({
  faceDetection,
  videoWidth,
  videoHeight,
}: UsePoseGuidanceOptions): PoseGuidance | null {
  const guidance = useMemo(() => {
    if (!faceDetection || videoWidth === 0 || videoHeight === 0) {
      return null;
    }

    return calculatePoseGuidance({
      videoWidth,
      videoHeight,
      faceBox: faceDetection.boundingBox,
      landmarks: faceDetection.landmarks,
    });
  }, [faceDetection, videoWidth, videoHeight]);

  return guidance;
}
