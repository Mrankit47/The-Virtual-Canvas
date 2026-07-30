'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, Sparkles, AlertCircle, Sliders, Image as ImageIcon } from 'lucide-react';

export interface FilterPreset {
  id: string;
  name: string;
  css: string;
}

export const CAMERA_FILTERS: FilterPreset[] = [
  { id: 'normal', name: 'Normal', css: 'none' },
  { id: 'vivid', name: 'Vivid', css: 'saturate(1.45) contrast(1.15) brightness(1.02)' },
  { id: 'warm', name: 'Warm Gold', css: 'sepia(0.35) contrast(1.08) saturate(1.25) hue-rotate(-10deg)' },
  { id: 'cool', name: 'Cool Cyber', css: 'hue-rotate(180deg) saturate(1.2) contrast(1.1)' },
  { id: 'bw', name: 'B&W Classic', css: 'grayscale(1) contrast(1.2) sepia(0.08)' },
  { id: 'noir', name: 'Noir Dark', css: 'grayscale(1) contrast(1.5) brightness(0.85)' },
  { id: 'sepia', name: 'Retro Sepia', css: 'sepia(0.85) contrast(1.1) saturate(0.9)' },
  { id: 'dramatic', name: 'Dramatic', css: 'contrast(1.4) brightness(0.9) saturate(1.3)' },
  { id: 'rosy', name: 'Rosy Glam', css: 'saturate(1.25) hue-rotate(320deg) brightness(1.05)' },
  { id: 'emerald', name: 'Emerald Art', css: 'hue-rotate(90deg) saturate(1.3) contrast(1.1)' },
];

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Camera Photo Capture',
}) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset>(CAMERA_FILTERS[0]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);

  // Review step state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stop camera tracks
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopStream();
    setIsStarting(true);
    setErrorMessage('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or connection.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(newStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera Access Error:', err);
      setHasPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser site settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device found on your device.');
      } else {
        setErrorMessage(err.message || 'Could not start camera. Please check your camera permissions.');
      }
    } finally {
      setIsStarting(false);
    }
  }, [facingMode, stopStream]);

  // Initialize camera stream when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, capturedImage]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    stopStream();
    setCapturedImage(null);
    setCapturedFile(null);
    setSelectedFilter(CAMERA_FILTERS[0]);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flash animation trigger
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    // Apply active CSS filter to canvas context before drawing
    ctx.filter = selectedFilter.css !== 'none' ? selectedFilter.css : 'none';

    // If front camera, mirror image for natural snapshot feel
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const filename = `camera_${selectedFilter.id}_${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        setCapturedFile(file);
        setCapturedImage(dataUrl);
        stopStream();
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
  };

  const handleConfirmUse = () => {
    if (capturedFile) {
      onCapture(capturedFile);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-ink/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-neutral-900 text-white w-full max-w-2xl rounded-[36px] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 flex items-center justify-between border-b border-white/10 bg-neutral-900/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 text-white rounded-2xl border border-white/10 backdrop-blur-md">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black font-serif text-white tracking-tight">{title}</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">
                {capturedImage ? 'Review Captured Photo' : 'Live Preview & Filters'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Viewport Content */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[320px] sm:min-h-[420px]">
          {/* Visual Flash effect */}
          {flashEffect && <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-300" />}

          {/* Captured Review Screen */}
          {capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={capturedImage}
                alt="Captured Snapshot"
                className="max-h-[55vh] w-auto object-contain rounded-2xl border border-white/10 shadow-2xl"
              />
              <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400 border border-white/10 flex items-center gap-1.5">
                <Sparkles size={12} /> Filter: {selectedFilter.name}
              </div>
            </div>
          ) : (
            <>
              {/* Error or Denied Permission State */}
              {hasPermission === false && (
                <div className="p-8 text-center max-w-md space-y-4">
                  <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-2">
                    <AlertCircle size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Camera Permission Needed</h4>
                  <p className="text-xs text-white/60 leading-relaxed">{errorMessage}</p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all shadow-xl"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Camera Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ filter: selectedFilter.css }}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                } ${hasPermission === false ? 'hidden' : 'block'}`}
              />

              {/* Camera Flip Button Overlay */}
              {hasPermission && (
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/80 text-white backdrop-blur-md rounded-full border border-white/15 transition-all shadow-lg hover:scale-105 active:scale-95"
                  title="Switch Camera (Front / Back)"
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </>
          )}

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Filter Carousel & Action Bar */}
        <div className="p-5 sm:p-6 bg-neutral-900 border-t border-white/10 space-y-5">
          {!capturedImage && hasPermission && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-white/40">
                <span className="flex items-center gap-1.5"><Sliders size={12} /> Color Filters</span>
                <span className="text-white/80">{selectedFilter.name}</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {CAMERA_FILTERS.map((filter) => {
                  const isActive = selectedFilter.id === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setSelectedFilter(filter)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-white text-black border-white shadow-lg shadow-white/10 scale-105'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {filter.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-1">
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
                >
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUse}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Check size={18} /> Use Photo
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!hasPermission || isStarting}
                  className="flex-1 py-4 bg-white hover:bg-neutral-200 text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-40 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Camera size={18} /> Capture Photo
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
