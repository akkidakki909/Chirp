// ============================================
// Chirp — Mock Data Layer
// Designed to mirror relational DB schemas
// ============================================

// ---- USERS TABLE ----
export const users = [
  {
    id: 1,
    username: 'aditya_dev',
    displayName: 'Aditya Sharma',
    handle: '@aditya_dev',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aditya&backgroundColor=ffd5dc',
    banner: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=250&fit=crop',
    bio: 'Full-stack dev 🚀 | Building things that matter | Coffee enthusiast ☕',
    location: 'Mumbai, India',
    website: 'aditya.dev',
    joinedDate: '2024-03-15',
    followersCount: 1284,
    followingCount: 432,
    postsCount: 847,
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 2,
    username: 'priya_codes',
    displayName: 'Priya Nair',
    handle: '@priya_codes',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya&backgroundColor=c0aede',
    banner: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=250&fit=crop',
    bio: 'CS student @ IIT Delhi | Open source contributor | 🎨 UI/UX lover',
    location: 'New Delhi, India',
    website: 'priyanair.com',
    joinedDate: '2024-06-10',
    followersCount: 956,
    followingCount: 312,
    postsCount: 523,
    isVerified: false,
    isFollowing: true,
  },
  {
    id: 3,
    username: 'rahul_wanderer',
    displayName: 'Rahul Kapoor',
    handle: '@rahul_wanderer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul&backgroundColor=b6e3f4',
    banner: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=250&fit=crop',
    bio: 'Travel | Photography | Chai > Coffee ☕ | DBMS enthusiast surprisingly',
    location: 'Bangalore, India',
    website: '',
    joinedDate: '2024-01-22',
    followersCount: 2103,
    followingCount: 891,
    postsCount: 1247,
    isVerified: true,
    isFollowing: true,
  },
  {
    id: 4,
    username: 'sneha_writes',
    displayName: 'Sneha Reddy',
    handle: '@sneha_writes',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sneha&backgroundColor=ffd5dc',
    banner: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=250&fit=crop',
    bio: 'Words are my weapon ✍️ | Tech writer | Bookworm | Hyderabad vibes',
    location: 'Hyderabad, India',
    website: 'snehawrites.blog',
    joinedDate: '2024-08-03',
    followersCount: 678,
    followingCount: 234,
    postsCount: 312,
    isVerified: false,
    isFollowing: false,
  },
  {
    id: 5,
    username: 'arjun_tech',
    displayName: 'Arjun Mehta',
    handle: '@arjun_tech',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun&backgroundColor=d1d4f9',
    banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=250&fit=crop',
    bio: 'DevOps Engineer @ Flipkart | Kubernetes nerd 🐳 | Mentor | Pune',
    location: 'Pune, India',
    website: 'arjunmehta.dev',
    joinedDate: '2023-11-28',
    followersCount: 3456,
    followingCount: 567,
    postsCount: 1890,
    isVerified: true,
    isFollowing: true,
  },
];

// The "logged in" user
export const currentUser = {
  id: 1,
  username: 'aditya_dev',
  displayName: 'Aditya Sharma',
  handle: '@aditya_dev',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aditya&backgroundColor=ffd5dc',
  banner: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=250&fit=crop',
  bio: 'Full-stack dev 🚀 | Building things that matter | Coffee enthusiast ☕',
  location: 'Mumbai, India',
  website: 'aditya.dev',
  joinedDate: '2024-03-15',
  followersCount: 1284,
  followingCount: 432,
  postsCount: 847,
  isVerified: true,
};

