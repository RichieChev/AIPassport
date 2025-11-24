/**
 * Custom hook for face detection
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { FaceDetectionResult } from '../types';
import {
  initializeFaceDetection,
  detectFaces,
  cleanupFaceDetection,
} from '../utils/faceDetection';

interface UseFaceDetectionOptions {
  enabled: boolean;
  videoElement: HTMLVideoElement | null;
  detectionInterval?: number; // ms between detections
}

export function useFaceDetection({
  enabled,
  videoElement,
  detectionInterval = 100,
}: UseFaceDetectionOptions) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceDetection, setFaceDetection] = useState<FaceDetectionResult | null>(
    null
  );

  const detectionIntervalRef = useRef<number | null>(null);
  const isDetectingRef = useRef(false);

  // Initialize face detection model
  useEffect(() => {
    if (!enabled) return;

    const initialize = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('Initializing face detection model...');
        await initializeFaceDetection();
        console.log('Face detection model initialized successfully');
        setIsInitialized(true);
      } catch (err) {
        setError('Failed to initialize face detection');
        console.error('Face detection initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      cleanupFaceDetection();
      setIsInitialized(false);
    };
  }, [enabled]);

  // Run face detection at intervals
  const runDetection = useCallback(async () => {
    if (!videoElement || !isInitialized || isDetectingRef.current) {
      return;
    }

    // Check if video is ready and has actual dimensions
    if (
      videoElement.readyState < 2 || // HAVE_CURRENT_DATA or higher
      videoElement.videoWidth === 0 ||
      videoElement.videoHeight === 0
    ) {
      // Video not ready - skip this detection cycle
      return;
    }

    isDetectingRef.current = true;

    try {
      const result = await detectFaces(videoElement);
      setFaceDetection(result);
    } catch (err) {
      console.error('Detection error:', err);
    } finally {
      isDetectingRef.current = false;
    }
  }, [videoElement, isInitialized]);

  // Start/stop detection loop
  useEffect(() => {
    if (!enabled || !isInitialized || !videoElement) {
      return;
    }

    // Start detection interval
    detectionIntervalRef.current = window.setInterval(() => {
      runDetection();
    }, detectionInterval);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [enabled, isInitialized, videoElement, detectionInterval, runDetection]);

  return {
    isInitialized,
    isLoading,
    error,
    faceDetection,
  };
}
