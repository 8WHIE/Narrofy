import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  NextOrObserver,
} from 'firebase/auth';
import { auth, googleProvider } from './config';
import { createUserProfile, getUserProfile } from './firestore';
import { UserProfile } from '../types';

export function onAuthChange(callback: NextOrObserver<User>) {
  if (!auth) {
    if (typeof callback === 'function') callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function loginWithGoogle(): Promise<{ user: User; profile: UserProfile | null }> {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth is not configured. Please supply your Firebase credentials.');
  }

  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Check if profile exists, if not create one
  let profile = await getUserProfile(user.uid);
  if (!profile) {
    const defaultUsername = (user.email?.split('@')[0] || `user_${user.uid.slice(0, 6)}`)
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .slice(0, 30);
    
    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || defaultUsername,
      username: defaultUsername,
      email: user.email || '',
      photoURL: user.photoURL || '',
      bio: 'Storyteller & reader on Narrofy',
      selectedCategories: [],
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await createUserProfile(user.uid, newProfile);
    profile = newProfile;
  }

  return { user, profile };
}

export async function loginWithEmail(email: string, pass: string): Promise<{ user: User; profile: UserProfile | null }> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const profile = await getUserProfile(result.user.uid);
  return { user: result.user, profile };
}

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string,
  username: string
): Promise<{ user: User; profile: UserProfile }> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }

  const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  const user = result.user;

  await updateProfile(user, {
    displayName,
  });

  const newProfile: UserProfile = {
    uid: user.uid,
    displayName,
    username: cleanUsername,
    email: user.email || email,
    photoURL: '',
    bio: 'Storyteller & reader on Narrofy',
    selectedCategories: [],
    followersCount: 0,
    followingCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await createUserProfile(user.uid, newProfile);
  return { user, profile: newProfile };
}

export async function resetPassword(email: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}