// ---- POSTS TABLE ----
export const posts = [
  {
    id: 1,
    userId: 3,
    content: 'Just deployed my first Kubernetes cluster on GCP and it feels AMAZING 🚀\n\nAfter weeks of struggling with pod scheduling and ingress configs, everything finally clicked. The feeling when all your pods turn green is unmatched.\n\nThread incoming on what I learned 🧵',
    images: [],
    createdAt: '2026-09-01T14:30:00',
    likes: 142,
    comments: 23,
    reposts: 18,
    bookmarks: 7,
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
    isEdited: false,
    editHistory: [],
    poll: null,
  },
  {
    id: 2,
    userId: 2,
    content: 'Hot take: The best database is the one your team actually understands well enough to debug at 3 AM. 🤷‍♀️\n\nStop chasing trends. Master your tools.',
    images: [],
    createdAt: '2026-09-01T12:15:00',
    likes: 287,
    comments: 45,
    reposts: 56,
    bookmarks: 23,
    isLiked: true,
    isReposted: false,
    isBookmarked: true,
    isEdited: true,
    editHistory: [
      {
        content: 'Hot take: The best database is the one your team actually understands.',
        editedAt: '2026-09-01T12:15:00',
      },
      {
        content: 'Hot take: The best database is the one your team actually understands well enough to debug at 3 AM. 🤷‍♀️\n\nStop chasing trends. Master your tools.',
        editedAt: '2026-09-01T12:22:00',
      },
    ],
    poll: null,
  },
  {
    id: 3,
    userId: 4,
    content: 'What\'s your preferred way to handle state management in React?\n\nGenuinely curious about what the community is using in 2026.',
    images: [],
    createdAt: '2026-09-01T10:00:00',
    likes: 98,
    comments: 67,
    reposts: 12,
    bookmarks: 5,
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
    isEdited: false,
    editHistory: [],
    poll: {
      id: 1,
      options: [
        { id: 1, text: 'Zustand', votes: 342 },
        { id: 2, text: 'Redux Toolkit', votes: 234 },
        { id: 3, text: 'React Context + useReducer', votes: 189 },
        { id: 4, text: 'Jotai / Recoil', votes: 156 },
      ],
      totalVotes: 921,
      endsAt: '2026-09-03T10:00:00',
      hasVoted: false,
      votedOptionId: null,
    },
  },
  {
    id: 4,
    userId: 5,
    content: 'Morning coffee + clean code = perfect start to the day ☕✨\n\nCurrently refactoring a legacy codebase from callback hell to async/await. The before/after diff is going to be *chef\'s kiss*.',
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=300&fit=crop'],
    createdAt: '2026-09-01T08:45:00',
    likes: 76,
    comments: 8,
    reposts: 3,
    bookmarks: 2,
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
    isEdited: false,
    editHistory: [],
    poll: null,
  },
  {
    id: 5,
    userId: 1,
    content: 'Building a Twitter clone for our DBMS project and honestly? It\'s teaching us more about database design than any lecture ever could.\n\nNormalization, indexing, query optimization — it all makes sense when you have real data flowing through the system.\n\n#LearnByBuilding',
    images: [],
    createdAt: '2026-08-31T22:30:00',
    likes: 203,
    comments: 34,
    reposts: 41,
    bookmarks: 15,
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
    isEdited: false,
    editHistory: [],
    poll: null,
  },
  {
    id: 6,
    userId: 2,
    content: 'UI/UX tip of the day:\n\nDon\'t use placeholder text as labels. They disappear when users start typing, causing confusion.\n\nUse floating labels instead — they\'re accessible AND look good. 🎨',
    images: [],
    createdAt: '2026-08-31T18:00:00',
    likes: 156,
    comments: 19,
    reposts: 28,
    bookmarks: 11,
    isLiked: true,
    isReposted: true,
    isBookmarked: false,
    isEdited: false,
    editHistory: [],
    poll: null,
  },
  {
    id: 7,
    userId: 3,
    content: 'Just got back from a trek to Valley of Flowers in Uttarakhand 🏔️🌸\n\nSometimes the best debugging happens when you step away from the keyboard.\n\nAlso, the sunsets here should be illegal.',
    images: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&h=300&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop',
    ],
    createdAt: '2026-08-31T16:00:00',
    likes: 432,
    comments: 56,
    reposts: 72,
    bookmarks: 34,
    isLiked: false,
    isReposted: false,
    isBookmarked: true,
    isEdited: false,
    editHistory: [],
    poll: null,
  },
  {
    id: 8,
    userId: 5,
    content: 'PSA for junior developers:\n\n1. It\'s okay to Google stuff\n2. It\'s okay to ask questions\n3. It\'s okay to not know everything\n4. It\'s NOT okay to copy-paste without understanding\n\nThe best senior devs are the ones who never stopped being curious learners. 📚',
    images: [],
    createdAt: '2026-08-31T14:00:00',
    likes: 567,
    comments: 78,
    reposts: 123,
    bookmarks: 45,
    isLiked: true,
    isReposted: false,
    isBookmarked: true,
    isEdited: true,
    editHistory: [
      {
        content: 'PSA for junior developers:\n\n1. It\'s okay to Google stuff\n2. It\'s okay to ask questions\n3. It\'s okay to not know everything\n\nThe best senior devs are curious.',
        editedAt: '2026-08-31T14:00:00',
      },
      {
        content: 'PSA for junior developers:\n\n1. It\'s okay to Google stuff\n2. It\'s okay to ask questions\n3. It\'s okay to not know everything\n4. It\'s NOT okay to copy-paste without understanding\n\nThe best senior devs are the ones who never stopped being curious learners. 📚',
        editedAt: '2026-08-31T14:12:00',
      },
    ],
    poll: null,
  },
];

