import React, { useState } from 'react';
import {
  getResolvedFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  testConnection,
} from '../firebase/config';
import { FirebaseClientConfig } from '../types';
import { ShieldCheck, Database, Key, CheckCircle2, AlertTriangle, RefreshCw, X, Server } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const currentConfig = getResolvedFirebaseConfig();

  const [form, setForm] = useState<FirebaseClientConfig>({
    apiKey: currentConfig?.apiKey || '',
    authDomain: currentConfig?.authDomain || '',
    projectId: currentConfig?.projectId || '',
    storageBucket: currentConfig?.storageBucket || '',
    messagingSenderId: currentConfig?.messagingSenderId || '',
    appId: currentConfig?.appId || '',
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection();
      setTestResult(res);
    } catch (e) {
      setTestResult({
        success: false,
        message: e instanceof Error ? e.message : 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.apiKey || !form.projectId) {
      alert('Please fill in at least API Key and Project ID.');
      return;
    }
    saveCustomFirebaseConfig(form);
  };

  const handleReset = () => {
    if (confirm('Reset to default environment variables?')) {
      clearCustomFirebaseConfig();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Connect Existing Firebase Project
            </h2>
            <p className="text-xs text-zinc-500">
              Narrofy connects directly to your existing Firebase Project without creating another project.
            </p>
          </div>
        </div>

        <div className="mb-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3.5 border border-zinc-200/80 dark:border-zinc-700/80 text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
            <Server size={14} className="text-indigo-500" />
            <span>Active Project Status:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono text-[11px]">
              {currentConfig?.projectId || 'Not Configured (Using Defaults / Offline)'}
            </span>
          </div>
          <p>
            You can define these in <code className="text-indigo-600 dark:text-indigo-400 font-mono">.env</code> or test directly below. Narrofy stores files in Cloud Storage and records in Cloud Firestore.
          </p>
        </div>

        {testResult && (
          <div
            className={`mb-4 p-3 rounded-xl flex items-start gap-2.5 text-xs ${
              testResult.success
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-semibold">{testResult.success ? 'Connection Successful' : 'Connection Warning'}</p>
              <p className="mt-0.5 opacity-90">{testResult.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                API Key (VITE_FIREBASE_API_KEY)
              </label>
              <div className="relative">
                <Key size={14} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  required
                  placeholder="AIzaSy..."
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Project ID (VITE_FIREBASE_PROJECT_ID)
              </label>
              <input
                type="text"
                required
                placeholder="my-narrofy-app"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Auth Domain (VITE_FIREBASE_AUTH_DOMAIN)
              </label>
              <input
                type="text"
                placeholder="my-narrofy-app.firebaseapp.com"
                value={form.authDomain}
                onChange={(e) => setForm({ ...form, authDomain: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Storage Bucket (VITE_FIREBASE_STORAGE_BUCKET)
              </label>
              <input
                type="text"
                placeholder="my-narrofy-app.appspot.com"
                value={form.storageBucket}
                onChange={(e) => setForm({ ...form, storageBucket: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Messaging Sender ID
              </label>
              <input
                type="text"
                placeholder="1029384756..."
                value={form.messagingSenderId}
                onChange={(e) => setForm({ ...form, messagingSenderId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                App ID (VITE_FIREBASE_APP_ID)
              </label>
              <input
                type="text"
                placeholder="1:1029384756:web:abcd1234"
                value={form.appId}
                onChange={(e) => setForm({ ...form, appId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-3 py-2 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-black flex items-center gap-1.5 shadow"
              >
                <ShieldCheck size={14} />
                Save & Connect
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
