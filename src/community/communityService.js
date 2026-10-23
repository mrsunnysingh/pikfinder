// src/community/communityService.js
// Central service for PikCircle creative community.
// Integrates with Firebase Firestore and Firebase Storage with automatic offline/localStorage fallback.

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
  serverTimestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../firebase';

export const COMMUNITY_CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: 'SquaresFour' },
  { id: 'ui-ux', label: 'UI/UX Design', icon: 'DeviceMobile' },
  { id: 'graphic-design', label: 'Graphic Design', icon: 'PaintBrush' },
  { id: 'web-design', label: 'Web Design', icon: 'Desktop' },
  { id: 'branding', label: 'Branding & Logos', icon: 'Sparkle' },
  { id: 'illustration', label: 'Illustration', icon: 'Palette' },
  { id: 'photography', label: 'Photography', icon: 'Camera' },
  { id: 'motion-design', label: 'Motion Design', icon: 'Play' },
  { id: 'ai-art', label: 'AI Art & Tools', icon: 'Cpu' },
  { id: 'resources', label: 'Resources & Inspiration', icon: 'FolderSimple' },
  { id: 'questions', label: 'Questions & Feedback', icon: 'ChatCircleDots' },
  { id: 'careers', label: 'Freelancing & Careers', icon: 'Buildings' },
];

export const POST_TYPES = [
  { id: 'showcase', label: 'Showcase', badge: 'Showcase', color: '#8b5cf6', desc: 'Share your finished design work or WIP' },
  { id: 'feedback', label: 'Feedback Request', badge: 'Critique', color: '#ec4899', desc: 'Ask for specific constructive feedback' },
  { id: 'question', label: 'Question', badge: 'Question', color: '#f59e0b', desc: 'Ask a question or seek advice' },
  { id: 'discussion', label: 'Discussion', badge: 'Discussion', color: '#3b82f6', desc: 'Start a design discussion or debate' },
  { id: 'resource', label: 'Resource', badge: 'Resource', color: '#10b981', desc: 'Share freebies, tools, fonts, or templates' },
];

const LOCAL_POSTS_KEY = 'pikcircle_posts_cache_v1';
const LOCAL_COMMENTS_KEY = 'pikcircle_comments_cache_v1';
const LOCAL_LIKES_KEY = 'pikcircle_likes_cache_v1';
const LOCAL_SAVES_KEY = 'pikcircle_saves_cache_v1';
const LOCAL_FOLLOWS_KEY = 'pikcircle_follows_cache_v1';
const LOCAL_NOTIFS_KEY = 'pikcircle_notifs_cache_v1';
const LOCAL_PROFILES_KEY = 'pikcircle_profiles_cache_v1';

// Initial realistic seed dataset for instant, high-quality community preview
const SEED_PROFILES = [
  {
    uid: 'user_elena_ux',
    username: 'elenarostova',
    displayName: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    bio: 'Product Designer @ FinTech. Obsessed with micro-interactions, design systems & accessible typography.',
    disciplines: ['UI/UX Design', 'Design Systems', 'Web Design'],
    skills: ['Figma', 'Prototyping', 'User Research', 'Tokens', 'Design Systems'],
    portfolioUrl: 'https://elenarostova.design',
    socialLinks: { twitter: 'https://x.com', dribbble: 'https://dribbble.com', github: 'https://github.com' },
    followersCount: 1420,
    followingCount: 310,
    postsCount: 18,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 180,
  },
  {
    uid: 'user_marcus_brand',
    username: 'marcus_vance',
    displayName: 'Marcus Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&auto=format&fit=crop&q=80',
    bio: 'Independent Brand Strategist & Identity Designer. Helping modern tech startups find their visual voice.',
    disciplines: ['Branding & Logos', 'Graphic Design', 'Typography'],
    skills: ['Brand Identity', 'Logo Design', 'Illustrator', 'Editorial', 'Packaging'],
    portfolioUrl: 'https://marcusvance.com',
    socialLinks: { twitter: 'https://x.com', instagram: 'https://instagram.com' },
    followersCount: 3890,
    followingCount: 184,
    postsCount: 34,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 320,
  },
  {
    uid: 'user_akira_3d',
    username: 'akira_takahashi',
    displayName: 'Akira Takahashi',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
    bio: '3D Artist & Motion Designer experimenting with ray marching, Spline 3D, and glassmorphic spatial interfaces.',
    disciplines: ['Motion Design', 'AI Art & Tools', 'UI/UX Design'],
    skills: ['Blender', 'Cinema 4D', 'Spline', 'Three.js', 'After Effects'],
    portfolioUrl: 'https://akira.art',
    socialLinks: { dribbble: 'https://dribbble.com', twitter: 'https://x.com' },
    followersCount: 5210,
    followingCount: 412,
    postsCount: 42,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 400,
  },
  {
    uid: 'user_sophia_ai',
    username: 'sophia_chen',
    displayName: 'Sophia Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    bio: 'Digital Illustrator & Generative AI Researcher exploring human-machine co-creation in commercial design.',
    disciplines: ['Illustration', 'AI Art & Tools', 'Graphic Design'],
    skills: ['Procreate', 'Midjourney', 'Photoshop', 'Character Design', 'Prompt Craft'],
    portfolioUrl: 'https://sophiachen.art',
    socialLinks: { instagram: 'https://instagram.com', twitter: 'https://x.com' },
    followersCount: 2980,
    followingCount: 220,
    postsCount: 27,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 150,
  }
];

