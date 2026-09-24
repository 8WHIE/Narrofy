import React, { useState, useRef } from 'react';
import { uploadMediaFile, StorageFolder } from '../firebase/storage';
import { Upload, X, CheckCircle2, AlertCircle, RefreshCw, Film, Image as ImageIcon } from 'lucide-react';

interface Props {
  folder: StorageFolder;
  accept?: string;
  maxSizeBytes?: number; // default 50MB
  label?: string;
  initialUrl?: string;
  onUploadSuccess: (url: string) => void;
  mediaType?: 'image' | 'video' | 'any';
}

export const MediaUploader: React.FC<Props> = ({
  folder,
  accept = 'image/*,video/*',
  maxSizeBytes = 50 * 1024 * 1024,
  label = 'Upload Media',
  initialUrl = '',
  onUploadSuccess,
  mediaType = 'any',
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(Boolean(initialUrl));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startUpload = async (file: File) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    setIsSuccess(false);

    try {
      const { promise } = uploadMediaFile(file, folder, (pct) => {
        setProgress(pct);
      });
      const downloadUrl = await promise;
      setPreviewUrl(downloadUrl);
      setIsSuccess(true);
      onUploadSuccess(downloadUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeBytes) {
      setError(`File size exceeds limit (${Math.round(maxSizeBytes / (1024 * 1024))}MB)`);
      return;
    }

    setSelectedFile(file);
    // Instant local object URL for preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    startUpload(file);
  };

  const handleRetry = () => {
    if (selectedFile) {
      startUpload(selectedFile);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    setSelectedFile(null);
    setIsSuccess(false);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadSuccess('');
  };

  const isVideo = selectedFile?.type?.startsWith('video') || previewUrl?.includes('.mp4') || previewUrl?.includes('video');

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[11px] font-normal text-zinc-400">
          Cloud Storage ({folder})
        </span>
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-950/40 group">
          {isVideo ? (
            <video
              src={previewUrl}
              controls
              className="w-full max-h-60 object-contain rounded-xl bg-black"
            />
          ) : (
            <img
              src={previewUrl}
              alt="Media preview"
              className="w-full max-h-60 object-cover rounded-xl"
            />
          )}

          {/* Overlay Controls */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
            {isSuccess && (
              <span className="bg-emerald-600/90 text-white text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-sm">
                <CheckCircle2 size={12} />
                Uploaded
              </span>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors backdrop-blur-sm"
              title="Remove media"
            >
              <X size={14} />
            </button>
          </div>

          {/* Progress Bar overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
              <div className="w-full max-w-xs bg-zinc-800 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="bg-amber-500 h-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-300 font-medium">
                Uploading to Cloud Storage... {progress}%
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl p-6 transition-all flex flex-col items-center justify-center text-center bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-amber-500/5 group"
        >
          <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-amber-500 group-hover:scale-110 transition-all mb-2">
            {mediaType === 'video' ? <Film size={22} /> : <Upload size={22} />}
          </div>
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Click to upload {mediaType === 'video' ? 'video' : mediaType === 'image' ? 'image' : 'image or video'}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            PNG, JPG, WebP, MP4 up to {Math.round(maxSizeBytes / (1024 * 1024))}MB
          </p>
        </div>
      )}

      {/* Error state & Retry */}
      {error && (
        <div className="mt-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-[11px] font-semibold flex items-center gap-1"
          >
            <RefreshCw size={11} />
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
