import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import {
  UserProfile,
  Story,
  FeedPost,
  CommentItem,
  Category,
  NotificationItem,
  ReadingHistoryItem,
} from '../types';
import { INITIAL_SHOWCASE_STORIES, INITIAL_SHOWCASE_POSTS } from '../data/initialStories';

export function isStoryEditableByAuthor(
  story: Story,
  currentUserId?: string | null
): { editable: boolean; reason?: string; timeRemainingMs?: number } {
  if (!currentUserId || story.authorId !== currentUserId) {
    return { editable: false, reason: 'Only the story creator can edit or delete this story.' };
  }

  if (story.status === 'draft') {
    return { editable: true };
  }

  if (!story.publishedAt) {
    return { editable: true };
  }

  const publishedTime = new Date(story.publishedAt).getTime();
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const elapsed = now - publishedTime;

  if (elapsed < TWENTY_FOUR_HOURS) {
    return {
      editable: true,
      timeRemainingMs: TWENTY_FOUR_HOURS - elapsed,
    };
  }

  return {
    editable: false,
    reason: 'The 24-hour editing window for this published story has closed. Published content becomes permanent after 24 hours.',
  };
}

// ========================
// USERS
// ========================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path, auth?.currentUser || undefined);
  }
}

export async function createUserProfile(uid: string, profile: UserProfile): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, profile);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path, auth?.currentUser || undefined);
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path, auth?.currentUser || undefined);
  }
}

// ========================
// STORIES
// ========================

export async function createStory(story: Omit<Story, 'createdAt' | 'updatedAt' | 'views' | 'likesCount' | 'commentsCount' | 'sharesCount'>): Promise<Story> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `stories/${story.id}`;
  try {
    const now = new Date().toISOString();
    const newStory: Story = {
      ...story,
      views: 0,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: story.status === 'published' ? (story.publishedAt || now) : undefined,
    };
    const docRef = doc(db, 'stories', story.id);
    await setDoc(docRef, newStory);
    return newStory;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path, auth?.currentUser || undefined);
  }
}

export async function updateStory(storyId: string, updates: Partial<Story>, currentStory?: Story): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `stories/${storyId}`;

  // Validate 24-hour rule if updating existing published story
  if (currentStory && currentStory.status === 'published') {
    const authCheck = isStoryEditableByAuthor(currentStory, auth?.currentUser?.uid);
    if (!authCheck.editable) {
      throw new Error(authCheck.reason || '24-hour editing window has expired');
    }
  }

  try {
    const docRef = doc(db, 'stories', storyId);
    const updatePayload: Record<string, unknown> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status === 'published' && (!currentStory || !currentStory.publishedAt)) {
      updatePayload.publishedAt = new Date().toISOString();
    }

    await updateDoc(docRef, updatePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path, auth?.currentUser || undefined);
  }
}

export async function deleteStory(storyId: string, currentStory?: Story): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `stories/${storyId}`;

  if (currentStory && currentStory.status === 'published') {
    const authCheck = isStoryEditableByAuthor(currentStory, auth?.currentUser?.uid);
    if (!authCheck.editable) {
      throw new Error(authCheck.reason || '24-hour deletion window has expired');
    }
  }

  try {
    const docRef = doc(db, 'stories', storyId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path, auth?.currentUser || undefined);
  }
}

export async function getStoryById(storyId: string): Promise<Story | null> {
  const showcase = INITIAL_SHOWCASE_STORIES.find((s) => s.id === storyId);
  if (!db) return showcase || null;
  const path = `stories/${storyId}`;
  try {
    const docRef = doc(db, 'stories', storyId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return showcase || null;
    }
    return snap.data() as Story;
  } catch (err) {
    console.warn(`Could not fetch story ${storyId} from Firestore, checking fallback:`, err);
    return showcase || null;
  }
}