const SEED_POSTS = [
  {
    postId: 'post_fintech_dash_2026',
    authorId: 'user_elena_ux',
    authorName: 'Elena Rostova',
    authorUsername: 'elenarostova',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    type: 'showcase',
    title: 'AuraPay — Clean, High-Contrast Global Banking Web App UI',
    content: 'Just wrapped up the dashboard redesign for AuraPay! We focused on dark mode contrast ratios, progressive disclosure for multi-currency transactions, and zero-latency analytics cards. Would love your thoughts on the typography hierarchy and balance between violet accents and data cards!',
    category: 'ui-ux',
    tags: ['Figma', 'FinTech', 'Dashboard', 'UI/UX', 'DarkTheme'],
    imageAttachments: [
      {
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
        alt: 'Financial Analytics Dashboard UI Concept with graphs and cards',
        aspectRatio: '16/10'
      },
      {
        url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
        alt: 'Mobile responsive views for AuraPay banking',
        aspectRatio: '16/10'
      }
    ],
    resourceUrl: 'https://dribbble.com',
    likeCount: 148,
    commentCount: 24,
    saveCount: 89,
    viewsCount: 1940,
    createdAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
    updatedAt: Date.now() - 1000 * 60 * 45,
    status: 'approved'
  },
  {
    postId: 'post_critique_monogram',
    authorId: 'user_marcus_brand',
    authorName: 'Marcus Vance',
    authorUsername: 'marcus_vance',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    type: 'feedback',
    title: 'Feedback Request: Which logo direction conveys "Precision Robotics" better?',
    content: 'We are designing the brand identity for a precision surgical robotics company called "Kortex". Option A uses a continuous ribbon knot symbolizing harmony, while Option B uses geometric hexagonal lattice lines. Which one feels more enterprise-grade and trustworthy?',
    category: 'branding',
    tags: ['LogoDesign', 'Critique', 'Branding', 'Identity', 'Robotics'],
    imageAttachments: [
      {
        url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1200&auto=format&fit=crop&q=80',
        alt: 'Minimal geometric brand monogram concept directions',
        aspectRatio: '16/10'
      }
    ],
    resourceUrl: '',
    likeCount: 92,
    commentCount: 41,
    saveCount: 35,
    viewsCount: 1420,
    createdAt: Date.now() - 1000 * 60 * 180, // 3 hours ago
    updatedAt: Date.now() - 1000 * 60 * 180,
    status: 'approved'
  },
  {
    postId: 'post_glassmorphism_3d',
    authorId: 'user_akira_3d',
    authorName: 'Akira Takahashi',
    authorUsername: 'akira_takahashi',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    type: 'showcase',
    title: 'Spatial Audio Interface in 3D Glass & Chrome (Spline + Figma)',
    content: 'Exploring how sound frequencies and spatial haptics can be represented as physical crystalline sound waves in visionOS / browser 3D. Created in Spline and integrated with PikFinder Creator Studio vectors.',
    category: 'motion-design',
    tags: ['Spline3D', 'SpatialUI', 'Glassmorphism', 'VisionOS', '3DDesign'],
    imageAttachments: [
      {
        url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
        alt: 'Abstract fluid 3D chrome shapes and glass refraction',
        aspectRatio: '16/10'
      }
    ],
    resourceUrl: 'https://spline.design',
    likeCount: 312,
    commentCount: 53,
    saveCount: 210,
    viewsCount: 3820,
    createdAt: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
    status: 'approved'
  },
  {
    postId: 'post_color_tokens_discussion',
    authorId: 'user_elena_ux',
    authorName: 'Elena Rostova',
    authorUsername: 'elenarostova',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    type: 'discussion',
    title: 'How are you organizing color tokens across multi-brand design systems in 2026?',
    content: 'Curious how other product teams handle tier-2 semantic tokens vs component-level overrides when supporting both light/dark themes and white-label client palettes. Do you keep semantic aliases flat or nest by interactive state? Share your team conventions!',
    category: 'ui-ux',
    tags: ['DesignTokens', 'DesignSystems', 'FigmaVariables', 'CSSArchitecture'],
    imageAttachments: [],
    resourceUrl: '',
    likeCount: 67,
    commentCount: 38,
    saveCount: 54,
    viewsCount: 980,
    createdAt: Date.now() - 1000 * 60 * 60 * 20, // 20 hours ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 20,
    status: 'approved'
  },
  {
    postId: 'post_free_vector_resource',
    authorId: 'user_sophia_ai',
    authorName: 'Sophia Chen',
    authorUsername: 'sophia_chen',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    type: 'resource',
    title: 'Free Pack: 40+ Hand-Crafted Isometric UI Badges & Tech Glyphs (SVG + PNG)',
    content: 'Hey designers! Packaged up 40+ clean vector isometric tech glyphs (servers, neural nodes, databases, cloud clusters) for your landing pages and pitch decks. Free for commercial and personal use with zero attribution required!',
    category: 'resources',
    tags: ['Freebie', 'VectorIcons', 'SVG', 'Illustration', 'OpenSource'],
    imageAttachments: [
      {
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        alt: 'Vibrant geometric digital artwork and abstract gradients',
        aspectRatio: '16/10'
      }
    ],
    resourceUrl: 'https://github.com/mrsunnysingh/pikfinder',
    likeCount: 420,
    commentCount: 67,
    saveCount: 380,
    viewsCount: 5120,
    createdAt: Date.now() - 1000 * 60 * 60 * 36, // 1.5 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 36,
    status: 'approved'
  },
  {
    postId: 'post_freelance_pricing_question',
    authorId: 'user_marcus_brand',
    authorName: 'Marcus Vance',
    authorUsername: 'marcus_vance',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    type: 'question',
    title: 'What is your strategy for value-based pricing when pitching brand guidelines to series-A startups?',
    content: 'Do you charge a flat package for identity + guidelines, or do you tier it based on brand touchpoints (deck, website, marketing collateral, stationery)? Looking for insights from experienced agency and independent brand designers.',
    category: 'careers',
    tags: ['Freelance', 'Pricing', 'ClientManagement', 'AgencyLife'],
    imageAttachments: [],
    resourceUrl: '',
    likeCount: 88,
    commentCount: 0, // Unanswered test case!
    saveCount: 42,
    viewsCount: 740,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    updatedAt: Date.now() - 1000 * 60 * 60 * 48,
    status: 'approved'
  }
];

