/**
 * Webcam capture component with live preview and face detection overlay
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useWebcam } from '../hooks/useWebcam';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { useCameraLoop } from '../hooks/useCameraLoop';
import { usePoseGuidance } from '../hooks/usePoseGuidance';
import { PoseGuidanceOverlay } from './PoseGuidanceOverlay';
import { drawGuideBox, drawFaceOverlay } from '../utils/faceDetection';
import { FaceDetectionResult } from '../types';

interface WebcamCaptureProps {
  onCapture: (imageData: string, faceDetection: any) => void;
}

// Helper to handle file upload
const handleFileUpload = (
  event: React.ChangeEvent<HTMLInputElement>,
  onCapture: (imageData: string, faceDetection: any) => void
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const imageData = e.target?.result as string;
    // For uploaded photos, we'll skip face detection for now
    onCapture(imageData, null);
  };
  reader.readAsDataURL(file);
};

export function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const { videoRef, stream, error, isLoading, startWebcam } = useWebcam({
    width: 1280,
    height: 720,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [currentFaceDetection, setCurrentFaceDetection] = useState<FaceDetectionResult | null>(null);

  // Track video dimensions
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDimensions = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoDimensions({
          width: video.videoWidth,
          height: video.videoHeight,
        });
      }
    };

    // Update on metadata loaded
    video.addEventListener('loadedmetadata', updateDimensions);
    
    // Also check periodically in case event is missed
    const interval = setInterval(updateDimensions, 500);

    return () => {
      video.removeEventListener('loadedmetadata', updateDimensions);
      clearInterval(interval);
    };
  }, [videoRef.current, stream]);

  // Initialize face detection model only
  const { isLoading: isModelLoading, isInitialized } = useFaceDetection({
    enabled: !!stream,
    videoElement: videoRef.current,
    detectionInterval: 300, // Not used anymore, kept for compatibility
  });

  // Optimized camera loop with throttled detection
  const handleFaceDetected = useCallback((result: FaceDetectionResult | null) => {
    setCurrentFaceDetection(result);
  }, []);

  useCameraLoop({
    videoElement: videoRef.current,
    canvasElement: previewCanvasRef.current,
    enabled: !!stream && isInitialized,
    detectionThrottle: 250, // Run detection every 250ms
    detectionScale: 0.25, // Use 1/4 size canvas for detection
    onFaceDetected: handleFaceDetected,
    onError: (error) => console.error('Camera loop error:', error),
  });

  const guidance = usePoseGuidance({
    faceDetection: currentFaceDetection,
    videoWidth: videoDimensions.width,
    videoHeight: videoDimensions.height,
  });

  // Start webcam on mount (only once)
  useEffect(() => {
    startWebcam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw overlay with guide box and face detection using requestAnimationFrame
  useEffect(() => {
    if (!videoRef.current || !overlayCanvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;
    
    // Ensure video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    let animationId: number;

    const drawOverlay = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationId = requestAnimationFrame(drawOverlay);
        return;
      }

      // Set canvas size to match video (only if changed)
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Save context state
      ctx.save();
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply inverse transform to compensate for CSS scaleX(-1)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      // Draw guide box
      drawGuideBox(canvas, video.videoWidth, video.videoHeight);

      // Draw face detection overlay
      if (currentFaceDetection) {
        const color = guidance?.isOptimal ? '#00ff00' : '#ffaa00';
        drawFaceOverlay(canvas, currentFaceDetection, color);
      }

      // Restore context state
      ctx.restore();

      // Continue loop
      animationId = requestAnimationFrame(drawOverlay);
    };

    // Start the overlay loop
    animationId = requestAnimationFrame(drawOverlay);

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [currentFaceDetection, guidance, videoDimensions, stream]);

  // Capture photo
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture image from video
    ctx.drawImage(video, 0, 0);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.95);

    // Pass to parent with face detection data
    onCapture(imageData, currentFaceDetection);
  };

  // Allow capture when stream is ready, even without face detection
  const canCapture = !!stream && !isModelLoading;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Overlay canvas for guide box and face detection */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Hidden preview canvas for camera loop (used for rendering) */}
        <canvas ref={previewCanvasRef} className="hidden" />

        {/* Loading overlay */}
        {(isLoading || isModelLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p className="text-lg">
                {isLoading ? 'Starting camera...' : 'Loading AI model...'}
              </p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white p-6">
              <Camera className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-lg font-semibold mb-2">Camera Access Error</p>
              <p className="text-sm text-gray-300 mb-4">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={startWebcam}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Retry Camera Access
                </button>
                <label className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer">
                  Upload Photo Instead
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, onCapture)}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                <strong>Troubleshooting:</strong><br/>
                • Check if your camera is connected and enabled<br/>
                • Allow camera access in browser settings<br/>
                • Close other apps that might be using the camera<br/>
                • On Mac: System Preferences → Security & Privacy → Camera
              </p>
            </div>
          </div>
        )}

        {/* Pose guidance overlay */}
        {!isModelLoading && stream && (
          <PoseGuidanceOverlay 
            guidance={guidance || (currentFaceDetection ? {
              message: '👤 Face detected! Adjusting position...',
              type: 'info',
              isOptimal: false
            } : {
              message: '🔍 Position your face in the guide box',
              type: 'warning',
              isOptimal: false
            })} 
          />
        )}
      </div>

      {/* Capture button */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          onClick={handleCapture}
          disabled={!canCapture}
          className={`
            px-12 py-5 rounded-full font-bold text-2xl
            transition-all duration-200 transform
            flex items-center gap-3
            ${
              canCapture
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xl hover:scale-110 active:scale-95 cursor-pointer'
                : 'bg-gray-400 text-gray-700 cursor-not-allowed opacity-50'
            }
          `}
        >
          <Camera className="w-8 h-8" />
          <span>Capture Photo</span>
        </button>
        
        {canCapture && currentFaceDetection && (
          <p className="text-sm text-green-600 font-semibold animate-pulse">
            ✓ Ready to capture!
          </p>
        )}
        
        {canCapture && !currentFaceDetection && (
          <p className="text-sm text-yellow-600 font-semibold">
            ⚠️ No face detected - capture anyway or adjust position
          </p>
        )}

        {!currentFaceDetection && stream && !isModelLoading && (
          <p className="text-sm text-gray-500">
            Position your face within the guide box
          </p>
        )}
        
        {/* Debug info */}
        <div className="text-xs text-gray-400 mt-2 text-left space-y-1">
          <p>Stream: {stream ? '✓ Active' : '✗ Not started'}</p>
          <p>Model: {isModelLoading ? '⏳ Loading...' : '✓ Ready'}</p>
          <p>Face: {currentFaceDetection ? '✓ Detected' : '✗ Not detected'}</p>
          <p>Video: {videoDimensions.width}x{videoDimensions.height} (tracked)</p>
          <p>Ready State: {videoRef.current?.readyState}</p>
          <p>Guidance: {guidance ? `✓ "${guidance.message}"` : '✗ No guidance (need video dimensions)'}</p>
          {currentFaceDetection && (
            <p className="text-green-500">
              Face Box: {Math.round(currentFaceDetection.boundingBox.width)}x{Math.round(currentFaceDetection.boundingBox.height)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
