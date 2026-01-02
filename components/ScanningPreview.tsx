
import React from 'react';

interface ScanningPreviewProps {
  imageUrl: string;
  isScanning: boolean;
}

export const ScanningPreview: React.FC<ScanningPreviewProps> = ({ imageUrl, isScanning }) => {
  return (
    <div className="relative w-full max-w-[280px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/20">
      <img 
        src={imageUrl} 
        alt="Original" 
        className="w-full h-full object-cover"
      />
      {isScanning && (
        <div className="absolute inset-0 bg-purple-500/10 pointer-events-none">
          <div className="w-full h-1 bg-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.8)] scan-line absolute top-0" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
        <span className="text-xs font-bold text-white/90 uppercase tracking-tighter">Base Image (9:16 Mode)</span>
      </div>
    </div>
  );
};