const SEED_COMMENTS = [
  {
    commentId: 'c_1',
    postId: 'post_fintech_dash_2026',
    authorId: 'user_akira_3d',
    authorName: 'Akira Takahashi',
    authorUsername: 'akira_takahashi',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    content: 'The subtle violet neon bloom around the active transaction card is fantastic! Did you test this with WCAG AAA dark mode tools?',
    likeCount: 14,
    parentCommentId: null,
    createdAt: Date.now() - 1000 * 60 * 35,
  },
  {
    commentId: 'c_2',
    postId: 'post_fintech_dash_2026',
    authorId: 'user_elena_ux',
    authorName: 'Elena Rostova',
    authorUsername: 'elenarostova',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: 'Thanks Akira! Yes, all primary text cards pass 7.2:1 contrast ratio against the #0a0a0c background, and the glow is purely decorative!',
    likeCount: 8,
    parentCommentId: 'c_1',
    createdAt: Date.now() - 1000 * 60 * 20,
  },
  {
    commentId: 'c_3',
    postId: 'post_critique_monogram',
    authorId: 'user_sophia_ai',
    authorName: 'Sophia Chen',
    authorUsername: 'sophia_chen',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    content: 'Direction B by far. Hexagonal geometries inherently communicate stability and biomedical precision. Direction A feels more like a media streaming brand.',
    likeCount: 22,
    parentCommentId: null,
    createdAt: Date.now() - 1000 * 60 * 120,
  }
];

