import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Story, StoryChapter } from '../types';
import {
  createStory,
  updateStory,
  deleteStory,
  DEFAULT_CATEGORIES,
  isStoryEditableByAuthor,
} from '../firebase/firestore';
import { MediaUploader } from './MediaUploader';
import {
  suggestTitles,
  generateStoryOutline,
  suggestTags,
  polishText,
  translateContent,
} from '../services/gemini';
import {
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Send,
  Clock,
  Lock,
  ArrowLeft,
  Wand2,
  Tag,
  Languages,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  initialStory?: Story | null;
  onBack: () => void;
  onSaved: (story: Story) => void;
}

export const StoryEditor: React.FC<Props> = ({ initialStory, onBack, onSaved }) => {
  const { user, profile, openAuthModal } = useAuth();

  const [title, setTitle] = useState(initialStory?.title || '');
  const [description, setDescription] = useState(initialStory?.description || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialStory?.coverImageUrl || '');
  const [category, setCategory] = useState(initialStory?.category || 'fantasy');
  const [language, setLanguage] = useState(initialStory?.language || 'English');
  const [tags, setTags] = useState<string[]>(initialStory?.tags || ['fiction']);
  const [tagInput, setTagInput] = useState('');
  const [chapters, setChapters] = useState<StoryChapter[]>(
    initialStory?.chapters && initialStory.chapters.length > 0
      ? initialStory.chapters
      : [
          {
            id: 'ch_1',
            title: 'Chapter 1: The Beginning',
            content: '',
            order: 1,
          },
        ]
  );
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Gemini states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Check 24-hour editability
  const editability = initialStory
    ? isStoryEditableByAuthor(initialStory, user?.uid)
    : { editable: true };

  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (initialStory?.status === 'published' && initialStory.publishedAt) {
      const updateTimer = () => {
        const publishedTime = new Date(initialStory.publishedAt!).getTime();
        const diff = 24 * 60 * 60 * 1000 - (Date.now() - publishedTime);
        if (diff <= 0) {
          setTimeRemaining('0h 0m (Expired)');
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${mins}m remaining`);
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [initialStory]);

  const addChapter = () => {
    const newIdx = chapters.length + 1;
    const newChap: StoryChapter = {
      id: `ch_${Date.now()}_${newIdx}`,
      title: `Chapter ${newIdx}: New Chapter`,
      content: '',
      order: newIdx,
    };
    setChapters([...chapters, newChap]);
    setActiveChapterIndex(chapters.length);
  };

  const removeChapter = (index: number) => {
    if (chapters.length <= 1) return;
    const updated = chapters.filter((_, i) => i !== index);
    setChapters(updated);
    setActiveChapterIndex(Math.max(0, index - 1));
  };

  const updateActiveChapter = (fields: Partial<StoryChapter>) => {
    const updated = [...chapters];
    updated[activeChapterIndex] = { ...updated[activeChapterIndex], ...fields };
    setChapters(updated);
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // AI Actions
  const handleGenerateOutline = async () => {
    if (!title) {
      alert('Please enter a story title first to generate an outline.');
      return;
    }
    setAiGenerating(true);
    try {
      const outline = await generateStoryOutline(title, category, description);
      const newChapters: StoryChapter[] = outline.map((line, idx) => ({
        id: `ch_${Date.now()}_${idx + 1}`,
        title: line,
        content: `Summary & outline thoughts for this chapter:\n${line}\n\nWrite your story prose here...`,
        order: idx + 1,
      }));
      setChapters(newChapters);
      setActiveChapterIndex(0);
      setStatusMessage('AI Outline applied! Feel free to edit.');
    } catch {
      setStatusMessage('Could not generate outline.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSuggestTitles = async () => {
    setAiGenerating(true);
    try {
      const results = await suggestTitles(description || title || 'An epic adventure', category);
      setTitleSuggestions(results);
    } catch {
      setTitleSuggestions(['The Forgotten Key', 'Echoes Across Stars', 'Heart of the Journey']);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSuggestTags = async () => {
    setAiGenerating(true);
    try {
      const suggested = await suggestTags(
        title,
        chapters.map((c) => c.content).join(' '),
        category
      );
      setTags(Array.from(new Set([...tags, ...suggested])));
      setStatusMessage('Tags suggested and added!');
    } finally {
      setAiGenerating(false);
    }
  };

  const handlePolishProse = async () => {
    const current = chapters[activeChapterIndex]?.content;
    if (!current) return;
    setAiGenerating(true);
    try {
      const polished = await polishText(current);
      updateActiveChapter({ content: polished });
      setStatusMessage('Chapter prose improved and polished!');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSave = async (targetStatus: 'draft' | 'published') => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (!title.trim()) {
      alert('Please provide a story title.');
      return;
    }

    if (!editability.editable) {
      alert(editability.reason || 'This story can no longer be edited (24h rule).');
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    const fullContent = chapters.map((c) => `## ${c.title}\n\n${c.content}`).join('\n\n---\n\n');

    try {
      if (initialStory) {
        await updateStory(
          initialStory.id,
          {
            title,
            description,
            coverImageUrl,
            category,
            language,
            tags,
            content: fullContent,
            chapters,
            status: targetStatus,
          },
          initialStory
        );
        setStatusMessage(
          targetStatus === 'published'
            ? 'Story successfully published! (Editable for next 24 hours)'
            : 'Draft saved successfully!'
        );
        onSaved({
          ...initialStory,
          title,
          description,
          coverImageUrl,
          category,
          language,
          tags,
          content: fullContent,
          chapters,
          status: targetStatus,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const storyId = `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const created = await createStory({
          id: storyId,
          authorId: user.uid,
          authorName: profile?.displayName || user.displayName || 'Anonymous',
          authorPhoto: profile?.photoURL || user.photoURL || '',
          authorUsername: profile?.username || 'storyteller',
          title,
          description,
          coverImageUrl,
          category,
          language,
          tags,
          content: fullContent,
          chapters,
          media: coverImageUrl ? [{ url: coverImageUrl, type: 'image' }] : [],
          status: targetStatus,
        });
        setStatusMessage(
          targetStatus === 'published'
            ? 'Story successfully published! (Editable for next 24 hours)'
            : 'Draft saved successfully!'
        );
        onSaved(created);
      }
    } catch (err: any) {
      console.error('Save story failed:', err);
      setStatusMessage(err.message || 'Failed to save story');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialStory) return;
    if (!confirm('Are you sure you want to delete this story? This cannot be undone.')) return;

    setSaving(true);
    try {
      await deleteStory(initialStory.id, initialStory);
      alert('Story deleted successfully.');
      onBack();
    } catch (err: any) {
      alert(err.message || 'Could not delete story');
    } finally {
      setSaving(false);
    }
  };

  const activeChap = chapters[activeChapterIndex] || chapters[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <BookOpen size={20} className="text-amber-500" />
              {initialStory ? 'Edit Story' : 'Create New Story'}
            </h1>
            <p className="text-xs text-zinc-500">
              {initialStory?.status === 'published' ? 'Published Story' : 'Draft Narrative'}
            </p>
          </div>
        </div>

        {/* 24-Hour Rule Indicator */}
        {initialStory?.status === 'published' && (
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
              editability.editable
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {editability.editable ? <Clock size={14} /> : <Lock size={14} />}
            <span>
              {editability.editable
                ? `24h Edit Window: ${timeRemaining}`
                : '24h Edit Window Closed (Locked)'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {initialStory && editability.editable && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={15} />
              Delete
            </button>
          )}

          <button
            onClick={() => handleSave('draft')}
            disabled={saving || !editability.editable}
            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Save size={15} />
            Save Draft
          </button>

          <button
            onClick={() => handleSave('published')}
            disabled={saving || !editability.editable}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
          >
            <Send size={15} />
            {saving ? 'Publishing...' : 'Publish Story'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
          <Sparkles size={16} className="shrink-0 text-amber-500" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata & Media */}
        <div className="space-y-6">
          {/* Cover Image Upload (Cloud Storage) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
            <MediaUploader
              folder="story-covers"
              label="Story Cover Image"
              accept="image/*"
              initialUrl={coverImageUrl}
              onUploadSuccess={(url) => setCoverImageUrl(url)}
              mediaType="image"
            />
          </div>

          {/* Metadata Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Category / Genre
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Language
              </label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="English"
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tags & Tropes
                </label>
                <button
                  type="button"
                  onClick={handleSuggestTags}
                  disabled={aiGenerating}
                  className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 hover:underline"
                >
                  <Sparkles size={12} />
                  AI Suggest
                </button>
              </div>
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag and press Enter"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 text-xs font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-400 hover:text-rose-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Optional AI Assistant Toolbar */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Wand2 size={14} className="text-amber-500" />
                  <span>Gemini Story Assistant</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">Optional</span>
              </button>

              {showAiPanel && (
                <div className="mt-3 space-y-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs">
                  <p className="text-[11px] text-zinc-500">
                    Assists with writing. AI content is always editable before publishing.
                  </p>
                  <button
                    type="button"
                    onClick={handleSuggestTitles}
                    disabled={aiGenerating}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-amber-500 text-left flex items-center justify-between"
                  >
                    <span>Suggest Catchy Titles</span>
                    <Sparkles size={12} className="text-amber-500" />
                  </button>

                  {titleSuggestions.length > 0 && (
                    <div className="space-y-1 p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                        Click a title to use:
                      </p>
                      {titleSuggestions.map((t, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTitle(t)}
                          className="w-full text-left p-1 text-[11px] hover:bg-amber-500/20 rounded font-medium text-zinc-800 dark:text-zinc-200 truncate"
                        >
                          "{t}"
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateOutline}
                    disabled={aiGenerating}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-amber-500 text-left flex items-center justify-between"
                  >
                    <span>Create 4-Chapter Outline</span>
                    <Sparkles size={12} className="text-amber-500" />
                  </button>

                  <button
                    type="button"
                    onClick={handlePolishProse}
                    disabled={aiGenerating}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-amber-500 text-left flex items-center justify-between"
                  >
                    <span>Polish Current Chapter Prose</span>
                    <Sparkles size={12} className="text-amber-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Title, Synopsis, Chapters and Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Story Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your story a memorable title..."
                className="w-full px-4 py-2.5 text-base font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Synopsis / Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="A compelling logline or premise to draw readers in..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>
          </div>

          {/* Chapter Tabs */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-[80%]">
                {chapters.map((chap, idx) => (
                  <button
                    key={chap.id}
                    type="button"
                    onClick={() => setActiveChapterIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                      activeChapterIndex === idx
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                    }`}
                  >
                    {chap.title.split(':')[0] || `Ch ${idx + 1}`}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={addChapter}
                className="px-3 py-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 text-xs font-medium flex items-center gap-1 text-zinc-700 dark:text-zinc-300 hover:text-amber-500"
              >
                <Plus size={14} />
                <span>Chapter</span>
              </button>
            </div>

            {/* Active Chapter Details */}
            {activeChap && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={activeChap.title}
                    onChange={(e) => updateActiveChapter({ title: e.target.value })}
                    placeholder="Chapter Title"
                    className="flex-1 px-3 py-2 text-sm font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {chapters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChapter(activeChapterIndex)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete chapter"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div>
                  <textarea
                    value={activeChap.content}
                    onChange={(e) => updateActiveChapter({ content: e.target.value })}
                    rows={16}
                    placeholder="Write your story content here. Let your imagination flow..."
                    className="w-full px-4 py-3 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-serif"
                  />
                  <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-400">
                    <span>
                      {activeChap.content.split(/\s+/).filter(Boolean).length} words
                    </span>
                    <span>
                      Total Chapters: {chapters.length}
                    </span>
                  </div>
                </div>

                {/* Chapter Media Uploader */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <MediaUploader
                    folder="story-images"
                    label="Chapter Visual or Scene Video (Optional)"
                    initialUrl={activeChap.mediaUrl}
                    onUploadSuccess={(url) => updateActiveChapter({ mediaUrl: url })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
