export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  photoURL?: string;
  bio?: string;
  selectedCategories?: string[];
  followersCount: number;
  followingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoryChapter {
  id: string;
  title: string;
  content: string;
  order: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface StoryMedia {
  url: string;
  type: 'image' | 'video';
  caption?: string;
  thumbnailUrl?: string;
}

export interface Story {
  id: string;
  authorId: string;
  authorName?: string;
  authorPhoto?: string;
  authorUsername?: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  category: string;
  tags: string[];
  language: string;
  content: string;
  chapters: StoryChapter[];
  media: StoryMedia[];
  status: 'draft' | 'published';
  publishedAt?: string; // ISO string or timestamp
  createdAt: string;
  updatedAt: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName?: string;
  authorPhoto?: string;
  authorUsername?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: string;
  publishedAt?: string;
  likesCount: number;
  commentsCount: number;
}

export interface CommentItem {
  id: string;
  targetId: string;
  targetType: 'story' | 'post';
  parentId?: string | null;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  type: 'like' | 'comment' | 'follow' | 'story';
  targetId?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ReadingHistoryItem {
  id: string;
  userId: string;
  storyId: string;
  storyTitle?: string;
  storyCover?: string;
  category?: string;
  lastReadChapter: number;
  progressPercent: number;
  lastReadAt: string;
}

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}