// Helper to access LocalStorage safely
function getLocal(key, defaultVal) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[PikCircle Storage] Could not persist ${key}:`, err);
  }
}

// Initialize seed data if empty
function initializeLocalCache() {
  if (!localStorage.getItem(LOCAL_POSTS_KEY)) {
    setLocal(LOCAL_POSTS_KEY, SEED_POSTS);
  }
  if (!localStorage.getItem(LOCAL_COMMENTS_KEY)) {
    setLocal(LOCAL_COMMENTS_KEY, SEED_COMMENTS);
  }
  if (!localStorage.getItem(LOCAL_PROFILES_KEY)) {
    setLocal(LOCAL_PROFILES_KEY, SEED_PROFILES);
  }
}

if (typeof window !== 'undefined') {
  initializeLocalCache();
}

/**
 * Fetch feed posts with filtering, tab selection, and pagination
 */
export async function fetchCommunityPosts({
  tab = 'for-you',
  category = 'all',
  searchQuery = '',
  tag = '',
  postType = '',
  currentUserId = null,
  limitCount = 10,
  page = 1
} = {}) {
  // First attempt live Firestore if connected
  if (isFirebaseConfigured && db) {
    try {
      const postsRef = collection(db, 'community_posts');
      let q = query(postsRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestorePosts = snapshot.docs.map(doc => ({ postId: doc.id, ...doc.data() }));
        return filterAndSortPosts(firestorePosts, { tab, category, searchQuery, tag, postType, currentUserId, limitCount, page });
      }
    } catch (err) {
      console.warn('[PikCircle] Firestore read failed or uninitialized, falling back to local dataset:', err?.message || err);
    }
  }

  // Fallback to local cache (guaranteed to always work)
  const posts = getLocal(LOCAL_POSTS_KEY, SEED_POSTS);
  return filterAndSortPosts(posts, { tab, category, searchQuery, tag, postType, currentUserId, limitCount, page });
}

function filterAndSortPosts(posts, { tab, category, searchQuery, tag, postType, currentUserId, limitCount, page }) {
  let filtered = [...posts];

  // Category filter
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  // Post Type filter
  if (postType && postType !== 'all') {
    filtered = filtered.filter(p => p.type === postType);
  }

  // Tag filter
  if (tag) {
    const normTag = tag.toLowerCase().replace('#', '');
    filtered = filtered.filter(p => p.tags?.some(t => t.toLowerCase() === normTag));
  }

  // Search filter
  if (searchQuery && searchQuery.trim()) {
    const qLower = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(p =>
      p.title?.toLowerCase().includes(qLower) ||
      p.content?.toLowerCase().includes(qLower) ||
      p.authorName?.toLowerCase().includes(qLower) ||
      p.authorUsername?.toLowerCase().includes(qLower) ||
      p.tags?.some(t => t.toLowerCase().includes(qLower))
    );
  }

  // Tab filtering & sorting
  const likes = getLocal(LOCAL_LIKES_KEY, {});
  const follows = getLocal(LOCAL_FOLLOWS_KEY, []);

  switch (tab) {
    case 'latest':
      filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      break;
    case 'popular':
      filtered.sort((a, b) => ((b.likeCount || 0) + (b.commentCount || 0) * 2) - ((a.likeCount || 0) + (a.commentCount || 0) * 2));
      break;
    case 'following':
      if (currentUserId) {
        const followedIds = follows.filter(f => f.followerId === currentUserId).map(f => f.followingId);
        filtered = filtered.filter(p => followedIds.includes(p.authorId));
      }
      filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      break;
    case 'unanswered':
      filtered = filtered.filter(p => (p.commentCount || 0) === 0);
      filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      break;
    case 'for-you':
    default:
      // Balanced score based on recency and engagement
      filtered.sort((a, b) => {
        const scoreA = (a.likeCount || 0) * 1.5 + (a.commentCount || 0) * 3 + (a.createdAt || 0) / 10000000;
        const scoreB = (b.likeCount || 0) * 1.5 + (b.commentCount || 0) * 3 + (b.createdAt || 0) / 10000000;
        return scoreB - scoreA;
      });
      break;
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limitCount;
  const paginated = filtered.slice(0, startIndex + limitCount);
  const hasMore = paginated.length < total;

  return {
    posts: paginated,
    total,
    hasMore,
    page
  };
}

/**
 * Get individual post by postId
 */
export async function getPostById(postId) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'community_posts', postId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { postId: snap.id, ...snap.data() };
      }
    } catch (err) {
      console.warn('[PikCircle] Error fetching single post from Firestore:', err);
    }
  }

  const posts = getLocal(LOCAL_POSTS_KEY, SEED_POSTS);
  return posts.find(p => p.postId === postId) || null;
}

/**
 * Create a new community post
 */
export async function createCommunityPost(postData, currentUser) {
  if (!currentUser) throw new Error('You must be signed in to publish a post.');

  const postId = 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newPost = {
    postId,
    authorId: currentUser.uid,
    authorName: currentUser.displayName || currentUser.name || 'Anonymous Designer',
    authorUsername: currentUser.username || (currentUser.email ? currentUser.email.split('@')[0] : 'creator'),
    authorAvatar: currentUser.photoURL || currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    type: postData.type || 'showcase',
    title: postData.title.trim(),
    content: postData.content.trim(),
    category: postData.category || 'ui-ux',
    tags: (postData.tags || []).map(t => t.trim().replace(/^#/, '')).filter(Boolean),
    imageAttachments: postData.imageAttachments || [],
    resourceUrl: postData.resourceUrl ? postData.resourceUrl.trim() : '',
    likeCount: 0,
    commentCount: 0,
    saveCount: 0,
    viewsCount: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'approved'
  };

  // Sync to Firestore if ready
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'community_posts', postId), {
        ...newPost,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('[PikCircle] Firestore post creation failed, persisting to local cache:', err);
    }
  }

  // Update local cache
  const posts = getLocal(LOCAL_POSTS_KEY, SEED_POSTS);
  const updated = [newPost, ...posts];
  setLocal(LOCAL_POSTS_KEY, updated);

  return newPost;
}

/**
 * Delete a post (ensures author ownership)
 */
export async function deleteCommunityPost(postId, currentUserId) {
  if (!currentUserId) throw new Error('Authentication required.');

  const post = await getPostById(postId);
  if (!post) throw new Error('Post not found.');
  if (post.authorId !== currentUserId) {
    throw new Error('Permission denied: You can only delete your own posts.');
  }

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'community_posts', postId));
    } catch (err) {
      console.warn('[PikCircle] Firestore post deletion failed:', err);
    }
  }

  const posts = getLocal(LOCAL_POSTS_KEY, SEED_POSTS);
  const updated = posts.filter(p => p.postId !== postId);
  setLocal(LOCAL_POSTS_KEY, updated);

  return true;
}

/**
 * Toggle like on a post
 */
export async function toggleLikePost(postId, currentUser) {
  if (!currentUser) throw new Error('Sign in required to like posts.');

  const userId = currentUser.uid;
  const likes = getLocal(LOCAL_LIKES_KEY, {});
  const userLikes = likes[userId] || [];
  const isLiked = userLikes.includes(postId);

  let newLikedState = !isLiked;
  let delta = newLikedState ? 1 : -1;

  if (newLikedState) {
    likes[userId] = [...userLikes, postId];
  } else {
    likes[userId] = userLikes.filter(id => id !== postId);
  }
  setLocal(LOCAL_LIKES_KEY, likes);

  // Update post like count in local cache
  const posts = getLocal(LOCAL_POSTS_KEY, SEED_POSTS);
  let updatedLikeCount = 0;
  const updatedPosts = posts.map(p => {
    if (p.postId === postId) {
      const count = Math.max(0, (p.likeCount || 0) + delta);
      updatedLikeCount = count;
      return { ...p, likeCount: count };
    }
    return p;
  });
  setLocal(LOCAL_POSTS_KEY, updatedPosts);

  // Sync to Firestore if available
  if (isFirebaseConfigured && db) {
    try {
      const postRef = doc(db, 'community_posts', postId);
      const likeRef = doc(db, 'community_likes', `${postId}_${userId}`);
      if (newLikedState) {
        await setDoc(likeRef, { postId, userId, createdAt: serverTimestamp() });
        await updateDoc(postRef, { likeCount: increment(1) });
      } else {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likeCount: increment(-1) });
      }
    } catch (err) {
      console.warn('[PikCircle] Firestore like sync failed:', err);
    }
  }

  // Trigger notification for author if liked (and not own post)
  const targetPost = posts.find(p => p.postId === postId);
  if (newLikedState && targetPost && targetPost.authorId !== userId) {
    createNotification({
      recipientId: targetPost.authorId,
      actorId: userId,
      actorName: currentUser.displayName || currentUser.name || 'A Designer',
      actorAvatar: currentUser.photoURL || '',
      type: 'like',
      postId,
      postTitle: targetPost.title
    });
  }

  return { isLiked: newLikedState, likeCount: updatedLikeCount };
}

/**
 * Check if post is liked by user
 */
export function isPostLikedByUser(postId, userId) {
  if (!userId) return false;
  const likes = getLocal(LOCAL_LIKES_KEY, {});
  return (likes[userId] || []).includes(postId);
}

/**
 * Toggle bookmark / save post
 */
export async function toggleSavePost(postId, currentUser) {
  if (!currentUser) throw new Error('Sign in required to save posts.');

  const userId = currentUser.uid;
  const saves = getLocal(LOCAL_SAVES_KEY, {});
  const userSaves = saves[userId] || [];
  const isSaved = userSaves.includes(postId);

  let newSavedState = !isSaved;
  let delta = newSavedState ? 1 : -1;

  if (newSavedState) {
    saves[userId] = [...userSaves, postId];
  } else {
    saves[userId] = userSaves.filter(id => id !== postId);
  }
  setLocal(LOCAL_SAVES_KEY, saves);

  // Update save count on post
  const posts = getLocal(LOCAL_POSTS_KEY, SEED_POSTS);
  let updatedSaveCount = 0;
  const updatedPosts = posts.map(p => {
    if (p.postId === postId) {
      const count = Math.max(0, (p.saveCount || 0) + delta);
      updatedSaveCount = count;
      return { ...p, saveCount: count };
    }
    return p;
  });
  setLocal(LOCAL_POSTS_KEY, updatedPosts);

  if (isFirebaseConfigured && db) {
    try {
      const saveRef = doc(db, 'community_saves', `${userId}_${postId}`);
      const postRef = doc(db, 'community_posts', postId);
      if (newSavedState) {
        await setDoc(saveRef, { postId, userId, createdAt: serverTimestamp() });
        await updateDoc(postRef, { saveCount: increment(1) });
      } else {
        await deleteDoc(saveRef);
        await updateDoc(postRef, { saveCount: increment(-1) });
      }
    } catch (err) {
      console.warn('[PikCircle] Firestore save sync failed:', err);
    }
  }

  return { isSaved: newSavedState, saveCount: updatedSaveCount };
}

/**
 * Check if post is saved by user
 */
export function isPostSavedByUser(postId, userId) {
  if (!userId) return false;
  const saves = getLocal(LOCAL_SAVES_KEY, {});
  return (saves[userId] || []).includes(postId);
}

/**
 * Fetch saved posts for user
 */
export async function getSavedPostsForUser(userId) {
  if (!userId) return [];
  const saves = getLocal(LOCAL_SAVES_KEY, {});
  const savedIds = saves[userId] || [];
  const allPosts = getLocal(LOCAL_POSTS_KEY, SEED_POSTS);
  return allPosts.filter(p => savedIds.includes(p.postId));
}

/**
 * Fetch comments for a post
 */
export async function fetchComments(postId) {
  if (isFirebaseConfigured && db) {
    try {
      const commentsRef = collection(db, 'community_comments');
      const q = query(commentsRef, where('postId', '==', postId), orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => ({ commentId: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('[PikCircle] Firestore comments fetch failed:', err);
    }
  }

  const comments = getLocal(LOCAL_COMMENTS_KEY, SEED_COMMENTS);
  return comments.filter(c => c.postId === postId);
}

/**
 * Add comment or reply
 */
export async function addComment(postId, { content, parentCommentId = null }, currentUser) {
  if (!currentUser) throw new Error('Sign in required to comment.');
  if (!content || !content.trim()) throw new Error('Comment content cannot be empty.');

  const commentId = 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const newComment = {
    commentId,
    postId,
    authorId: currentUser.uid,
    authorName: currentUser.displayName || currentUser.name || 'Designer',
    authorUsername: currentUser.username || (currentUser.email ? currentUser.email.split('@')[0] : 'creator'),
    authorAvatar: currentUser.photoURL || currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    content: content.trim(),
    parentCommentId: parentCommentId || null,
    likeCount: 0,
    createdAt: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'community_comments', commentId), {
        ...newComment,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'community_posts', postId), {
        commentCount: increment(1)
      });
    } catch (err) {
      console.warn('[PikCircle] Firestore addComment failed:', err);
    }
  }

  // Update local comments & post counter
  const comments = getLocal(LOCAL_COMMENTS_KEY, SEED_COMMENTS);
  setLocal(LOCAL_COMMENTS_KEY, [...comments, newComment]);

  const posts = getLocal(LOCAL_POSTS_KEY, SEED_POSTS);
  const updatedPosts = posts.map(p => {
    if (p.postId === postId) {
      return { ...p, commentCount: (p.commentCount || 0) + 1 };
    }
    return p;
  });
  setLocal(LOCAL_POSTS_KEY, updatedPosts);

  // Notify post author or parent comment author
  const post = posts.find(p => p.postId === postId);
  if (post && post.authorId !== currentUser.uid) {
    createNotification({
      recipientId: post.authorId,
      actorId: currentUser.uid,
      actorName: currentUser.displayName || currentUser.name || 'A Designer',
      actorAvatar: currentUser.photoURL || '',
      type: parentCommentId ? 'reply' : 'comment',
      postId,
      postTitle: post.title
    });
  }

  return newComment;
}

/**
 * Delete a comment (author only)
 */
export async function deleteComment(commentId, postId, currentUserId) {
  if (!currentUserId) throw new Error('Sign in required.');

  const comments = getLocal(LOCAL_COMMENTS_KEY, SEED_COMMENTS);
  const target = comments.find(c => c.commentId === commentId);
  if (!target) return true;
  if (target.authorId !== currentUserId) {
    throw new Error('You can only delete your own comments.');
  }

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'community_comments', commentId));
      await updateDoc(doc(db, 'community_posts', postId), {
        commentCount: increment(-1)
      });
    } catch (err) {
      console.warn('[PikCircle] Firestore comment delete failed:', err);
    }
  }

  const updated = comments.filter(c => c.commentId !== commentId);
  setLocal(LOCAL_COMMENTS_KEY, updated);

  const posts = getLocal(LOCAL_POSTS_KEY, SEED_POSTS);
  const updatedPosts = posts.map(p => {
    if (p.postId === postId) {
      return { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) };
    }
    return p;
  });
  setLocal(LOCAL_POSTS_KEY, updatedPosts);

  return true;
}

/**
 * Toggle follow/unfollow a creator
 */
export async function toggleFollowUser(currentUserId, targetUserId, currentUser) {
  if (!currentUserId) throw new Error('Sign in required to follow creators.');
  if (currentUserId === targetUserId) throw new Error('You cannot follow yourself.');

  const follows = getLocal(LOCAL_FOLLOWS_KEY, []);
  const isFollowing = follows.some(f => f.followerId === currentUserId && f.followingId === targetUserId);
  const nextState = !isFollowing;

  let updatedFollows;
  if (nextState) {
    updatedFollows = [...follows, { followerId: currentUserId, followingId: targetUserId, createdAt: Date.now() }];
  } else {
    updatedFollows = follows.filter(f => !(f.followerId === currentUserId && f.followingId === targetUserId));
  }
  setLocal(LOCAL_FOLLOWS_KEY, updatedFollows);

  // Update target profile followers count
  const profiles = getLocal(LOCAL_PROFILES_KEY, SEED_PROFILES);
  const updatedProfiles = profiles.map(pr => {
    if (pr.uid === targetUserId) {
      return { ...pr, followersCount: Math.max(0, (pr.followersCount || 0) + (nextState ? 1 : -1)) };
    }
    if (pr.uid === currentUserId) {
      return { ...pr, followingCount: Math.max(0, (pr.followingCount || 0) + (nextState ? 1 : -1)) };
    }
    return pr;
  });
  setLocal(LOCAL_PROFILES_KEY, updatedProfiles);

  if (isFirebaseConfigured && db) {
    try {
      const followRef = doc(db, 'community_follows', `${currentUserId}_${targetUserId}`);
      if (nextState) {
        await setDoc(followRef, { followerId: currentUserId, followingId: targetUserId, createdAt: serverTimestamp() });
      } else {
        await deleteDoc(followRef);
      }
    } catch (err) {
      console.warn('[PikCircle] Firestore follow sync failed:', err);
    }
  }

  if (nextState && currentUser) {
    createNotification({
      recipientId: targetUserId,
      actorId: currentUserId,
      actorName: currentUser.displayName || currentUser.name || 'A Designer',
      actorAvatar: currentUser.photoURL || '',
      type: 'follow',
      postId: null,
      postTitle: ''
    });
  }

  return { isFollowing: nextState };
}

export function isUserFollowing(currentUserId, targetUserId) {
  if (!currentUserId || !targetUserId) return false;
  const follows = getLocal(LOCAL_FOLLOWS_KEY, []);
  return follows.some(f => f.followerId === currentUserId && f.followingId === targetUserId);
}

/**
 * Get Creator Profile by username or UID
 */
export async function getCreatorProfile(usernameOrUid) {
  const norm = usernameOrUid.toLowerCase().replace('@', '');
  const profiles = getLocal(LOCAL_PROFILES_KEY, SEED_PROFILES);
  let profile = profiles.find(p => p.username?.toLowerCase() === norm || p.uid === usernameOrUid);

  if (profile) return profile;

  // Synthesize default profile if user exists in auth/firebase
  return {
    uid: usernameOrUid,
    username: norm,
    displayName: norm.charAt(0).toUpperCase() + norm.slice(1),
    avatarUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${norm}`,
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    bio: 'Digital Creator & Member of PikCircle.',
    disciplines: ['UI/UX Design', 'Visual Art'],
    skills: ['Figma', 'Typography'],
    portfolioUrl: '',
    socialLinks: {},
    followersCount: 12,
    followingCount: 45,
    postsCount: 0,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30
  };
}