export async function getStories(options?: {
  category?: string;
  authorId?: string;
  status?: 'published' | 'draft';
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
}): Promise<{ stories: Story[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
  if (!db) {
    let fallback = [...INITIAL_SHOWCASE_STORIES];
    if (options?.category && options.category !== 'all') {
      fallback = fallback.filter((s) => s.category === options.category);
    }
    if (options?.authorId) {
      fallback = fallback.filter((s) => s.authorId === options.authorId);
    }
    return { stories: fallback.slice(0, options?.pageSize || 12) };
  }

  const targetStatus = options?.status || 'published';

  try {
    const colRef = collection(db, 'stories');
    const constraints: any[] = [];
    constraints.push(where('status', '==', targetStatus));

    if (options?.category && options.category !== 'all') {
      constraints.push(where('category', '==', options.category));
    }

    if (options?.authorId) {
      constraints.push(where('authorId', '==', options.authorId));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(options?.pageSize || 12));

    if (options?.lastDoc) {
      constraints.push(startAfter(options.lastDoc));
    }

    const q = query(colRef, ...constraints);
    const snap = await getDocs(q);
    const stories = snap.docs.map((d) => d.data() as Story);
    const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

    // If Firestore has no stories yet, populate with showcase stories
    if (stories.length === 0 && !options?.authorId && targetStatus === 'published') {
      let fallback = [...INITIAL_SHOWCASE_STORIES];
      if (options?.category && options.category !== 'all') {
        fallback = fallback.filter((s) => s.category === options.category);
      }
      return { stories: fallback.slice(0, options?.pageSize || 12) };
    }

    return { stories, lastDoc: newLastDoc };
  } catch (err) {
    console.warn('getStories primary query failed or requires index, attempting simplified query:', err);
    try {
      // Fallback query without compound order by to avoid missing composite index crashes
      const simpleQuery = query(
        collection(db, 'stories'),
        where('status', '==', targetStatus),
        limit(options?.pageSize || 15)
      );
      const snap = await getDocs(simpleQuery);
      let stories = snap.docs.map((d) => d.data() as Story);
      if (options?.category && options.category !== 'all') {
        stories = stories.filter((s) => s.category === options.category);
      }
      if (options?.authorId) {
        stories = stories.filter((s) => s.authorId === options.authorId);
      }
      stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (stories.length === 0 && !options?.authorId && targetStatus === 'published') {
        let fallback = [...INITIAL_SHOWCASE_STORIES];
        if (options?.category && options.category !== 'all') {
          fallback = fallback.filter((s) => s.category === options.category);
        }
        return { stories: fallback.slice(0, options?.pageSize || 12) };
      }

      return { stories };
    } catch (fallbackErr) {
      console.warn('Fallback story query failed, returning showcase stories:', fallbackErr);
      let fallback = [...INITIAL_SHOWCASE_STORIES];
      if (options?.category && options.category !== 'all') {
        fallback = fallback.filter((s) => s.category === options.category);
      }
      return { stories: fallback.slice(0, options?.pageSize || 12) };
    }
  }
}

// Personalized feed based on user categories and followed creators
export async function getPersonalizedStories(
  userCategories: string[] = [],
  pageSize: number = 15
): Promise<Story[]> {
  if (!db) {
    if (userCategories.length > 0) {
      const filtered = INITIAL_SHOWCASE_STORIES.filter((s) => userCategories.includes(s.category));
      return filtered.length > 0 ? filtered : INITIAL_SHOWCASE_STORIES;
    }
    return INITIAL_SHOWCASE_STORIES;
  }

  try {
    const colRef = collection(db, 'stories');
    let snap;

    // To prevent composite index missing errors, query published stories and sort/filter
    try {
      const q = query(
        colRef,
        where('status', '==', 'published'),
        limit(pageSize * 2)
      );
      snap = await getDocs(q);
    } catch (qErr) {
      console.warn('Could not query published stories directly:', qErr);
      snap = null;
    }

    let stories: Story[] = snap ? snap.docs.map((d) => d.data() as Story) : [];

    if (stories.length > 0) {
      // Prioritize user categories if selected
      if (userCategories.length > 0) {
        stories.sort((a, b) => {
          const aMatch = userCategories.includes(a.category) ? 1 : 0;
          const bMatch = userCategories.includes(b.category) ? 1 : 0;
          if (bMatch !== aMatch) return bMatch - aMatch;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      } else {
        stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return stories.slice(0, pageSize);
    }

    // If Firestore collection has 0 stories, provide initial showcase stories
    if (userCategories.length > 0) {
      const filtered = INITIAL_SHOWCASE_STORIES.filter((s) => userCategories.includes(s.category));
      return filtered.length > 0 ? filtered : INITIAL_SHOWCASE_STORIES;
    }
    return INITIAL_SHOWCASE_STORIES;
  } catch (err) {
    console.warn('Personalized query falling back to showcase stories:', err);
    return INITIAL_SHOWCASE_STORIES;
  }
}

export async function incrementStoryViews(storyId: string): Promise<void> {
  if (!db) return;
  const path = `stories/${storyId}`;
  try {
    const docRef = doc(db, 'stories', storyId);
    await updateDoc(docRef, {
      views: increment(1),
    });
  } catch (err) {
    console.warn('Could not increment views:', err);
  }
}

export async function incrementStoryShares(storyId: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'stories', storyId);
    await updateDoc(docRef, {
      sharesCount: increment(1),
    });
  } catch (err) {
    console.warn('Could not increment shares:', err);
  }
}

// ========================
// POSTS (Short Feed Posts)
// ========================

export async function createPost(post: Omit<FeedPost, 'likesCount' | 'commentsCount'>): Promise<FeedPost> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `posts/${post.id}`;
  try {
    const newPost: FeedPost = {
      ...post,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    };
    const docRef = doc(db, 'posts', post.id);
    await setDoc(docRef, newPost);
    return newPost;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path, auth?.currentUser || undefined);
  }
}

