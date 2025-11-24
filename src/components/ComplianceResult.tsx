/**
 * Compliance result display component
 */

import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { ComplianceResult as ComplianceResultType } from '../types';
import { US_PASSPORT_CONFIG } from '../utils/complianceRules';

interface ComplianceResultProps {
  result: ComplianceResultType;
  onRetake: () => void;
  onAccept: () => void;
}

export function ComplianceResult({
  result,
  onRetake,
  onAccept,
}: ComplianceResultProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Overall result */}
      <div
        className={`
          p-6 rounded-lg mb-6
          ${
            result.passed
              ? 'bg-green-50 border-2 border-green-500'
              : 'bg-red-50 border-2 border-red-500'
          }
        `}
      >
        <div className="flex items-center gap-4">
          {result.passed ? (
            <CheckCircle2 className="w-12 h-12 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-12 h-12 text-red-600 flex-shrink-0" />
          )}
          <div className="flex-1">
            <h3
              className={`text-xl font-bold mb-1 ${
                result.passed ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {result.passed
                ? '✓ Photo Compliant'
                : '✗ Photo Not Compliant'}
            </h3>
            <p
              className={`text-sm ${
                result.passed ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {result.passed
                ? `Meets all ${US_PASSPORT_CONFIG.country} passport requirements`
                : `Compliance score: ${result.score}%`}
            </p>
          </div>
        </div>
      </div>

      {/* Issues list */}
      {!result.passed && result.reasons.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">
                Issues Found:
              </h4>
              <ul className="space-y-2">
                {result.reasons.map((reason, index) => (
                  <li key={index} className="text-sm text-yellow-800">
                    • {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Requirements info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">
          {US_PASSPORT_CONFIG.country} Passport Photo Requirements:
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>
              Head height must be between {US_PASSPORT_CONFIG.headHeightMinPercent}
              % and {US_PASSPORT_CONFIG.headHeightMaxPercent}% of image height
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>
              Eyes must be positioned between{' '}
              {US_PASSPORT_CONFIG.eyeHeightMinPercent}% and{' '}
              {US_PASSPORT_CONFIG.eyeHeightMaxPercent}% from bottom
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Face must be horizontally centered</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Eyes must be level (no head tilt)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Background must be uniform white</span>
          </li>
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={onRetake}
          className="flex-1 px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 active:scale-95"
        >
          ← Retake Photo
        </button>
        <button
          onClick={onAccept}
          className={`flex-1 px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 active:scale-95 ${
            result.passed
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-yellow-600 hover:bg-yellow-700 text-white'
          }`}
        >
          {result.passed ? '✓ Use This Photo →' : '⚠️ Use Anyway →'}
        </button>
      </div>
      
      {!result.passed && (
        <p className="text-xs text-yellow-700 text-center mt-3">
          ⚠️ Warning: This photo may not be accepted for official use
        </p>
      )}
    </div>
  );
}
