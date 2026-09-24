import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Story, FeedPost, ReadingHistoryItem } from '../types';
import {
  getStories,
  getPersonalizedStories,
  getPosts,
  createPost,
  DEFAULT_CATEGORIES,
  getUserBookmarks,
  toggleBookmark,
  getUserReadingHistory,
  isStoryEditableByAuthor,
} from '../firebase/firestore';
import { MediaUploader } from './MediaUploader';
import {
  Sparkles,
  BookOpen,
  TrendingUp,
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  Clock,
  Send,
  Plus,
  Compass,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface Props {
  onSelectStory: (story: Story) => void;
  onCreateStory: () => void;
}

export const PersonalizedFeed: React.FC<Props> = ({ onSelectStory, onCreateStory }) => {
  const { user, profile, openAuthModal, setOnboardingOpen } = useAuth();

  const [activeTab, setActiveTab] = useState<'for-you' | 'trending' | 'posts' | 'history'>('for-you');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stories, setStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // New Post Form State
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showPostUploader, setShowPostUploader] = useState(false);

  // Fetch bookmarks & reading history
  useEffect(() => {
    if (user) {
      getUserBookmarks(user.uid).then(setBookmarks).catch(console.warn);
      getUserReadingHistory(user.uid).then(setReadingHistory).catch(console.warn);
    }
  }, [user]);

  // Load feed data
  const loadFeed = async () => {
    setLoading(true);
    try {
      if (activeTab === 'for-you') {
        const userCats = profile?.selectedCategories || [];
        const result = await getPersonalizedStories(userCats, 15);
        setStories(result);
      } else if (activeTab === 'trending') {
        const result = await getStories({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          status: 'published',
          pageSize: 15,
        });
        setStories(result.stories);
      } else if (activeTab === 'posts') {
        const result = await getPosts(20);
        setPosts(result);
      } else if (activeTab === 'history') {
        if (user) {
          const hist = await getUserReadingHistory(user.uid);
          setReadingHistory(hist);
        }
      }
    } catch (err) {
      console.warn('Feed load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [activeTab, selectedCategory, profile?.selectedCategories]);

  const handleToggleBookmark = async (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    const isBookmarked = bookmarks.includes(storyId);
    setBookmarks(isBookmarked ? bookmarks.filter((id) => id !== storyId) : [...bookmarks, storyId]);
    await toggleBookmark(user.uid, storyId);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    if (!newPostContent.trim()) return;

    setIsPosting(true);
    try {
      const postId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const isVid = newPostMedia.includes('.mp4') || newPostMedia.includes('video');
      const created = await createPost({
        id: postId,
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || 'Creator',
        authorPhoto: profile?.photoURL || user.photoURL || '',
        authorUsername: profile?.username || 'storyteller',
        content: newPostContent.trim(),
        mediaUrl: newPostMedia || undefined,
        mediaType: newPostMedia ? (isVid ? 'video' : 'image') : undefined,
        createdAt: new Date().toISOString(),
      });
      setPosts([created, ...posts]);
      setNewPostContent('');
      setNewPostMedia('');
      setShowPostUploader(false);
    } catch (err: any) {
      alert(err.message || 'Failed to publish post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Welcome & Category Preferences Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/15 border border-amber-500/20 p-6 md:p-8 mb-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold mb-3">
            <Sparkles size={14} />
            <span>Personalized Stories Platform</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
            Stories that echo, narratives that move.
          </h1>
          <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-5">
            Discover original fiction, serialized epics, and creative worlds. Powered by Firebase with real-time community engagement.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onCreateStory}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center gap-2 shadow-md transition-transform hover:scale-105"
            >
              <Plus size={16} />
              <span>Write a Story</span>
            </button>

            {user && (
              <button
                onClick={() => setOnboardingOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white/80 dark:bg-zinc-800/80 hover:bg-white text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Compass size={15} className="text-amber-500" />
                <span>Change Preferences</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reading History Quick-Shelf if user has reading history */}
      {readingHistory.length > 0 && activeTab !== 'history' && (
        <div className="mb-8 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} className="text-amber-500" />
              Continue Reading
            </h2>
            <button
              onClick={() => setActiveTab('history')}
              className="text-[11px] text-amber-600 hover:underline dark:text-amber-400 font-medium"
            >
              View all ({readingHistory.length})
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {readingHistory.slice(0, 3).map((hist) => (
              <div
                key={hist.id}
                onClick={() => onSelectStory({ id: hist.storyId } as Story)}
                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 hover:border-amber-500 cursor-pointer transition-all flex items-center gap-3 group"
              >
                {hist.storyCover ? (
                  <img
                    src={hist.storyCover}
                    alt={hist.storyTitle || 'Cover'}
                    className="w-12 h-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-14 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-sm">
                    N
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-amber-500 transition-colors">
                    {hist.storyTitle || 'Story'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Chapter {hist.lastReadChapter || 1}
                  </p>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${hist.progressPercent || 25}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('for-you')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'for-you'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Sparkles size={14} />
            <span>For You</span>
          </button>

          <button
            onClick={() => setActiveTab('trending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'trending'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <TrendingUp size={14} />
            <span>Explore All</span>
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'posts'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <MessageCircle size={14} />
            <span>Community Feed</span>
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <BookOpen size={14} />
              <span>Library</span>
            </button>
          )}
        </div>

        <button
          onClick={loadFeed}
          className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          title="Refresh Feed"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Category Pills Filter when in Trending/Explore */}
      {activeTab === 'trending' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            All Genres
          </button>
          {DEFAULT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Community Posts Tab */}
      {activeTab === 'posts' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Create Post Box */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
            <form onSubmit={handleCreatePost}>
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                  {profile?.photoURL || user?.photoURL ? (
                    <img src={profile?.photoURL || user?.photoURL || ''} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder={
                      user
                        ? "Share a micro-story snippet, writing update, or ask readers a question..."
                        : 'Sign in to post updates...'
                    }
                    disabled={!user}
                    rows={3}
                    className="w-full p-3 text-xs rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>
              </div>

              {showPostUploader && (
                <div className="mb-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                  <MediaUploader
                    folder="post-images"
                    label="Attach Image or Video (Cloud Storage)"
                    initialUrl={newPostMedia}
                    onUploadSuccess={(url) => setNewPostMedia(url)}
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPostUploader(!showPostUploader)}
                  className="p-2 text-zinc-500 hover:text-amber-500 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 text-xs font-medium"
                >
                  <ImageIcon size={16} />
                  <span>Attach Media</span>
                </button>

                <button
                  type="submit"
                  disabled={!user || isPosting || !newPostContent.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>{isPosting ? 'Posting...' : 'Share Post'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold overflow-hidden">
                    {post.authorPhoto ? (
                      <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
                    ) : (
                      post.authorName?.charAt(0) || 'A'
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {post.authorName}
                    </h4>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                {post.content}
              </p>

              {post.mediaUrl && (
                <div className="rounded-2xl overflow-hidden max-h-96 border border-zinc-100 dark:border-zinc-800 bg-black">
                  {post.mediaType === 'video' || post.mediaUrl.includes('.mp4') ? (
                    <video src={post.mediaUrl} controls className="w-full max-h-96 object-contain" />
                  ) : (
                    <img src={post.mediaUrl} alt="Post attachment" className="w-full max-h-96 object-cover" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Library Tab (Reading History + Bookmarks) */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Your Library & Reading History
          </h2>
          {readingHistory.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
              <BookOpen size={36} className="mx-auto text-zinc-400 mb-3" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                No Reading History Yet
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Start reading any story on Narrofy and your progress will sync automatically!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {readingHistory.map((hist) => (
                <div
                  key={hist.id}
                  onClick={() => onSelectStory({ id: hist.storyId } as Story)}
                  className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-500 cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="flex gap-3 mb-3">
                    {hist.storyCover && (
                      <img src={hist.storyCover} alt="cover" className="w-16 h-20 rounded-xl object-cover" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                        {hist.storyTitle || 'Story'}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Chapter {hist.lastReadChapter || 1}
                      </p>
                      <span className="text-[10px] text-zinc-400">
                        Read on {new Date(hist.lastReadAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${hist.progressPercent || 25}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stories Grid for 'for-you' and 'trending' */}
      {(activeTab === 'for-you' || activeTab === 'trending') && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-80 rounded-3xl bg-zinc-100 dark:bg-zinc-850 animate-pulse border border-zinc-200 dark:border-zinc-800"
                />
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
              <BookOpen size={40} className="mx-auto text-amber-500 mb-3" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                No stories published in this section yet
              </h3>
              <p className="text-xs text-zinc-500 mt-1 mb-4">
                Be the pioneering author to publish a story in this genre!
              </p>
              <button
                onClick={onCreateStory}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow"
              >
                Write First Story
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => {
                const isBookmarked = bookmarks.includes(story.id);
                const editInfo = isStoryEditableByAuthor(story, user?.uid);

                return (
                  <div
                    key={story.id}
                    onClick={() => onSelectStory(story)}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all cursor-pointer flex flex-col group"
                  >
                    {/* Cover Thumbnail */}
                    <div className="relative h-48 w-full bg-zinc-950 overflow-hidden">
                      {story.coverImageUrl ? (
                        <img
                          src={story.coverImageUrl}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/20 via-zinc-900 to-indigo-900/30 p-4 text-center">
                          <BookOpen size={32} className="text-amber-500 mb-1" />
                          <span className="text-xs font-bold text-zinc-300">Narrofy Original</span>
                        </div>
                      )}

                      {/* Category Badge */}
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md text-amber-400 border border-amber-400/20">
                        {story.category}
                      </span>

                      {/* Bookmark Quick Toggle */}
                      <button
                        onClick={(e) => handleToggleBookmark(e, story.id)}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                          isBookmarked
                            ? 'bg-amber-500 text-black'
                            : 'bg-black/60 text-white hover:bg-black/80'
                        }`}
                        title="Bookmark story"
                      >
                        <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
                      </button>

                      {/* 24-Hour Edit Window Badge on Author's Cards */}
                      {user?.uid === story.authorId && (
                        <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/70 backdrop-blur-md text-zinc-200 flex items-center gap-1 border border-zinc-700">
                          <Clock size={10} className="text-amber-400" />
                          {editInfo.editable ? '24h Edit Window Active' : '24h Window Passed'}
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                          {story.title}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                          {story.description || story.content?.slice(0, 120)}
                        </p>
                      </div>

                      {/* Footer Info */}
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] overflow-hidden">
                            {story.authorPhoto ? (
                              <img src={story.authorPhoto} alt={story.authorName} className="w-full h-full object-cover" />
                            ) : (
                              story.authorName?.charAt(0) || 'A'
                            )}
                          </div>
                          <span className="truncate max-w-[90px] font-medium text-zinc-700 dark:text-zinc-300 text-[11px]">
                            {story.authorName || 'Author'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Eye size={12} /> {story.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart size={12} /> {story.likesCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle size={12} /> {story.commentsCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
