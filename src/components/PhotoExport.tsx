/**
 * Photo export component with download functionality
 */

import { Download, RotateCcw } from 'lucide-react';
import { US_PASSPORT_CONFIG } from '../utils/complianceRules';

interface PhotoExportProps {
  imageData: string;
  onDownload: () => void;
  onStartOver: () => void;
}

export function PhotoExport({
  imageData,
  onDownload,
  onStartOver,
}: PhotoExportProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Success message */}
      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-green-900 mb-2">
          🎉 Your Passport Photo is Ready!
        </h3>
        <p className="text-green-700">
          Your photo has been processed and is ready for download. It meets all{' '}
          {US_PASSPORT_CONFIG.country} passport photo requirements.
        </p>
      </div>

      {/* Photo preview */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-gray-900 mb-4">Final Photo:</h4>
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={imageData}
              alt="Passport photo"
              className="max-w-full h-auto rounded-lg shadow-lg"
              style={{ maxHeight: '500px' }}
            />
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {US_PASSPORT_CONFIG.outputWidth} × {US_PASSPORT_CONFIG.outputHeight}px
            </div>
          </div>
        </div>
      </div>

      {/* Photo specifications */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-blue-900 mb-3">Photo Specifications:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Dimensions:</span>
            <p className="text-blue-900">
              {US_PASSPORT_CONFIG.outputWidth} × {US_PASSPORT_CONFIG.outputHeight} pixels
            </p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Resolution:</span>
            <p className="text-blue-900">{US_PASSPORT_CONFIG.outputDPI} DPI</p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Size:</span>
            <p className="text-blue-900">2×2 inches</p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Format:</span>
            <p className="text-blue-900">JPEG</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={onStartOver}
          className="flex-1 px-8 py-5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
        >
          <RotateCcw className="w-6 h-6" />
          Start Over
        </button>
        <button
          onClick={onDownload}
          className="flex-1 px-8 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-xl"
        >
          <Download className="w-6 h-6" />
          Download Photo
        </button>
      </div>

      {/* Usage tips */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-2 text-sm">Usage Tips:</h5>
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• Print on high-quality photo paper</li>
          <li>• Ensure printer is set to actual size (no scaling)</li>
          <li>• Use matte or glossy finish as required by your application</li>
          <li>• Keep a digital copy for online applications</li>
        </ul>
      </div>
    </div>
  );
}
