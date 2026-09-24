import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
} from '../firebase/auth';
import { Mail, Lock, User as UserIcon, X, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, refreshProfile } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Sync mode with context mode changes
  React.useEffect(() => {
    setMode(authModalMode);
    setError(null);
    setResetSuccess(false);
  }, [authModalMode, authModalOpen]);

  if (!authModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      await refreshProfile();
      closeAuthModal();
    } catch (err: any) {
      console.error('Google login error:', err);
      let msg = 'Google sign in failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign in popup was closed before completing.';
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'Sign in popup was blocked by browser. Please allow popups for this site.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
        await refreshProfile();
        closeAuthModal();
      } else if (mode === 'signup') {
        if (!displayName.trim() || !username.trim()) {
          setError('Please fill in your name and username.');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, displayName, username);
        await refreshProfile();
        closeAuthModal();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setResetSuccess(true);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = 'Authentication failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mb-3 font-bold text-2xl tracking-tighter">
            N
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {mode === 'signin' && 'Welcome back to Narrofy'}
            {mode === 'signup' && 'Create your Narrofy account'}
            {mode === 'forgot' && 'Reset your password'}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {mode === 'signin' && 'Sign in to access your feed, library, and stories'}
            {mode === 'signup' && 'Join authors and readers in social storytelling'}
            {mode === 'forgot' && "Enter your email and we'll send you a recovery link"}
          </p>
        </div>

        {/* Google Sign In button */}
        {mode !== 'forgot' && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-100 font-medium text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400">or with email</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>Password reset link has been sent to your email.</span>
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon size={14} className="absolute left-3 top-3 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 text-xs font-mono">@</span>
                  <input
                    type="text"
                    required
                    placeholder="janedoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-amber-600 hover:underline dark:text-amber-400"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-3 text-zinc-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-all shadow flex items-center justify-center gap-2"
          >
            <span>
              {loading
                ? 'Processing...'
                : mode === 'signin'
                ? 'Sign In to Narrofy'
                : mode === 'signup'
                ? 'Create Account'
                : 'Send Reset Link'}
            </span>
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-zinc-500">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
