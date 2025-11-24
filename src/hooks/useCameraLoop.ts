/**
 * Optimized camera loop using requestAnimationFrame
 * Handles video rendering and throttled face detection for smooth performance
 */

import { useEffect, useRef, useCallback } from 'react';
import { FaceDetectionResult } from '../types';
import { detectFaces } from '../utils/faceDetection';

interface UseCameraLoopOptions {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  enabled: boolean;
  detectionThrottle?: number; // ms between detections (default: 250ms)
  detectionScale?: number; // scale factor for detection canvas (default: 0.25 = 1/4 size)
  onFaceDetected?: (result: FaceDetectionResult | null) => void;
  onError?: (error: Error) => void;
}

export function useCameraLoop({
  videoElement,
  canvasElement,
  enabled,
  detectionThrottle = 250,
  detectionScale = 0.25,
  onFaceDetected,
  onError,
}: UseCameraLoopOptions) {
  const animationFrameRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const detectionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDetectingRef = useRef(false);
  const lastFaceResultRef = useRef<FaceDetectionResult | null>(null);

  // Create small detection canvas for performance
  const getDetectionCanvas = useCallback(() => {
    if (!detectionCanvasRef.current && videoElement) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(videoElement.videoWidth * detectionScale);
      canvas.height = Math.floor(videoElement.videoHeight * detectionScale);
      detectionCanvasRef.current = canvas;
    }
    return detectionCanvasRef.current;
  }, [videoElement, detectionScale]);

  // Main camera loop using requestAnimationFrame
  const renderLoop = useCallback(() => {
    if (!enabled || !videoElement || !canvasElement) {
      return;
    }

    // Check if video is ready
    if (
      videoElement.readyState < 2 ||
      videoElement.videoWidth === 0 ||
      videoElement.videoHeight === 0
    ) {
      // Video not ready, try again next frame
      animationFrameRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    // Update canvas size if needed
    if (
      canvasElement.width !== videoElement.videoWidth ||
      canvasElement.height !== videoElement.videoHeight
    ) {
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
    }

    // Draw current video frame to canvas
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    // Throttled face detection
    const now = performance.now();
    const timeSinceLastDetection = now - lastDetectionTimeRef.current;

    if (
      timeSinceLastDetection >= detectionThrottle &&
      !isDetectingRef.current
    ) {
      lastDetectionTimeRef.current = now;
      isDetectingRef.current = true;

      // Run detection on smaller canvas for performance
      const detectionCanvas = getDetectionCanvas();
      if (detectionCanvas) {
        const detectionCtx = detectionCanvas.getContext('2d');
        if (detectionCtx) {
          // Update detection canvas size if needed
          const targetWidth = Math.floor(videoElement.videoWidth * detectionScale);
          const targetHeight = Math.floor(videoElement.videoHeight * detectionScale);
          
          if (detectionCanvas.width !== targetWidth || detectionCanvas.height !== targetHeight) {
            detectionCanvas.width = targetWidth;
            detectionCanvas.height = targetHeight;
          }

          // Draw scaled-down video frame
          detectionCtx.drawImage(
            videoElement,
            0,
            0,
            detectionCanvas.width,
            detectionCanvas.height
          );

          // Run face detection asynchronously
          detectFaces(detectionCanvas)
            .then((result) => {
              // Scale bounding box back up to video dimensions
              if (result) {
                const scaleFactor = 1 / detectionScale;
                result.boundingBox = {
                  x: result.boundingBox.x * scaleFactor,
                  y: result.boundingBox.y * scaleFactor,
                  width: result.boundingBox.width * scaleFactor,
                  height: result.boundingBox.height * scaleFactor,
                };
                
                // Scale landmarks back up
                Object.keys(result.landmarks).forEach((key) => {
                  const landmark = result.landmarks[key as keyof typeof result.landmarks];
                  landmark.x *= scaleFactor;
                  landmark.y *= scaleFactor;
                });
              }

              // Only call callback if result changed
              if (
                JSON.stringify(result?.boundingBox) !==
                JSON.stringify(lastFaceResultRef.current?.boundingBox)
              ) {
                lastFaceResultRef.current = result;
                onFaceDetected?.(result);
              }
            })
            .catch((error) => {
              onError?.(error);
            })
            .finally(() => {
              isDetectingRef.current = false;
            });
        }
      }
    }

    // Continue loop
    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [
    enabled,
    videoElement,
    canvasElement,
    detectionThrottle,
    detectionScale,
    getDetectionCanvas,
    onFaceDetected,
    onError,
  ]);

  // Start/stop loop based on enabled state
  useEffect(() => {
    if (enabled && videoElement && canvasElement) {
      // Start the loop
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    }

    // Cleanup function
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clean up detection canvas
      if (detectionCanvasRef.current) {
        detectionCanvasRef.current = null;
      }
    };
  }, [enabled, videoElement, canvasElement, renderLoop]);

  return {
    isRunning: animationFrameRef.current !== null,
  };
}
