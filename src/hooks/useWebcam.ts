/**
 * Custom hook for webcam access
 */

import { useEffect, useState, useRef, useCallback } from 'react';

interface UseWebcamOptions {
  width?: number;
  height?: number;
}

export function useWebcam({ width = 1280, height = 720 }: UseWebcamOptions = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startWebcam = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Requesting webcam access...');
      
      // List available devices for debugging
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      console.log('Available cameras:', videoDevices);
      
      if (videoDevices.length === 0) {
        throw new Error('No camera found. Please check if your camera is enabled in System Preferences → Privacy & Security → Camera');
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user',
        },
        audio: false,
      });

      console.log('Webcam access granted, stream:', mediaStream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        console.log('Video element srcObject set');
        
        // Set stream state immediately so UI updates
        setStream(mediaStream);
        
        // Ensure video plays when metadata is loaded
        const handleLoadedMetadata = async () => {
          try {
            await video.play();
            console.log('Video playing');
          } catch (playError) {
            console.error('Error playing video:', playError);
          }
        };
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        
        // Try to play immediately as well (in case metadata already loaded)
        if (video.readyState >= 1) {
          try {
            await video.play();
            console.log('Video playing (immediate)');
          } catch (playError) {
            console.error('Error playing video immediately:', playError);
          }
        }
      } else {
        // Set stream even if video ref isn't ready yet
        setStream(mediaStream);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to access webcam';
      setError(errorMessage);
      console.error('Webcam error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [width, height]);

  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    videoRef,
    stream,
    error,
    isLoading,
    startWebcam,
    stopWebcam,
  };
}
