import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_CATEGORIES } from '../firebase/firestore';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { onboardingOpen, setOnboardingOpen, profile, updateUserCategories } = useAuth();
  const [selected, setSelected] = useState<string[]>(profile?.selectedCategories || []);
  const [saving, setSaving] = useState(false);

  if (!onboardingOpen) return null;

  const toggleCategory = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((c) => c !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserCategories(selected);
      setOnboardingOpen(false);
    } catch (err) {
      console.error('Failed to save categories:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Personalize Your Narrofy Feed
            </h2>
            <p className="text-xs text-zinc-500">
              Select 2 or more genres you love to tailor your stories feed
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 my-6">
          {DEFAULT_CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {cat.name}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 line-clamp-1">{cat.description}</p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 font-medium">
            {selected.length} genre{selected.length === 1 ? '' : 's'} selected
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-all shadow flex items-center gap-2"
          >
            <span>{saving ? 'Saving...' : 'Start Exploring'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