// ---- COMMENTS TABLE ----
export const comments = [
  { id: 1, postId: 1, userId: 2, content: 'Congrats! K8s is a beast but so rewarding when it clicks 🔥', createdAt: '2026-09-01T14:45:00', likes: 12 },
  { id: 2, postId: 1, userId: 5, content: 'Wait till you discover Helm charts. Game changer.', createdAt: '2026-09-01T15:00:00', likes: 8 },
  { id: 3, postId: 1, userId: 4, content: 'Would love to read that thread! Following 🧵', createdAt: '2026-09-01T15:10:00', likes: 5 },
  { id: 4, postId: 2, userId: 1, content: 'Absolutely this. We\'ve been using PostgreSQL for 3 years and it\'s bulletproof for us.', createdAt: '2026-09-01T12:30:00', likes: 23 },
  { id: 5, postId: 2, userId: 3, content: 'Counter-hot-take: Sometimes you SHOULD explore new tools. Just not in production at 3 AM 😂', createdAt: '2026-09-01T12:45:00', likes: 45 },
  { id: 6, postId: 5, userId: 2, content: 'This is so true! Our DBMS project taught me more about indexing than the entire semester.', createdAt: '2026-08-31T23:00:00', likes: 18 },
  { id: 7, postId: 5, userId: 3, content: 'What tech stack are you using? We went with React + Express + MySQL', createdAt: '2026-08-31T23:15:00', likes: 7 },
  { id: 8, postId: 8, userId: 2, content: '5. It\'s okay to take breaks. Burnout is real.', createdAt: '2026-08-31T14:30:00', likes: 89 },
  { id: 9, postId: 8, userId: 4, content: 'Pinning this to my desktop. Thank you ❤️', createdAt: '2026-08-31T14:45:00', likes: 34 },
  { id: 10, postId: 7, userId: 1, content: 'Those views 😍 Which trail did you take?', createdAt: '2026-08-31T16:30:00', likes: 11 },
];

// ---- NOTIFICATIONS TABLE ----
export const notifications = [
  { id: 1, type: 'like', fromUserId: 2, postId: 5, createdAt: '2026-09-01T15:00:00', isRead: false },
  { id: 2, type: 'follow', fromUserId: 4, createdAt: '2026-09-01T14:30:00', isRead: false },
  { id: 3, type: 'reply', fromUserId: 3, postId: 5, content: 'What tech stack are you using?', createdAt: '2026-08-31T23:15:00', isRead: false },
  { id: 4, type: 'repost', fromUserId: 5, postId: 5, createdAt: '2026-08-31T22:45:00', isRead: true },
  { id: 5, type: 'like', fromUserId: 3, postId: 5, createdAt: '2026-08-31T22:40:00', isRead: true },
  { id: 6, type: 'mention', fromUserId: 2, postId: 6, content: '@aditya_dev check this out!', createdAt: '2026-08-31T18:30:00', isRead: true },
  { id: 7, type: 'follow', fromUserId: 5, createdAt: '2026-08-30T10:00:00', isRead: true },
  { id: 8, type: 'like', fromUserId: 4, postId: 5, createdAt: '2026-08-30T09:00:00', isRead: true },
];

// ---- MESSAGES TABLE ----
export const conversations = [
  {
    id: 1,
    participantId: 2,
    lastMessage: 'Hey! Did you figure out the SQL joins issue?',
    lastMessageAt: '2026-09-01T13:00:00',
    unreadCount: 2,
    messages: [
      { id: 1, senderId: 1, content: 'Hey Priya! Quick question about the project', createdAt: '2026-09-01T12:30:00' },
      { id: 2, senderId: 2, content: 'Sure, what\'s up?', createdAt: '2026-09-01T12:32:00' },
      { id: 3, senderId: 1, content: 'Having trouble with the LEFT JOIN on the comments table. Getting duplicate rows.', createdAt: '2026-09-01T12:35:00' },
      { id: 4, senderId: 2, content: 'Oh yeah, that happens when you don\'t use DISTINCT or GROUP BY. Try adding GROUP BY post_id', createdAt: '2026-09-01T12:40:00' },
      { id: 5, senderId: 1, content: 'Let me try that, thanks!', createdAt: '2026-09-01T12:45:00' },
      { id: 6, senderId: 2, content: 'Hey! Did you figure out the SQL joins issue?', createdAt: '2026-09-01T13:00:00' },
    ],
  },
  {
    id: 2,
    participantId: 3,
    lastMessage: 'The trek photos are insane btw 🏔️',
    lastMessageAt: '2026-08-31T20:00:00',
    unreadCount: 0,
    messages: [
      { id: 1, senderId: 3, content: 'Bro check out the sunset from today\'s trek!', createdAt: '2026-08-31T19:00:00' },
      { id: 2, senderId: 1, content: 'WHAT. That\'s unreal. Which place?', createdAt: '2026-08-31T19:15:00' },
      { id: 3, senderId: 3, content: 'Valley of Flowers, Uttarakhand. You HAVE to visit.', createdAt: '2026-08-31T19:30:00' },
      { id: 4, senderId: 1, content: 'The trek photos are insane btw 🏔️', createdAt: '2026-08-31T20:00:00' },
    ],
  },
  {
    id: 3,
    participantId: 5,
    lastMessage: 'See you at the meetup tomorrow!',
    lastMessageAt: '2026-08-30T21:00:00',
    unreadCount: 0,
    messages: [
      { id: 1, senderId: 5, content: 'Hey Aditya, coming to the React meetup tomorrow?', createdAt: '2026-08-30T20:00:00' },
      { id: 2, senderId: 1, content: 'Absolutely! What time does it start?', createdAt: '2026-08-30T20:15:00' },
      { id: 3, senderId: 5, content: '6 PM at the WeWork in BKC. I\'m giving a talk on Kubernetes best practices.', createdAt: '2026-08-30T20:30:00' },
      { id: 4, senderId: 1, content: 'See you at the meetup tomorrow!', createdAt: '2026-08-30T21:00:00' },
    ],
  },
];