export async function getPosts(limitCount: number = 20): Promise<FeedPost[]> {
  if (!db) return INITIAL_SHOWCASE_POSTS;
  const path = 'posts';
  try {
    const colRef = collection(db, 'posts');
    const q = query(colRef, limit(limitCount));
    const snap = await getDocs(q);
    const posts = snap.docs.map((d) => d.data() as FeedPost);
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return posts.length > 0 ? posts : INITIAL_SHOWCASE_POSTS;
  } catch (err) {
    console.warn('Could not query posts from Firestore, returning showcase posts:', err);
    return INITIAL_SHOWCASE_POSTS;
  }
}

// ========================
// COMMENTS & REPLIES
// ========================

export function subscribeComments(
  targetId: string,
  onComments: (comments: CommentItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = 'comments';
  const q = query(
    collection(db, 'comments'),
    where('targetId', '==', targetId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const comments = snapshot.docs.map((doc) => doc.data() as CommentItem);
      onComments(comments);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path, auth?.currentUser || undefined);
    }
  );
}

export async function addComment(comment: CommentItem): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `comments/${comment.id}`;
  try {
    await setDoc(doc(db, 'comments', comment.id), comment);
    // increment target commentsCount
    const targetColl = comment.targetType === 'story' ? 'stories' : 'posts';
    await updateDoc(doc(db, targetColl, comment.targetId), {
      commentsCount: increment(1),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path, auth?.currentUser || undefined);
  }
}

export async function deleteComment(commentId: string, targetId: string, targetType: 'story' | 'post'): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const path = `comments/${commentId}`;
  try {
    await deleteDoc(doc(db, 'comments', commentId));
    const targetColl = targetType === 'story' ? 'stories' : 'posts';
    await updateDoc(doc(db, targetColl, targetId), {
      commentsCount: increment(-1),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path, auth?.currentUser || undefined);
  }
}

// ========================
// LIKES
// ========================

export async function toggleLike(
  userId: string,
  targetId: string,
  targetType: 'story' | 'post'
): Promise<boolean> {
  if (!db) throw new Error('Firestore not initialized');
  const likeDocId = `${userId}_${targetId}`;
  const path = `likes/${likeDocId}`;
  const targetColl = targetType === 'story' ? 'stories' : 'posts';

  try {
    const likeRef = doc(db, 'likes', likeDocId);
    const snap = await getDoc(likeRef);
    if (snap.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(doc(db, targetColl, targetId), {
        likesCount: increment(-1),
      });
      return false; // unliked
    } else {
      await setDoc(likeRef, {
        id: likeDocId,
        userId,
        targetId,
        targetType,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, targetColl, targetId), {
        likesCount: increment(1),
      });
      return true; // liked
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path, auth?.currentUser || undefined);
  }
}

export async function checkUserLiked(userId: string, targetId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const snap = await getDoc(doc(db, 'likes', `${userId}_${targetId}`));
    return snap.exists();
  } catch {
    return false;
  }
}

// ========================
// BOOKMARKS
// ========================

export async function toggleBookmark(userId: string, storyId: string): Promise<boolean> {
  if (!db) throw new Error('Firestore not initialized');
  const bookmarkId = `${userId}_${storyId}`;
  const path = `bookmarks/${bookmarkId}`;
  try {
    const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
    const snap = await getDoc(bookmarkRef);
    if (snap.exists()) {
      await deleteDoc(bookmarkRef);
      return false;
    } else {
      await setDoc(bookmarkRef, {
        id: bookmarkId,
        userId,
        storyId,
        createdAt: new Date().toISOString(),
      });
      return true;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path, auth?.currentUser || undefined);
  }
}

