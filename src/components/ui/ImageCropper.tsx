'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, ZoomIn, Scissors, Loader2 } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[40px] overflow-y-auto shadow-2xl border border-ink/5 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 sm:p-8 flex items-center justify-between border-b border-ink/5 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-ink text-white rounded-2xl shadow-xl shadow-ink/10">
              <Scissors size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black font-serif text-ink tracking-tight">Refine Your Profile</h2>
              <p className="text-[10px] text-ink/30 uppercase tracking-[0.2em] font-black">Adjust focus & framing</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="p-3 hover:bg-ink/5 rounded-2xl transition-colors text-ink/40 hover:text-ink active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative flex-1 bg-gray-100 min-h-[300px] sm:min-h-[400px]">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1 / 1}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
            classes={{
              containerClassName: "rounded-b-none",
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-5 sm:p-6 space-y-6 bg-white border-t border-ink/5">
          {/* Zoom Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-ink/40">Zoom Intensity</span>
              <span className="text-[10px] font-mono text-ink/20 font-black">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-4 group">
              <ZoomIn size={18} className="text-ink/20 group-hover:text-ink transition-colors" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => onZoomChange(Number(e.target.value))}
                className="flex-1 accent-ink h-1.5 bg-ink/5 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 px-6 border border-ink/10 text-ink/60 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-ink/5 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="flex-1 py-3.5 px-6 bg-ink text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-ink/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                'Save Profile Photo'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
