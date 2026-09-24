import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTask,
} from 'firebase/storage';
import { storage, auth } from './config';

export type StorageFolder =
  | 'profile-images'
  | 'story-covers'
  | 'story-images'
  | 'story-videos'
  | 'post-images'
  | 'post-videos'
  | 'thumbnails';

export interface UploadProgressInfo {
  progress: number; // 0 to 100
  state: 'idle' | 'running' | 'paused' | 'success' | 'error';
  downloadUrl?: string;
  error?: string;
}

export function uploadMediaFile(
  file: File,
  folder: StorageFolder,
  onProgress?: (progress: number) => void
): { promise: Promise<string>; task?: UploadTask } {
  const uid = auth?.currentUser?.uid || 'anonymous';
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}_${cleanName}`;
  const fullPath = `${folder}/${uid}/${filename}`;

  // If storage is configured, use Firebase Cloud Storage
  if (storage) {
    const storageRef = ref(storage, fullPath);
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploaderUid: uid,
        originalName: file.name,
      },
    };

    const task = uploadBytesResumable(storageRef, file, metadata);

    const promise = new Promise<string>((resolve, reject) => {
      task.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(pct);
        },
        (error) => {
          console.error('Storage upload error:', error);
          let friendly = 'Failed to upload media to Firebase Cloud Storage.';
          if (error.code === 'storage/unauthorized') {
            friendly = 'Permission denied: Please ensure you are authenticated and your Storage rules allow this upload.';
          } else if (error.code === 'storage/canceled') {
            friendly = 'Upload was canceled.';
          } else if (error.code === 'storage/quota-exceeded') {
            friendly = 'Firebase Storage quota exceeded.';
          }
          reject(new Error(friendly));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            onProgress?.(100);
            resolve(downloadUrl);
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });

    return { promise, task };
  }

  // Fallback if Storage instance is absent (e.g. missing bucket in config)
  const promise = new Promise<string>((resolve, reject) => {
    onProgress?.(25);
    const reader = new FileReader();
    reader.onload = () => {
      onProgress?.(100);
      resolve(reader.result as string);
    };
    reader.onerror = () => reject(new Error('Failed to process file preview.'));
    reader.readAsDataURL(file);
  });

  return { promise };
}