/**
 * Update current user's profile
 */
export async function updateCreatorProfile(uid, profileData) {
  const profiles = getLocal(LOCAL_PROFILES_KEY, SEED_PROFILES);
  const index = profiles.findIndex(p => p.uid === uid);
  let updatedProfile;

  if (index >= 0) {
    updatedProfile = { ...profiles[index], ...profileData, updatedAt: Date.now() };
    profiles[index] = updatedProfile;
  } else {
    updatedProfile = { uid, ...profileData, createdAt: Date.now() };
    profiles.push(updatedProfile);
  }

  setLocal(LOCAL_PROFILES_KEY, profiles);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'community_profiles', uid), updatedProfile, { merge: true });
    } catch (err) {
      console.warn('[PikCircle] Firestore profile update failed:', err);
    }
  }

  return updatedProfile;
}

/**
 * Notifications Management
 */
export function createNotification(notifData) {
  const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const newNotif = {
    notificationId: notifId,
    recipientId: notifData.recipientId,
    actorId: notifData.actorId,
    actorName: notifData.actorName,
    actorAvatar: notifData.actorAvatar,
    type: notifData.type, // 'like' | 'comment' | 'reply' | 'follow'
    postId: notifData.postId || null,
    postTitle: notifData.postTitle || '',
    isRead: false,
    createdAt: Date.now()
  };

  const notifs = getLocal(LOCAL_NOTIFS_KEY, []);
  setLocal(LOCAL_NOTIFS_KEY, [newNotif, ...notifs]);

  if (isFirebaseConfigured && db) {
    try {
      setDoc(doc(db, 'community_notifications', notifId), {
        ...newNotif,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('[PikCircle] Firestore notif write failed:', err);
    }
  }
}

export function fetchNotificationsForUser(userId) {
  if (!userId) return [];
  const notifs = getLocal(LOCAL_NOTIFS_KEY, []);
  return notifs.filter(n => n.recipientId === userId).sort((a, b) => b.createdAt - a.createdAt);
}

export function markNotificationAsRead(notifId) {
  const notifs = getLocal(LOCAL_NOTIFS_KEY, []);
  const updated = notifs.map(n => n.notificationId === notifId ? { ...n, isRead: true } : n);
  setLocal(LOCAL_NOTIFS_KEY, updated);
}

export function markAllNotificationsAsRead(userId) {
  const notifs = getLocal(LOCAL_NOTIFS_KEY, []);
  const updated = notifs.map(n => n.recipientId === userId ? { ...n, isRead: true } : n);
  setLocal(LOCAL_NOTIFS_KEY, updated);
}

/**
 * Report Post or Comment
 */
export async function submitCommunityReport({ reporterId, targetType, targetId, reason }) {
  const reportId = 'rep_' + Date.now();
  const report = {
    reportId,
    reporterId: reporterId || 'anonymous',
    targetType, // 'post' | 'comment' | 'user'
    targetId,
    reason,
    createdAt: Date.now(),
    status: 'pending'
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'community_reports', reportId), {
        ...report,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('[PikCircle] Firestore report failed:', err);
    }
  }

  const reports = getLocal('pikcircle_reports_cache', []);
  setLocal('pikcircle_reports_cache', [report, ...reports]);
  return true;
}

/**
 * Client-Side Image Compression & Upload helper
 * Validates file size (max 8MB) and type.
 * Uploads to Firebase Storage if online, otherwise converts to compressed WebP data URL.
 */
export async function uploadCommunityImage(file, onProgress = () => {}) {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Unsupported format. Please upload PNG, JPG, WebP, AVIF, or GIF.');
  }

  const MAX_SIZE = 8 * 1024 * 1024; // 8MB
  if (file.size > MAX_SIZE) {
    throw new Error('Image too large. Maximum attachment size is 8MB.');
  }

  // If Firebase Storage is initialized and online, upload to cloud storage
  if (isFirebaseConfigured && storage) {
    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, `community/uploads/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(prog);
          },
          (err) => {
            console.warn('[PikCircle] Storage upload error, falling back to local processing:', err);
            resolve(compressToDataUrl(file, onProgress));
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress(100);
            resolve({
              url: downloadUrl,
              alt: file.name.replace(/\.[^/.]+$/, ''),
              aspectRatio: '16/10'
            });
          }
        );
      });
    } catch (err) {
      console.warn('[PikCircle] Cloud storage upload bypassed:', err);
    }
  }

  // Reliable, high-speed client-side compression fallback
  return compressToDataUrl(file, onProgress);
}

function compressToDataUrl(file, onProgress) {
  return new Promise((resolve, reject) => {
    onProgress(30);
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      onProgress(60);
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1600;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        onProgress(85);

        const dataUrl = canvas.toDataURL('image/webp', 0.82);
        onProgress(100);
        resolve({
          url: dataUrl,
          alt: file.name.replace(/\.[^/.]+$/, ''),
          aspectRatio: `${width}/${height}`
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Get Featured Creators
 */
export function getFeaturedCreators() {
  const profiles = getLocal(LOCAL_PROFILES_KEY, SEED_PROFILES);
  return profiles.slice(0, 5);
}

/**
 * Get Trending Topics
 */
export function getTrendingTopics() {
  return [
    { tag: 'FigmaVariables', count: 184, category: 'ui-ux' },
    { tag: 'Glassmorphism', count: 142, category: 'motion-design' },
    { tag: 'DesignTokens', count: 129, category: 'ui-ux' },
    { tag: 'Spline3D', count: 98, category: 'motion-design' },
    { tag: 'BrandIdentity', count: 86, category: 'branding' },
    { tag: 'FreelanceRates', count: 74, category: 'careers' }
  ];
}
