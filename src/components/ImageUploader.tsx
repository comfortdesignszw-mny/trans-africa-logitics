/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Plus, CheckCircle, Loader2 } from 'lucide-react';
import { compressImageFile } from '../utils/imageUtils';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  helperText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 6,
  label = 'Photos',
  helperText = 'Upload clear photos (JPG, PNG). Max 6 images.',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const remainingSlots = maxImages - images.length;
      const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);

      const processedImages: string[] = [];
      for (const file of filesToProcess) {
        if (file.type.startsWith('image/')) {
          const compressed = await compressImageFile(file, 1200, 1200, 0.82);
          processedImages.push(compressed);
        }
      }

      onChange([...images, ...processedImages]);
    } catch (err) {
      console.error('Error processing uploaded images:', err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>{label}</span>
          <span className="text-slate-400 font-normal">
            ({images.length}/{maxImages})
          </span>
        </label>
        {helperText && <span className="text-[11px] text-slate-400">{helperText}</span>}
      </div>

      {/* Grid of uploaded thumbnails + upload button */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
        {images.map((imgUrl, idx) => (
          <div
            key={idx}
            className="group relative aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xs"
          >
            <img
              src={imgUrl}
              alt={`Uploaded ${idx + 1}`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-500 transition cursor-pointer shadow-md"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 bg-slate-950/80 text-[9px] font-bold text-amber-400 px-1 rounded">
                Primary
              </span>
            )}
          </div>
        ))}

        {/* Upload Trigger Button */}
        {images.length < maxImages && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-400/70 bg-slate-900/50 hover:bg-slate-800/60 transition flex flex-col items-center justify-center p-2 text-center cursor-pointer group"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin mb-1" />
            ) : (
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition mb-1" />
            )}
            <span className="text-[10px] font-bold text-slate-300 group-hover:text-amber-300 transition">
              {isProcessing ? 'Processing' : 'Add Photo'}
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />
    </div>
  );
};