// ---- TRENDING / HASHTAGS ----
export const trending = [
  { id: 1, tag: '#ReactJS', category: 'Technology', postsCount: 12400 },
  { id: 2, tag: '#DBMS', category: 'Education', postsCount: 8900 },
  { id: 3, tag: '#LearnByBuilding', category: 'Education', postsCount: 5600 },
  { id: 4, tag: '#Kubernetes', category: 'Technology', postsCount: 4200 },
  { id: 5, tag: '#IndianTech', category: 'Business', postsCount: 3800 },
  { id: 6, tag: '#OpenSource', category: 'Technology', postsCount: 3100 },
  { id: 7, tag: '#CodingLife', category: 'Lifestyle', postsCount: 2800 },
  { id: 8, tag: '#PostgreSQL', category: 'Technology', postsCount: 2400 },
];

// ---- BOOKMARKS / COLLECTIONS ----
export const bookmarkCollections = [
  { id: 1, name: 'Dev Tips', description: 'Useful development tips & tricks', postIds: [2, 8], createdAt: '2026-08-20' },
  { id: 2, name: 'Travel Inspo', description: 'Places to visit', postIds: [7], createdAt: '2026-08-25' },
  { id: 3, name: 'DBMS Notes', description: 'Useful DB stuff for the project', postIds: [5], createdAt: '2026-08-28' },
];

// ---- ANALYTICS (for current user) ----
export const analytics = {
  impressions: [
    { date: '2026-08-26', count: 1200 },
    { date: '2026-08-27', count: 1450 },
    { date: '2026-08-28', count: 980 },
    { date: '2026-08-29', count: 2100 },
    { date: '2026-08-30', count: 1800 },
    { date: '2026-08-31', count: 3200 },
    { date: '2026-09-01', count: 2700 },
  ],
  engagementRate: 4.2,
  profileVisits: 342,
  topPosts: [5, 8],
  followerGrowth: [
    { date: '2026-08-26', count: 1250 },
    { date: '2026-08-27', count: 1256 },
    { date: '2026-08-28', count: 1260 },
    { date: '2026-08-29', count: 1268 },
    { date: '2026-08-30', count: 1272 },
    { date: '2026-08-31', count: 1278 },
    { date: '2026-09-01', count: 1284 },
  ],
};

// ---- REPORT REASONS ----
export const reportReasons = [
  { id: 1, label: 'Spam', description: 'Repetitive or unsolicited content' },
  { id: 2, label: 'Harassment', description: 'Targeted harassment or bullying' },
  { id: 3, label: 'Hate Speech', description: 'Content promoting hatred based on identity' },
  { id: 4, label: 'Misinformation', description: 'False or misleading information' },
  { id: 5, label: 'Violence', description: 'Threats of or promoting violence' },
  { id: 6, label: 'NSFW Content', description: 'Inappropriate or explicit content' },
  { id: 7, label: 'Other', description: 'Something else not listed above' },
];

// ---- HELPER: Get user by ID ----
export function getUserById(id) {
  return users.find((u) => u.id === id) || null;
}

// ---- HELPER: Get posts by user ----
export function getPostsByUser(userId) {
  return posts.filter((p) => p.userId === userId);
}

// ---- HELPER: Get comments by post ----
export function getCommentsByPost(postId) {
  return comments.filter((c) => c.postId === postId);
}

// ---- HELPER: Format number ----
export function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
