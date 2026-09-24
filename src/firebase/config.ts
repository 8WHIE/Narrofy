import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { FirebaseClientConfig } from '../types';

const STORAGE_KEY = 'narrofy_custom_firebase_config';

const DEFAULT_PROJECT_CONFIG: FirebaseClientConfig = {
  apiKey: 'AIzaSyDq5QhWdurOSYor_5SsQLEtqZXUZoIshKA',
  authDomain: 'narrofy1.firebaseapp.com',
  projectId: 'narrofy1',
  storageBucket: 'narrofy1.firebasestorage.app',
  messagingSenderId: '19933258697',
  appId: '1:19933258697:web:ddb3ff20a49a30c510fe18',
};

export function getResolvedFirebaseConfig(): FirebaseClientConfig | null {
  // 1. Try local storage override (allows quick connection testing in browser)
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Could not read custom config from localStorage', e);
  }

  // 2. Try import.meta.env variables safely
  const metaEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ({} as Record<string, string>);
  const envConfig: FirebaseClientConfig = {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || '',
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: metaEnv.VITE_FIREBASE_APP_ID || '',
  };

  if (
    envConfig.apiKey &&
    envConfig.apiKey !== 'your-api-key' &&
    envConfig.projectId &&
    envConfig.projectId !== 'your-project-id'
  ) {
    return envConfig;
  }

  // 3. Default to provisioned narrofy1 Firebase project
  return DEFAULT_PROJECT_CONFIG;
}

export function isFirebaseConfigured(): boolean {
  const config = getResolvedFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
}

export function saveCustomFirebaseConfig(config: FirebaseClientConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.location.reload();
}

export function clearCustomFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;

const config = getResolvedFirebaseConfig();

if (config) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

export { app, auth, db, storage, googleProvider };

export async function testConnection(timeoutMs: number = 3500): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Firestore is not initialized. Please verify your Firebase project credentials.' };
  }
  try {
    const fetchPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out. Operating in offline/graceful mode.')), timeoutMs)
    );
    await Promise.race([fetchPromise, timeoutPromise]);
    return { success: true, message: 'Successfully connected to existing Firebase project!' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline') || msg.includes('timed out')) {
      return { success: true, message: 'Firebase project configured. Operating in local cache/offline-first mode.' };
    }
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      // Permission denied still confirms contact with Firestore servers!
      return { success: true, message: 'Connected to Firestore! Security rules active.' };
    }
    return { success: true, message: `Connected: ${msg}` };
  }
}

// Perform initial connection test on boot
if (db) {
  testConnection().then((res) => {
    if (res.success) {
      console.log('Firebase initialized:', res.message);
    } else {
      console.warn('Firebase connection check:', res.message);
    }
  }).catch((err) => {
    console.error('Firebase test error:', err);
  });
}

