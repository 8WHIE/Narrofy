import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Story, CommentItem } from '../types';
import {
  incrementStoryViews,
  incrementStoryShares,
  toggleLike,
  checkUserLiked,
  toggleBookmark,
  checkUserBookmarked,
  toggleFollow,
  checkUserFollowing,
  subscribeComments,
  addComment,
  deleteComment,
  saveReadingProgress,
  sendNotification,
  isStoryEditableByAuthor,
  submitReport,
} from '../firebase/firestore';
import {
  Heart,
  Bookmark,
  Share2,
  Eye,
  MessageCircle,
  Clock,
  Lock,
  Edit3,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  UserCheck,
  UserPlus,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface Props {
  story: Story;
  onBack: () => void;
  onEdit: (story: Story) => void;
  onAuthorClick?: (authorId: string) => void;
}

export const StoryDetail: React.FC<Props> = ({ story, onBack, onEdit, onAuthorClick }) => {
  const { user, profile, openAuthModal } = useAuth();

  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(story.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [followingAuthor, setFollowingAuthor] = useState(false);
  const [sharesCount, setSharesCount] = useState(story.sharesCount || 0);

  // Comments
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Copied toast
  const [copiedLink, setCopiedLink] = useState(false);

  const editability = isStoryEditableByAuthor(story, user?.uid);

  // Increment views on initial view
  useEffect(() => {
    incrementStoryViews(story.id);
  }, [story.id]);

  // Check initial like/bookmark/follow status
  useEffect(() => {
    if (user) {
      checkUserLiked(user.uid, story.id).then(setLiked);
      checkUserBookmarked(user.uid, story.id).then(setBookmarked);
      if (story.authorId !== user.uid) {
        checkUserFollowing(user.uid, story.authorId).then(setFollowingAuthor);
      }
    }
  }, [user, story.id, story.authorId]);

  // Subscribe to real-time comments
  useEffect(() => {
    const unsub = subscribeComments(
      story.id,
      (fetchedComments) => {
        setComments(fetchedComments);
      },
      (err) => console.warn('Comment subscription error:', err)
    );
    return () => unsub();
  }, [story.id]);

  // Save reading progress when changing chapters
  useEffect(() => {
    if (user && story.chapters && story.chapters.length > 0) {
      const progress = Math.round(((currentChapterIdx + 1) / story.chapters.length) * 100);
      saveReadingProgress(user.uid, story, currentChapterIdx + 1, progress);
    }
  }, [user, story, currentChapterIdx]);

  const handleToggleLike = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    const previous = liked;
    setLiked(!previous);
    setLikesCount((prev) => (previous ? Math.max(0, prev - 1) : prev + 1));

    try {
      const nowLiked = await toggleLike(user.uid, story.id, 'story');
      setLiked(nowLiked);
      if (nowLiked && story.authorId !== user.uid) {
        sendNotification({
          id: `notif_${Date.now()}`,
          recipientId: story.authorId,
          senderId: user.uid,
          senderName: profile?.displayName || user.displayName || 'A reader',
          senderPhoto: profile?.photoURL || user.photoURL || '',
          type: 'like',
          targetId: story.id,
          message: `liked your story "${story.title}"`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setLiked(previous);
      setLikesCount((prev) => (previous ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleToggleBookmark = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    const previous = bookmarked;
    setBookmarked(!previous);
    try {
      const isNow = await toggleBookmark(user.uid, story.id);
      setBookmarked(isNow);
    } catch {
      setBookmarked(previous);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    const previous = followingAuthor;
    setFollowingAuthor(!previous);
    try {
      const isNow = await toggleFollow(user.uid, story.authorId);
      setFollowingAuthor(isNow);
      if (isNow) {
        sendNotification({
          id: `notif_${Date.now()}`,
          recipientId: story.authorId,
          senderId: user.uid,
          senderName: profile?.displayName || user.displayName || 'A reader',
          senderPhoto: profile?.photoURL || user.photoURL || '',
          type: 'follow',
          targetId: user.uid,
          message: 'started following you',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      setFollowingAuthor(previous);
    }
  };

  const handleShare = async () => {
    setSharesCount((prev) => prev + 1);
    incrementStoryShares(story.id);

    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: story.description,
          url: window.location.href,
        });
        return;
      } catch {
        // user cancelled or share unsupported
      }
    }
    // Fallback: Copy link
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const newComment: CommentItem = {
        id: `com_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        targetId: story.id,
        targetType: 'story',
        parentId: replyingTo ? replyingTo.id : null,
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || 'Reader',
        authorPhoto: profile?.photoURL || user.photoURL || '',
        content: commentText.trim(),
        createdAt: new Date().toISOString(),
      };
      await addComment(newComment);
      setCommentText('');
      setReplyingTo(null);

      // Notify story author
      if (story.authorId !== user.uid) {
        sendNotification({
          id: `notif_${Date.now()}`,
          recipientId: story.authorId,
          senderId: user.uid,
          senderName: profile?.displayName || user.displayName || 'A reader',
          senderPhoto: profile?.photoURL || user.photoURL || '',
          type: 'comment',
          targetId: story.id,
          message: `commented on your story "${story.title}"`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      alert(err.message || 'Could not post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete your comment?')) return;
    try {
      await deleteComment(commentId, story.id, 'story');
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    try {
      await submitReport(user.uid, story.id, 'story', reportReason);
      setReportSuccess(true);
      setTimeout(() => {
        setReportModalOpen(false);
        setReportSuccess(false);
        setReportReason('');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Report could not be submitted');
    }
  };

  const chapters = story.chapters && story.chapters.length > 0 ? story.chapters : [
    { id: 'ch_1', title: 'Chapter 1', content: story.content || '', order: 1 }
  ];
  const activeChap = chapters[currentChapterIdx] || chapters[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Feed
        </button>

        <div className="flex items-center gap-2">
          {/* 24-Hour Rule Indicator & Action */}
          {user?.uid === story.authorId && (
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                  editability.editable
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {editability.editable ? <Clock size={12} /> : <Lock size={12} />}
                <span>{editability.editable ? 'Editable (24h Window)' : 'Immutable (24h Window Closed)'}</span>
              </span>

              {editability.editable && (
                <button
                  onClick={() => onEdit(story)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => setReportModalOpen(true)}
            className="p-2 text-zinc-400 hover:text-rose-500 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Report content"
          >
            <Flag size={16} />
          </button>
        </div>
      </div>

      {/* Story Cover Banner if available */}
      {story.coverImageUrl && (
        <div className="mb-8 rounded-3xl overflow-hidden shadow-lg max-h-96 w-full border border-zinc-200 dark:border-zinc-800 bg-zinc-950">
          <img
            src={story.coverImageUrl}
            alt={story.title}
            className="w-full h-full object-cover max-h-96"
          />
        </div>
      )}

      {/* Story Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400">
            {story.category}
          </span>
          <span className="text-xs text-zinc-400">•</span>
          <span className="text-xs text-zinc-500">
            Published {new Date(story.publishedAt || story.createdAt).toLocaleDateString()}
          </span>
          <span className="text-xs text-zinc-400">•</span>
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Eye size={13} /> {story.views || 0} views
          </span>
        </div>

        <h1 className="text-2xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight mb-3">
          {story.title}
        </h1>

        <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed italic border-l-2 border-amber-500 pl-4 py-1">
          {story.description}
        </p>

        {/* Author Bio Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800">
          <div
            onClick={() => onAuthorClick?.(story.authorId)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-base overflow-hidden ring-2 ring-transparent group-hover:ring-amber-500 transition-all">
              {story.authorPhoto ? (
                <img src={story.authorPhoto} alt={story.authorName} className="w-full h-full object-cover" />
              ) : (
                story.authorName?.charAt(0) || 'A'
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500 transition-colors">
                {story.authorName || 'Anonymous Author'}
              </p>
              <p className="text-xs text-zinc-500">
                @{story.authorUsername || 'author'}
              </p>
            </div>
          </div>

          {user?.uid !== story.authorId && (
            <button
              onClick={handleToggleFollow}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                followingAuthor
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                  : 'bg-amber-500 hover:bg-amber-600 text-black shadow'
              }`}
            >
              {followingAuthor ? (
                <>
                  <UserCheck size={14} />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>Follow Author</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Chapter Selection & Content Reader */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm mb-8">
        {chapters.length > 1 && (
          <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <button
              disabled={currentChapterIdx === 0}
              onClick={() => setCurrentChapterIdx((p) => Math.max(0, p - 1))}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Chapter {currentChapterIdx + 1} of {chapters.length}
            </span>

            <button
              disabled={currentChapterIdx >= chapters.length - 1}
              onClick={() => setCurrentChapterIdx((p) => Math.min(chapters.length - 1, p + 1))}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-6">
          {activeChap.title}
        </h2>

        {/* Chapter visual media if present */}
        {activeChap.mediaUrl && (
          <div className="mb-6 rounded-2xl overflow-hidden max-h-80 border border-zinc-200 dark:border-zinc-800 bg-black">
            {activeChap.mediaUrl.includes('.mp4') || activeChap.mediaType === 'video' ? (
              <video src={activeChap.mediaUrl} controls className="w-full max-h-80 object-contain" />
            ) : (
              <img src={activeChap.mediaUrl} alt={activeChap.title} className="w-full max-h-80 object-cover" />
            )}
          </div>
        )}

        {/* Story Prose Body */}
        <div className="prose dark:prose-invert max-w-none text-base md:text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 font-serif whitespace-pre-line">
          {activeChap.content}
        </div>

        {/* Tags footer */}
        {story.tags && story.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-2">
            {story.tags.map((t) => (
              <span
                key={t}
                className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 font-medium"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Floating / Sticky Interaction Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl mb-12">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleLike}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              liked
                ? 'bg-rose-500 text-white shadow-sm scale-105'
                : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={handleToggleBookmark}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              bookmarked
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
            <span>{bookmarked ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors"
          >
            <Share2 size={16} />
            <span>{copiedLink ? 'Link Copied!' : `Share (${sharesCount})`}</span>
          </button>
        </div>
      </div>

      {/* Real-time Comments & Discussion */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle size={20} className="text-amber-500" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            Discussion & Responses ({comments.length})
          </h3>
        </div>

        {/* Comment input */}
        <form onSubmit={handleAddComment} className="mb-8">
          {replyingTo && (
            <div className="mb-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-xs flex items-center justify-between text-amber-700 dark:text-amber-300">
              <span>Replying to @{replyingTo.authorName}</span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 font-bold text-xs overflow-hidden">
              {profile?.photoURL || user?.photoURL ? (
                <img
                  src={profile?.photoURL || user?.photoURL || ''}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  user
                    ? 'Leave a comment or share your thoughts on this chapter...'
                    : 'Sign in to join the conversation...'
                }
                disabled={!user}
                rows={3}
                className="w-full p-3 text-xs rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!user || submittingComment || !commentText.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Comment List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-xs text-zinc-400 py-6">
              Be the first to share your thoughts on this story!
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className={`p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 ${
                  c.parentId ? 'ml-8 border-l-2 border-l-amber-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold overflow-hidden">
                      {c.authorPhoto ? (
                        <img src={c.authorPhoto} alt={c.authorName} className="w-full h-full object-cover" />
                      ) : (
                        c.authorName.charAt(0)
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {c.authorName}
                      </span>
                      <span className="text-[10px] text-zinc-400 ml-2">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user && (
                      <button
                        onClick={() => setReplyingTo(c)}
                        className="text-[11px] text-amber-600 hover:underline dark:text-amber-400"
                      >
                        Reply
                      </button>
                    )}
                    {user?.uid === c.authorId && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="p-1 text-zinc-400 hover:text-rose-500"
                        title="Delete comment"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed pl-9">
                  {c.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
              <Flag size={18} className="text-rose-500" />
              Report Story to Narrofy Moderation
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Help keep Narrofy safe and supportive for all creators and readers.
            </p>

            {reportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs flex items-center gap-2">
                <Check size={16} />
                <span>Thank you. Your report has been submitted to moderators.</span>
              </div>
            ) : (
              <form onSubmit={handleReport} className="space-y-4">
                <textarea
                  required
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe the issue (e.g. copyright violation, spam, inappropriate content)..."
                  className="w-full p-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
