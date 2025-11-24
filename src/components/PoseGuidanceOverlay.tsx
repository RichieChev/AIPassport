/**
 * Pose guidance overlay component
 */

import { PoseGuidance } from '../types';
import {
  getGuidanceColor,
  getGuidanceBackgroundColor,
} from '../utils/poseGuidance';

interface PoseGuidanceOverlayProps {
  guidance: PoseGuidance;
}

export function PoseGuidanceOverlay({ guidance }: PoseGuidanceOverlayProps) {
  const colorClass = getGuidanceColor(guidance.type);
  const bgColorClass = getGuidanceBackgroundColor(guidance.type);

  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div
        className={`
          ${bgColorClass} ${colorClass}
          px-8 py-4 rounded-2xl
          backdrop-blur-md
          font-bold text-xl
          shadow-2xl
          border-4 border-current
          animate-pulse
          min-w-[300px] text-center
        `}
        style={{
          backgroundColor: guidance.type === 'success' ? 'rgba(34, 197, 94, 0.9)' :
                          guidance.type === 'warning' ? 'rgba(234, 179, 8, 0.9)' :
                          guidance.type === 'error' ? 'rgba(239, 68, 68, 0.9)' :
                          'rgba(59, 130, 246, 0.9)',
          color: 'white'
        }}
      >
        {guidance.message}
      </div>
    </div>
  );
}