export async function checkUserBookmarked(userId: string, storyId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const snap = await getDoc(doc(db, 'bookmarks', `${userId}_${storyId}`));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function getUserBookmarks(userId: string): Promise<string[]> {
  if (!db) return [];
  const path = 'bookmarks';
  try {
    const q = query(collection(db, 'bookmarks'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data().storyId as string);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path, auth?.currentUser || undefined);
  }
}

// ========================
// FOLLOWS
// ========================

export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  if (!db) throw new Error('Firestore not initialized');
  const followId = `${followerId}_${followingId}`;
  const path = `follows/${followId}`;
  try {
    const followRef = doc(db, 'follows', followId);
    const snap = await getDoc(followRef);
    if (snap.exists()) {
      await deleteDoc(followRef);
      await updateDoc(doc(db, 'users', followerId), { followingCount: increment(-1) });
      await updateDoc(doc(db, 'users', followingId), { followersCount: increment(-1) });
      return false;
    } else {
      await setDoc(followRef, {
        id: followId,
        followerId,
        followingId,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'users', followerId), { followingCount: increment(1) });
      await updateDoc(doc(db, 'users', followingId), { followersCount: increment(1) });
      return true;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path, auth?.currentUser || undefined);
  }
}

export async function checkUserFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const snap = await getDoc(doc(db, 'follows', `${followerId}_${followingId}`));
    return snap.exists();
  } catch {
    return false;
  }
}

// ========================
// NOTIFICATIONS
// ========================

export function subscribeNotifications(
  userId: string,
  onData: (notifications: NotificationItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = 'notifications';
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(30)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as NotificationItem);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path, auth?.currentUser || undefined);
    }
  );
}

export async function sendNotification(notif: NotificationItem): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, 'notifications', notif.id), notif);
  } catch (err) {
    console.warn('Failed to send notification:', err);
  }
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  } catch (err) {
    console.warn('Failed to mark notification as read:', err);
  }
}

// ========================
// READING HISTORY
// ========================

export async function saveReadingProgress(
  userId: string,
  story: Story,
  lastReadChapter: number,
  progressPercent: number
): Promise<void> {
  if (!db) return;
  const historyId = `${userId}_${story.id}`;
  const path = `readingHistory/${historyId}`;
  try {
    const record: ReadingHistoryItem = {
      id: historyId,
      userId,
      storyId: story.id,
      storyTitle: story.title,
      storyCover: story.coverImageUrl,
      category: story.category,
      lastReadChapter,
      progressPercent,
      lastReadAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'readingHistory', historyId), record);
  } catch (err) {
    console.warn('Could not save reading progress:', err);
  }
}

export async function getUserReadingHistory(userId: string): Promise<ReadingHistoryItem[]> {
  if (!db) return [];
  const path = 'readingHistory';
  try {
    const q = query(
      collection(db, 'readingHistory'),
      where('userId', '==', userId),
      orderBy('lastReadAt', 'desc'),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ReadingHistoryItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path, auth?.currentUser || undefined);
  }
}

// ========================
// CATEGORIES
// ========================

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'fantasy', name: 'Fantasy', slug: 'fantasy', description: 'Magic, mythical realms, and epic quests', icon: 'Sparkles', color: '#8b5cf6' },
  { id: 'sci-fi', name: 'Sci-Fi', slug: 'sci-fi', description: 'Space exploration, AI, and future technologies', icon: 'Rocket', color: '#06b6d4' },
  { id: 'mystery', name: 'Mystery & Thriller', slug: 'mystery', description: 'Suspense, plot twists, and crime investigations', icon: 'Compass', color: '#f59e0b' },
  { id: 'romance', name: 'Romance', slug: 'romance', description: 'Heartfelt journeys, relationships, and romance', icon: 'Heart', color: '#ec4899' },
  { id: 'horror', name: 'Horror', slug: 'horror', description: 'Chills, supernatural encounters, and psychological suspense', icon: 'Flame', color: '#ef4444' },
  { id: 'adventure', name: 'Adventure', slug: 'adventure', description: 'Action-packed travels and wilderness survival', icon: 'Mountain', color: '#10b981' },
  { id: 'drama', name: 'Drama & Life', slug: 'drama', description: 'Realistic drama, family sagas, and personal growth', icon: 'Feather', color: '#6366f1' },
  { id: 'poetry', name: 'Poetry & Micro', slug: 'poetry', description: 'Lyrical prose, haikus, and flash fiction', icon: 'BookOpen', color: '#14b8a6' },
];

export async function getCategories(): Promise<Category[]> {
  if (!db) return DEFAULT_CATEGORIES;
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (snap.empty) {
      return DEFAULT_CATEGORIES;
    }
    return snap.docs.map((d) => d.data() as Category);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

// ========================
// REPORTS
// ========================

export async function submitReport(
  reporterId: string,
  targetId: string,
  targetType: 'story' | 'post' | 'comment' | 'user',
  reason: string
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const reportId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `reports/${reportId}`;
  try {
    await setDoc(doc(db, 'reports', reportId), {
      id: reportId,
      reporterId,
      targetId,
      targetType,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path, auth?.currentUser || undefined);
  }
}
