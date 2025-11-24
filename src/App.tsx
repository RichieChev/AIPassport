/**
 * Main App component - Passport Photo Assistant
 */

import { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { AppState, CapturedPhoto, FaceDetectionResult } from './types';
import { WebcamCapture } from './components/WebcamCapture';
import { ComplianceResult } from './components/ComplianceResult';
import { PhotoExport } from './components/PhotoExport';
import {
  processCapturedImage,
  cropToPassportSize,
  downloadImage,
} from './utils/imageProcessing';
import { checkCompliance } from './utils/complianceRules';
import { US_PASSPORT_CONFIG } from './utils/complianceRules';
// import { initializeSegmentation } from './utils/backgroundSegmentation'; // Temporarily disabled

function App() {
  const [appState, setAppState] = useState<AppState>('capture');
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [processedImageData, setProcessedImageData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize background segmentation model on mount
  // Temporarily disabled - causing color artifacts
  // useEffect(() => {
  //   const loadSegmentationModel = async () => {
  //     try {
  //       await initializeSegmentation();
  //     } catch (error) {
  //       console.warn('Failed to load background segmentation model:', error);
  //       // App will still work with fallback background removal
  //     }
  //   };
  //   
  //   loadSegmentationModel();
  // }, []);

  // Handle photo capture
  const handleCapture = async (
    imageData: string,
    faceDetection: FaceDetectionResult | null
  ) => {
    setIsProcessing(true);

    try {
      // Create canvas from image data
      const img = new Image();
      img.src = imageData;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      let compliance = null;

      // Check compliance only if face was detected
      if (faceDetection) {
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        compliance = checkCompliance(
          imageDataObj,
          faceDetection.boundingBox,
          faceDetection.landmarks
        );
      } else {
        // No face detected - create a failed compliance result
        compliance = {
          passed: false,
          score: 0,
          reasons: ['No face detected in the photo. Please retake with your face clearly visible.']
        };
      }

      // Store captured photo
      setCapturedPhoto({
        imageData,
        faceDetection,
        timestamp: Date.now(),
      });

      setComplianceResult(compliance);
      setAppState('review');
    } catch (error) {
      console.error('Error processing capture:', error);
      alert('Failed to process photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle retake
  const handleRetake = () => {
    setCapturedPhoto(null);
    setComplianceResult(null);
    setProcessedImageData(null);
    setAppState('capture');
  };

  // Handle accept (process and move to export)
  const handleAccept = async () => {
    if (!capturedPhoto) return;

    setIsProcessing(true);

    try {
      // Create canvas from captured image
      const img = new Image();
      img.src = capturedPhoto.imageData;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      let finalCanvas: HTMLCanvasElement;

      // Process image only if face was detected
      if (capturedPhoto.faceDetection) {
        // Process image (background replacement, lighting adjustment)
        await processCapturedImage(canvas, capturedPhoto.faceDetection.boundingBox);

        // Crop to passport size
        finalCanvas = cropToPassportSize(
          canvas,
          capturedPhoto.faceDetection.boundingBox,
          US_PASSPORT_CONFIG.outputWidth,
          US_PASSPORT_CONFIG.outputHeight
        );
      } else {
        // No face detected - just resize to passport size without processing
        finalCanvas = document.createElement('canvas');
        finalCanvas.width = US_PASSPORT_CONFIG.outputWidth;
        finalCanvas.height = US_PASSPORT_CONFIG.outputHeight;
        const finalCtx = finalCanvas.getContext('2d')!;
        finalCtx.drawImage(canvas, 0, 0, finalCanvas.width, finalCanvas.height);
      }

      // Convert to data URL
      const finalImageData = finalCanvas.toDataURL('image/jpeg', 0.95);
      setProcessedImageData(finalImageData);
      setAppState('export');
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!processedImageData) return;

    try {
      // Create canvas from processed image
      const img = new Image();
      img.src = processedImageData;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      // Download
      await downloadImage(canvas, 'passport-photo.jpg');
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Passport Photo Assistant
              </h1>
              <p className="text-sm text-gray-600">
                Live pose coaching & compliance checking
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                appState === 'capture' ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  appState === 'capture'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                1
              </div>
              <span className="font-medium">Capture</span>
            </div>

            <div className="w-16 h-1 bg-gray-300 rounded" />

            <div
              className={`flex items-center gap-2 ${
                appState === 'review' ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  appState === 'review'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                2
              </div>
              <span className="font-medium">Review</span>
            </div>

            <div className="w-16 h-1 bg-gray-300 rounded" />

            <div
              className={`flex items-center gap-2 ${
                appState === 'export' ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  appState === 'export'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                3
              </div>
              <span className="font-medium">Export</span>
            </div>
          </div>
        </div>

        {/* State-based content */}
        {appState === 'capture' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Position Your Face
              </h2>
              <p className="text-gray-600">
                Follow the on-screen guidance to capture a compliant photo
              </p>
            </div>
            <WebcamCapture onCapture={handleCapture} />
          </div>
        )}

        {appState === 'review' && capturedPhoto && complianceResult && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Review Your Photo
              </h2>
              <p className="text-gray-600">
                Check if your photo meets passport requirements
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Photo preview */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Captured Photo:</h3>
                <img
                  src={capturedPhoto.imageData}
                  alt="Captured"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>

              {/* Compliance result */}
              <div>
                <ComplianceResult
                  result={complianceResult}
                  onRetake={handleRetake}
                  onAccept={handleAccept}
                />
              </div>
            </div>
          </div>
        )}

        {appState === 'export' && processedImageData && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Download Your Photo
              </h2>
              <p className="text-gray-600">
                Your compliant passport photo is ready
              </p>
            </div>
            <PhotoExport
              imageData={processedImageData}
              onDownload={handleDownload}
              onStartOver={handleRetake}
            />
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900">Processing...</p>
            </div>
          </div>
        )}
      </main>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-600">
        <p>
          AI-powered passport photo assistant • Built with React, TypeScript, and
          TensorFlow.js
        </p>
      </footer>
    </div>
  );
}

export default App;
