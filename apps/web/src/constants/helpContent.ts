export interface HelpContent {
  title: string;
  description: string;
  keyFeatures: string[];
}

export const HELP_CONTENT: Record<string, HelpContent> = {
  capture: {
    title: 'Capture Page',
    description: 'The fundamental way to save memories. Create text memories, add images, URLs, videos, and link to people, locations, and topics.',
    keyFeatures: [
      'Type or speak to create memories (voice input on mobile)',
      'Attach images, URLs, YouTube/TikTok videos',
      'Link to people, locations, and topics',
      'Save with automatic reminders for spaced repetition',
      'AI enrichment adds categories, tags, and sentiment',
    ],
  },
  search: {
    title: 'Search Page',
    description: 'AI-powered semantic search that understands meaning, not just keywords. Find memories by concept, even if they don\'t contain exact words.',
    keyFeatures: [
      'Semantic search finds memories by meaning',
      'Example: "happy moments" finds joy, celebration, good times',
      'Falls back to keyword search if embeddings unavailable',
      'Filter by date, tags, and memory types',
    ],
  },
  reminders: {
    title: 'Reminders Inbox',
    description: 'Spaced repetition system that helps move memories from short-term to long-term memory using science-backed intervals.',
    keyFeatures: [
      'Default schedule: 1 day, 3 days, 7 days after creation',
      'Mark reminders as read or dismiss them',
      'Due reminder count shown in navigation badge',
      'Schedule custom reminders for specific dates/times',
      'Convert reminders to slide decks for active recall training',
    ],
  },
  projects: {
    title: 'Topics',
    description: 'Organize related memories into groups or categories. Track projects, courses, goals, or any themed collections.',
    keyFeatures: [
      'Create topics with names and descriptions',
      'Link memories during creation or later',
      'View all memories in a topic',
      'Delete topics without deleting memories',
    ],
  },
  trainings: {
    title: 'Trainings',
    description: 'Structured learning programs with memory collections and active recall training decks.',
    keyFeatures: [
      'Create training courses with linked memories',
      'Generate training decks with 3-phase memory cycle',
      'Track learning progress and statistics',
      'Designed specifically for active learning and review',
    ],
  },
  slidedecks: {
    title: 'Slide Decks',
    description: 'Active recall training using your reminders. Transform passive review into active memory strengthening.',
    keyFeatures: [
      'Select reminders to include in a deck',
      '3-phase cycle: Show (2s) → Recall (5s) → Revealed',
      'Pause/Resume, Skip to Answer, Navigate slides',
      'Next button only enabled after answer revealed',
      'Proven to strengthen memory retention',
    ],
  },
  words: {
    title: 'Words & Vocabulary',
    description: 'Personal dictionary system. Words auto-link when mentioned in future memories.',
    keyFeatures: [
      'Create word/phrase definitions',
      'Automatic detection and linking in new memories',
      'Supports foreign languages, technical terms, any definition',
      'Build a personal glossary of concepts',
    ],
  },
  questions: {
    title: 'Questions',
    description: 'AI-powered Q&A system. Ask questions about your memories and get detailed answers.',
    keyFeatures: [
      'Click "Ask" on Capture page (purple button)',
      'AI (GPT-4o) generates detailed answers from memory content',
      'Automatically creates 3 SRS reminders',
      'Linked to original memory for context',
    ],
  },
  people: {
    title: 'People',
    description: 'Personal CRM system. Track people, conversations, and relationships.',
    keyFeatures: [
      'Create profiles with name, email, phone, bio',
      'Link memories to people',
      'Person-first memory creation workflow',
      'Track relationships between people',
      'View all memories associated with each person',
    ],
  },
  locations: {
    title: 'Locations',
    description: 'Geographic memory mapping. Associate memories with places.',
    keyFeatures: [
      'Create locations with coordinates',
      'Link memories to locations',
      'View all memories from a location',
      'Build a memory map of your experiences',
    ],
  },
  images: {
    title: 'Images',
    description: 'Visual content management with automatic compression and thumbnail generation.',
    keyFeatures: [
      'Upload JPG, PNG, GIF formats',
      'Automatic compression (client-side)',
      'Thumbnail generation (256px and 1024px)',
      'Link to memories, people, topics',
      'Amazon S3 storage',
    ],
  },
  urls: {
    title: 'URLs & Web Pages',
    description: 'Personal bookmark system with automatic metadata extraction.',
    keyFeatures: [
      'Save articles and web pages',
      'Automatic metadata fetch (title, description, image)',
      'Open Graph data extraction',
      'Link to memories and people',
    ],
  },
  'youtube-videos': {
    title: 'YouTube Videos',
    description: 'Curated video library with transcript extraction.',
    keyFeatures: [
      'Save educational videos and lectures',
      'Automatic metadata extraction',
      'Transcript fetching when available',
      'Link to memories and people',
    ],
  },
  'tiktok-videos': {
    title: 'TikTok Videos',
    description: 'Short-form content preservation with transcripts.',
    keyFeatures: [
      'Save educational TikToks',
      'Metadata and transcript extraction',
      'Link to memories and people',
      'Preserve content even if original deleted',
    ],
  },
  'twitter-posts': {
    title: 'Twitter/X Posts',
    description: 'Tweet archive with full metadata preservation.',
    keyFeatures: [
      'Save important threads and tweets',
      'Full metadata preservation',
      'Link to memories and people',
      'Content preserved even if deleted',
    ],
  },
  relationships: {
    title: 'Relationship Graph',
    description: 'Visual network showing connections between people.',
    keyFeatures: [
      'Map your social network',
      'Relationship types: spouse, parent, colleague, friend',
      'Interactive graph visualization',
      'Remember how people know each other',
    ],
  },
  atlas: {
    title: 'Atlas',
    description: 'Geographic visualization of your memories and locations.',
    keyFeatures: [
      'Map view of all memories with location data',
      'Visual memory exploration',
      'Filter by location, date, tags',
    ],
  },
  settings: {
    title: 'Settings',
    description: 'Account management, usage statistics, and preferences.',
    keyFeatures: [
      'View tier and usage limits',
      'Configure reminder intervals',
      'Manage your memories',
      'Account and logout controls',
      'Reset help popups',
    ],
  },
  upgrade: {
    title: 'Upgrade',
    description: 'Unlock premium features and higher limits.',
    keyFeatures: [
      'Free: 10 memories/day, 100/month',
      'Premium: 100 memories/day, unlimited monthly',
      'Higher AI embedding and classification limits',
    ],
  },
  feed: {
    title: 'Feed (Dashboard)',
    description: 'Overview of your recent activity and statistics.',
    keyFeatures: [
      'Recent memories at a glance',
      'Usage statistics and limits',
      'Due reminders count',
      'Quick actions for capture',
    ],
  },
  review: {
    title: 'Synapse Review',
    description: 'Spaced repetition review system for memories.',
    keyFeatures: [
      'Review memories on schedule',
      'Rate recall difficulty (Again, Hard, Good, Easy)',
      'SM-2 algorithm adjusts intervals',
      'Track review streaks and statistics',
    ],
  },
  'reminder-schedule': {
    title: 'Reminder Schedule',
    description: 'View and manage upcoming reminders.',
    keyFeatures: [
      'Calendar view of scheduled reminders',
      'Custom reminder scheduling',
      'Edit reminder times',
      'See all future reminders',
    ],
  },
  'training-decks': {
    title: 'Training Decks',
    description: 'Active learning sessions from your trainings.',
    keyFeatures: [
      'Sequential presentation of training content',
      '3-phase memory training cycle',
      'Progress tracking',
      'Repeat decks for mastery',
    ],
  },
  admin: {
    title: 'Admin Panel',
    description: 'System management interface (admin role required).',
    keyFeatures: [
      'User management',
      'Memory type management',
      'System metrics',
      'AI cost monitoring',
      'Audit trail access',
    ],
  },
  'audit-trail': {
    title: 'Audit Trail',
    description: 'System-wide logging of all actions (admin only).',
    keyFeatures: [
      'User action logs',
      'System event tracking',
      'API call monitoring',
      'Data change history',
    ],
  },
  'tiktok-builder': {
    title: 'TikTok Builder',
    description: 'Add and manage TikTok videos.',
    keyFeatures: [
      'Paste TikTok URLs to save',
      'Automatic metadata extraction',
      'Transcript extraction',
      'Link to memories',
    ],
  },
  'youtube-builder': {
    title: 'YouTube Builder',
    description: 'Add and manage YouTube videos.',
    keyFeatures: [
      'Paste YouTube URLs to save',
      'Automatic metadata extraction',
      'Transcript extraction when available',
      'Link to memories and people',
    ],
  },
  'url-builder': {
    title: 'URL Builder',
    description: 'Add and manage web page links.',
    keyFeatures: [
      'Paste URLs to save',
      'Automatic page metadata extraction',
      'Open Graph data extraction',
      'Link to memories',
    ],
  },
  'image-builder': {
    title: 'Image Builder',
    description: 'Upload and manage images.',
    keyFeatures: [
      'Upload multiple images',
      'Automatic compression',
      'Thumbnail generation',
      'Link to memories and people',
    ],
  },
  'location-builder': {
    title: 'Location Builder',
    description: 'Create and manage locations.',
    keyFeatures: [
      'Add locations with coordinates',
      'AI enrichment for location details',
      'Link to memories',
      'Build your location library',
    ],
  },
  'person-builder': {
    title: 'Person Builder',
    description: 'Add and manage people in your network.',
    keyFeatures: [
      'Create person profiles',
      'Add contact information',
      'Define relationships',
      'Link to memories',
    ],
  },
  'slidedeck-viewer': {
    title: 'Slide Deck Viewer',
    description: 'Present and train with your slide decks.',
    keyFeatures: [
      'Full-screen presentation mode',
      '3-phase training cycle',
      'Navigation controls',
      'Pause/resume functionality',
    ],
  },
  'training-deck-viewer': {
    title: 'Training Deck Viewer',
    description: 'Active learning with training decks.',
    keyFeatures: [
      'Sequential content presentation',
      'Memory training cycle',
      'Progress tracking',
      'Navigation and controls',
    ],
  },
  'project-detail': {
    title: 'Topic Details',
    description: 'View and manage a specific topic.',
    keyFeatures: [
      'See all memories in this topic',
      'Edit topic details',
      'Add more memories',
      'Track topic progress',
    ],
  },
  'training-detail': {
    title: 'Training Details',
    description: 'View and manage a specific training.',
    keyFeatures: [
      'See all memories in this training',
      'Generate training decks',
      'Track progress',
      'Edit training details',
    ],
  },
  'memory-detail': {
    title: 'Memory Details',
    description: 'View full memory with all linked content.',
    keyFeatures: [
      'See complete memory content',
      'View AI enrichment data',
      'See linked people, locations, topics',
      'Edit or delete memory',
    ],
  },
  'word-detail': {
    title: 'Word Details',
    description: 'View word definition and related memories.',
    keyFeatures: [
      'See word definition',
      'View memories using this word',
      'Auto-linking to new memories',
      'Edit word details',
    ],
  },
  'question-detail': {
    title: 'Question Details',
    description: 'View question and AI-generated answer.',
    keyFeatures: [
      'See full question and answer',
      'View linked memory',
      'Reminders for spaced repetition',
      'Edit or delete question',
    ],
  },
  'person-detail': {
    title: 'Person Details',
    description: 'View person profile and related memories.',
    keyFeatures: [
      'See contact information',
      'View all memories with this person',
      'See relationships to other people',
      'Edit person details',
    ],
  },
};
