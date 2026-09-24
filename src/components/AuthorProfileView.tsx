import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, Story } from '../types';
import {
  getUserProfile,
  getStories,
  checkUserFollowing,
  toggleFollow,
  sendNotification,
} from '../firebase/firestore';
import { ArrowLeft, UserCheck, UserPlus, BookOpen, Heart, Eye } from 'lucide-react';

interface Props {
  authorId: string;
  onBack: () => void;
  onSelectStory: (story: Story) => void;
}

export const AuthorProfileView: React.FC<Props> = ({ authorId, onBack, onSelectStory }) => {
  const { user, profile: currentUserProfile, openAuthModal } = useAuth();
  const [author, setAuthor] = useState<UserProfile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthorData = async () => {
      setLoading(true);
      try {
        const p = await getUserProfile(authorId);
        setAuthor(p);
        const storyRes = await getStories({
          authorId,
          status: 'published',
          pageSize: 20,
        });
        setStories(storyRes.stories);

        if (user && user.uid !== authorId) {
          const isF = await checkUserFollowing(user.uid, authorId);
          setFollowing(isF);
        }
      } catch (e) {
        console.warn('Error loading author profile:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthorData();
  }, [authorId, user]);

  const handleFollowToggle = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    const prev = following;
    setFollowing(!prev);
    try {
      const isNow = await toggleFollow(user.uid, authorId);
      setFollowing(isNow);
      if (isNow && author) {
        sendNotification({
          id: `notif_${Date.now()}`,
          recipientId: authorId,
          senderId: user.uid,
          senderName: currentUserProfile?.displayName || user.displayName || 'A reader',
          senderPhoto: currentUserProfile?.photoURL || user.photoURL || '',
          type: 'follow',
          targetId: user.uid,
          message: 'started following your profile',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      setFollowing(prev);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-zinc-500">Loading author profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Author Header Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <div className="w-24 h-24 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-3xl overflow-hidden ring-4 ring-amber-500/10 shrink-0">
          {author?.photoURL ? (
            <img src={author.photoURL} alt={author.displayName} className="w-full h-full object-cover" />
          ) : (
            author?.displayName?.charAt(0) || 'A'
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 mb-2">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-zinc-900 dark:text-white">
                {author?.displayName || 'Storyteller'}
              </h1>
              <p className="text-xs text-zinc-400 font-mono">
                @{author?.username || 'creator'}
              </p>
            </div>

            {user?.uid !== authorId && (
              <button
                onClick={handleFollowToggle}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  following
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                    : 'bg-amber-500 hover:bg-amber-600 text-black shadow'
                }`}
              >
                {following ? (
                  <>
                    <UserCheck size={14} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4 max-w-xl">
            {author?.bio || 'Author on Narrofy sharing imaginative worlds and stories.'}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-5 text-xs text-zinc-500">
            <div>
              <strong className="font-bold text-zinc-900 dark:text-white">
                {author?.followersCount || 0}
              </strong>{' '}
              Followers
            </div>
            <div>
              <strong className="font-bold text-zinc-900 dark:text-white">
                {author?.followingCount || 0}
              </strong>{' '}
              Following
            </div>
            <div>
              <strong className="font-bold text-zinc-900 dark:text-white">
                {stories.length}
              </strong>{' '}
              Stories Published
            </div>
          </div>
        </div>
      </div>

      {/* Stories list */}
      <div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-amber-500" />
          Published Stories
        </h2>

        {stories.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
            This author has not published any stories yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                onClick={() => onSelectStory(story)}
                className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-500 cursor-pointer transition-all flex gap-3 group"
              >
                {story.coverImageUrl && (
                  <img
                    src={story.coverImageUrl}
                    alt={story.title}
                    className="w-20 h-24 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {story.category}
                    </span>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500 transition-colors line-clamp-1">
                      {story.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1">
                      {story.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Eye size={11} /> {story.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={11} /> {story.likesCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
