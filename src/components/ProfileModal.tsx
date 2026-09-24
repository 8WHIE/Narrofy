import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, DEFAULT_CATEGORIES } from '../firebase/firestore';
import { MediaUploader } from './MediaUploader';
import { User, X, Check, Camera, ShieldCheck, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || user?.photoURL || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    profile?.selectedCategories || []
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await updateUserProfile(user.uid, {
        displayName,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio,
        photoURL,
        selectedCategories,
      });
      await refreshProfile();
      setStatus('Profile permanently saved!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setStatus(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
            <User size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Edit Narrofy Profile
            </h2>
            <p className="text-xs text-zinc-500">
              Profile updates are permanent and not restricted to 24 hours
            </p>
          </div>
        </div>

        {status && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-500" />
            <span>{status}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Profile Picture Upload to Cloud Storage */}
          <div>
            <MediaUploader
              folder="profile-images"
              label="Profile Picture (Cloud Storage)"
              accept="image/*"
              initialUrl={photoURL}
              onUploadSuccess={(url) => setPhotoURL(url)}
              mediaType="image"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-400 text-xs">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell readers about yourself, favorite books, or what you write..."
              className="w-full p-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Story Preferences */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              <span>Preferred Genres (Feed Personalization)</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
              {DEFAULT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 text-zinc-900 dark:text-white ring-1 ring-amber-500'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {isSelected && <Check size={13} className="text-amber-600 dark:text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black rounded-xl shadow transition-all"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
