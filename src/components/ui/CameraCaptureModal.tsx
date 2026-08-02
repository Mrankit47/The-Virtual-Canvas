'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  X,
  Check,
  Sparkles,
  AlertCircle,
  Sliders,
  Image as ImageIcon,
  Zap,
  ZapOff,
  Timer,
  Grid,
  Crop,
  Download,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Layers,
} from 'lucide-react';

export interface FilterPreset {
  id: string;
  name: string;
  category: 'trending' | 'vivid' | 'vintage' | 'bw' | 'artistic';
  css: string;
  icon: string;
  badgeColor?: string;
}

export const FILTER_CATEGORIES = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'trending', label: 'Trending', icon: '🔥' },
  { id: 'vivid', label: 'Vivid', icon: '🎨' },
  { id: 'vintage', label: 'Vintage', icon: '📼' },
  { id: 'bw', label: 'B&W', icon: '🌗' },
  { id: 'artistic', label: 'Artistic', icon: '💎' },
];

export const CAMERA_FILTERS: FilterPreset[] = [
  { id: 'normal', name: 'Normal', category: 'trending', css: 'none', icon: '📷', badgeColor: 'bg-white/20' },
  { id: 'glow', name: 'Glow Up', category: 'trending', css: 'brightness(1.12) contrast(1.06) saturate(1.2)', icon: '✨', badgeColor: 'bg-amber-400' },
  { id: 'golden', name: 'Golden Hour', category: 'trending', css: 'sepia(0.35) contrast(1.12) saturate(1.35) hue-rotate(-12deg) brightness(1.05)', icon: '🌅', badgeColor: 'bg-orange-500' },
  { id: 'vivid', name: 'Vivid Pop', category: 'vivid', css: 'saturate(1.65) contrast(1.18) brightness(1.02)', icon: '🎨', badgeColor: 'bg-pink-500' },
  { id: 'cyber', name: 'Cool Cyber', category: 'vivid', css: 'hue-rotate(175deg) saturate(1.3) contrast(1.15)', icon: '🌆', badgeColor: 'bg-cyan-500' },
  { id: 'rosy', name: 'Rosy Glam', category: 'vivid', css: 'saturate(1.35) hue-rotate(325deg) brightness(1.08)', icon: '💖', badgeColor: 'bg-rose-400' },
  { id: 'emerald', name: 'Emerald Mood', category: 'vivid', css: 'hue-rotate(85deg) saturate(1.4) contrast(1.15)', icon: '🌿', badgeColor: 'bg-emerald-400' },
  { id: 'vintage', name: 'Retro 80s', category: 'vintage', css: 'sepia(0.45) contrast(1.15) saturate(0.9) hue-rotate(-15deg)', icon: '📼', badgeColor: 'bg-yellow-600' },
  { id: 'sepia', name: 'Warm Sepia', category: 'vintage', css: 'sepia(0.85) contrast(1.1) saturate(0.95)', icon: '📜', badgeColor: 'bg-amber-700' },
  { id: 'film', name: 'Film Grain', category: 'vintage', css: 'contrast(1.3) brightness(0.95) saturate(0.85) sepia(0.2)', icon: '🎞️', badgeColor: 'bg-stone-500' },
  { id: 'bw', name: 'B&W Classic', category: 'bw', css: 'grayscale(1) contrast(1.25)', icon: '🌗', badgeColor: 'bg-neutral-400' },
  { id: 'noir', name: 'Noir Dark', category: 'bw', css: 'grayscale(1) contrast(1.65) brightness(0.82)', icon: '🖤', badgeColor: 'bg-black' },
  { id: 'dramatic', name: 'Dramatic', category: 'artistic', css: 'contrast(1.5) brightness(0.88) saturate(1.4)', icon: '🔥', badgeColor: 'bg-purple-600' },
  { id: 'violet', name: 'Violet Dream', category: 'artistic', css: 'hue-rotate(250deg) saturate(1.35) contrast(1.12)', icon: '🔮', badgeColor: 'bg-indigo-500' },
  { id: 'hdr', name: 'HDR Ultra', category: 'artistic', css: 'contrast(1.35) saturate(1.45) brightness(1.05)', icon: '💎', badgeColor: 'bg-blue-600' },
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
  title = 'Snap Camera',
}) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset>(CAMERA_FILTERS[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);
  
  // Advanced Controls
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'screen'>('off');
  const [timerMode, setTimerMode] = useState<0 | 3 | 5 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '4:5' | '1:1'>('9:16');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isRotating, setIsRotating] = useState<boolean>(false);

  // Review step state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        throw new Error('Camera access is not supported by your browser or device.');
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
        setErrorMessage('Camera permission denied. Please enable camera access in your site settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device found on your device.');
      } else {
        setErrorMessage(err.message || 'Could not start camera. Please check camera permissions.');
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
    setCountdown(null);
    onClose();
  };

  const toggleFacingMode = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 500);
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const triggerCapture = () => {
    if (!videoRef.current) return;

    if (timerMode > 0 && countdown === null) {
      // Start countdown timer
      let count = timerMode;
      setCountdown(count);
      const timerInterval = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(timerInterval);
          setCountdown(null);
          executePhotoCapture();
        } else {
          setCountdown(count);
        }
      }, 1000);
    } else {
      executePhotoCapture();
    }
  };

  const executePhotoCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1080;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trigger visual screen flash
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 250);

    // Apply filter
    ctx.filter = selectedFilter.css !== 'none' ? selectedFilter.css : 'none';

    // Front camera mirror effect
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const filename = `snap_${selectedFilter.id}_${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

        setCapturedFile(file);
        setCapturedImage(dataUrl);
        stopStream();
      },
      'image/jpeg',
      0.95
    );
  };

  // Gallery File Picker Handler
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          setCapturedFile(file);
          stopStream();
        }
      };
      reader.readAsDataURL(file);
    }
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

  const cycleFlash = () => {
    if (flashMode === 'off') setFlashMode('on');
    else if (flashMode === 'on') setFlashMode('screen');
    else setFlashMode('off');
  };

  const cycleTimer = () => {
    if (timerMode === 0) setTimerMode(3);
    else if (timerMode === 3) setTimerMode(5);
    else if (timerMode === 5) setTimerMode(10);
    else setTimerMode(0);
  };

  const cycleAspectRatio = () => {
    if (aspectRatio === '9:16') setAspectRatio('4:5');
    else if (aspectRatio === '4:5') setAspectRatio('1:1');
    else setAspectRatio('9:16');
  };

  const filteredFilters = selectedCategory === 'all'
    ? CAMERA_FILTERS
    : CAMERA_FILTERS.filter((f) => f.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black text-white w-screen h-screen overflow-hidden flex flex-col font-sans select-none animate-in fade-in duration-200">
      
      {/* Screen Torch Flash Effect Overlay */}
      {flashMode === 'screen' && !capturedImage && (
        <div className="absolute inset-0 bg-amber-50/90 z-40 pointer-events-none transition-opacity duration-300" />
      )}

      {/* Screen Capture Flash Animation Overlay */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white z-[60] animate-out fade-out duration-300" />
      )}

      {/* Countdown Timer Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-[55] bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <span className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-ping">
            {countdown}
          </span>
        </div>
      )}

      {/* TOP FLOATING NAVIGATION BAR (Instagram / Snapchat Style) */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="p-3 bg-black/40 hover:bg-black/70 text-white rounded-full border border-white/20 backdrop-blur-md transition-all active:scale-90 shadow-lg"
          title="Close Camera"
        >
          <X size={22} />
        </button>

        {/* Title / Status */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 border border-white/15 rounded-full backdrop-blur-md text-xs font-bold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/90">{capturedImage ? 'Review Photo' : title}</span>
        </div>

        {/* Camera Quick Controls (Only in Live Mode) */}
        {!capturedImage ? (
          <div className="flex items-center gap-2">
            {/* Flash Mode Toggle */}
            <button
              type="button"
              onClick={cycleFlash}
              className={`p-2.5 rounded-full border backdrop-blur-md transition-all active:scale-90 ${
                flashMode !== 'off'
                  ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                  : 'bg-black/40 text-white border-white/20 hover:bg-black/70'
              }`}
              title={`Flash Mode: ${flashMode.toUpperCase()}`}
            >
              {flashMode === 'off' ? <ZapOff size={18} /> : <Zap size={18} />}
            </button>

            {/* Timer Toggle */}
            <button
              type="button"
              onClick={cycleTimer}
              className={`p-2.5 rounded-full border backdrop-blur-md transition-all relative active:scale-90 ${
                timerMode > 0
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-black/40 text-white border-white/20 hover:bg-black/70'
              }`}
              title={`Timer: ${timerMode === 0 ? 'Off' : `${timerMode}s`}`}
            >
              <Timer size={18} />
              {timerMode > 0 && (
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {timerMode}s
                </span>
              )}
            </button>

            {/* Grid Toggle */}
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2.5 rounded-full border backdrop-blur-md transition-all active:scale-90 ${
                showGrid
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-black/40 text-white border-white/20 hover:bg-black/70'
              }`}
              title="Toggle Grid Lines"
            >
              <Grid size={18} />
            </button>

            {/* Aspect Ratio Toggle */}
            <button
              type="button"
              onClick={cycleAspectRatio}
              className="px-3 py-1.5 bg-black/40 text-white border border-white/20 rounded-full backdrop-blur-md text-[11px] font-bold tracking-wider hover:bg-black/70 active:scale-90"
              title="Change Aspect Ratio"
            >
              {aspectRatio}
            </button>
          </div>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* CAMERA VIEWPORT CONTAINER (Full Screen Edge-to-Edge) */}
      <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
        
        {/* Rule of Thirds Grid Overlay */}
        {showGrid && !capturedImage && (
          <div className="absolute inset-0 z-30 pointer-events-none grid grid-cols-3 grid-rows-3">
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-white/20" />
            <div className="border-r border-white/20" />
            <div className="" />
          </div>
        )}

        {/* Aspect Ratio Crop Mask Container */}
        <div
          className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ${
            aspectRatio === '1:1'
              ? 'max-w-[100vw] max-h-[100vw] sm:max-w-[70vh] sm:max-h-[70vh] aspect-square rounded-3xl overflow-hidden my-auto border border-white/10'
              : aspectRatio === '4:5'
              ? 'max-w-[100vw] max-h-[125vw] sm:max-w-[60vh] sm:max-h-[75vh] aspect-[4/5] rounded-3xl overflow-hidden my-auto border border-white/10'
              : 'w-full h-full'
          }`}
        >
          {capturedImage ? (
            /* Review Screen Photo Preview */
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Captured Snap"
                style={{ filter: selectedFilter.css }}
                className="w-full h-full object-cover"
              />
              {/* Active Filter Overlay Tag */}
              <div className="absolute top-20 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-amber-300 border border-white/20 flex items-center gap-2 shadow-xl">
                <span>{selectedFilter.icon}</span>
                <span>Filter: {selectedFilter.name}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Camera Permission Denied or Error Message */}
              {hasPermission === false && (
                <div className="z-30 p-8 text-center max-w-md space-y-4 bg-neutral-900/90 rounded-3xl border border-white/10 backdrop-blur-xl">
                  <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-2 shadow-inner">
                    <AlertCircle size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-white">Camera Access Required</h4>
                  <p className="text-xs text-white/70 leading-relaxed">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-6 py-3.5 bg-white text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all shadow-xl active:scale-95"
                  >
                    Allow Camera & Try Again
                  </button>
                </div>
              )}

              {/* Live Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ filter: selectedFilter.css, transform: `scale(${zoomLevel}) ${facingMode === 'user' ? 'scaleX(-1)' : ''}` }}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  hasPermission === false ? 'hidden' : 'block'
                }`}
              />
            </>
          )}
        </div>

        {/* Hidden Canvas for High Quality Snapshot */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleGalleryUpload}
        />
      </div>

      {/* BOTTOM CONTROLS & FILTER DOCK (Snapchat / Instagram Layout) */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pb-6 pt-10 px-4 sm:px-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col items-center gap-4">

        {/* STRUCTURED FILTER DOCK & CAROUSEL */}
        {!capturedImage && hasPermission && (
          <div className="w-full max-w-xl space-y-3">
            
            {/* Filter Category Switcher Tabs */}
            <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
              {FILTER_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border backdrop-blur-md flex items-center gap-1.5 active:scale-95 ${
                      isActive
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-black/40 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Snapchat-Style Circular Filter Thumbnail Badges */}
            <div className="flex items-center gap-3 overflow-x-auto py-2 px-2 no-scrollbar scroll-smooth">
              {filteredFilters.map((filter) => {
                const isActive = selectedFilter.id === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSelectedFilter(filter)}
                    className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all group ${
                      isActive ? 'scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {/* Filter Icon Ring Badge */}
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg border-2 transition-all relative ${
                        isActive
                          ? 'border-amber-400 shadow-amber-400/40 ring-4 ring-amber-400/20 bg-gradient-to-br from-amber-400/30 to-orange-500/30'
                          : 'border-white/20 bg-white/10 hover:border-white/40'
                      }`}
                    >
                      <span>{filter.icon}</span>
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border border-black flex items-center justify-center text-[9px] text-black font-black">
                          ✓
                        </span>
                      )}
                    </div>
                    {/* Filter Name Label */}
                    <span
                      className={`text-[10px] font-bold tracking-wider max-w-[64px] truncate text-center ${
                        isActive ? 'text-amber-300 font-extrabold' : 'text-white/80'
                      }`}
                    >
                      {filter.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTION BUTTON DOCK (Instagram/Snapchat Iconic Shutter & Action Bar) */}
        <div className="w-full max-w-md flex items-center justify-between gap-6 pt-2">
          {capturedImage ? (
            /* Post-Capture Review Actions */
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-4 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/20 backdrop-blur-md flex items-center justify-center gap-2 active:scale-95 shadow-lg"
              >
                <RotateCcw size={16} /> Retake
              </button>
              <button
                type="button"
                onClick={handleConfirmUse}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95"
              >
                <Check size={18} /> Use Photo
              </button>
            </>
          ) : (
            /* Live Camera Capture Actions */
            <>
              {/* Gallery Pick Button (Left) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-black/50 hover:bg-black/80 text-white/90 rounded-full border border-white/20 backdrop-blur-md transition-all active:scale-90 shadow-lg flex flex-col items-center justify-center"
                title="Upload Photo from Gallery"
              >
                <ImageIcon size={22} />
              </button>

              {/* Iconic Dual-Ring Snapchat / IG Camera Shutter Button (Center) */}
              <button
                type="button"
                onClick={triggerCapture}
                disabled={!hasPermission || isStarting}
                className="group relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all duration-150 active:scale-90 hover:scale-105 disabled:opacity-40 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                title="Take Photo"
              >
                {/* Inner Solid Shutter Circle */}
                <div className="w-16 h-16 rounded-full bg-white group-hover:bg-neutral-100 transition-all duration-150 shadow-inner group-active:scale-90 flex items-center justify-center">
                  <Camera size={26} className="text-black/80 group-hover:scale-110 transition-transform" />
                </div>
              </button>

              {/* Flip Camera Button (Right) */}
              <button
                type="button"
                onClick={toggleFacingMode}
                disabled={!hasPermission || isStarting}
                className={`p-4 bg-black/50 hover:bg-black/80 text-white/90 rounded-full border border-white/20 backdrop-blur-md transition-all active:scale-90 shadow-lg flex flex-col items-center justify-center ${
                  isRotating ? 'rotate-[360deg] duration-500' : ''
                }`}
                title="Flip Camera (Front/Back)"
              >
                <RefreshCw size={22} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
