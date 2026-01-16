# Memory Connector - Features & Entities Guide

This document explains every "thing" in Memory Connector - all the features, entities, and concepts that make up the system.

---

## Core Concepts

### Memories
**What it is**: The fundamental unit of information in Memory Connector. A memory is anything you want to remember - a thought, fact, experience, or piece of information.

**How it works**:
- Create memories by typing or speaking text on the Capture page
- Memories can include images, URLs, videos, and links to other entities
- Each memory gets AI-powered enrichment (categories, tags, sentiment analysis)
- Memories are searchable using semantic search (OpenAI embeddings) or keyword search
- State progression: SAVED → ENRICHING → ENRICHED

**Key features**:
- **Semantic Search**: Find memories by meaning, not just keywords
- **Offline Support**: Create memories even without internet connection
- **Deduplication**: System prevents duplicate memories using content hash
- **Idempotency**: Safe to retry failed submissions without creating duplicates
- **Linking**: Connect memories to people, locations, projects, topics, and more

---

## Memory Enhancement Features

### Reminders
**What it is**: A spaced repetition system (SRS) that helps you remember your memories over time.

**How it works**:
- When you save a memory "with reminders", the system creates 3 reminders
- Default schedule: 1 day, 3 days, 7 days after creation
- Reminders appear in your Reminders inbox when they're due
- You can mark reminders as read or dismiss them
- Due reminder count shown as red badge in navigation

**Types of reminders**:
- **SRS Reminders**: Automatic spaced repetition (3 reminders)
- **Custom Reminders**: Schedule specific dates/times
  - Later Today (6 PM today)
  - Tomorrow (9 AM tomorrow)
  - Specific Date/Time (custom)

**Purpose**: Leverage spaced repetition science to move memories from short-term to long-term memory.

---

### Questions
**What it is**: AI-powered question-answering system for your memories.

**How it works**:
- Click "Ask" button on Capture page (purple button)
- Your memory text is sent to OpenAI (GPT-4o model)
- AI generates a detailed answer based on the memory content
- Answer is saved in the questions table
- Creates 3 SRS reminders automatically
- Question is linked to the original memory

**Use cases**:
- "What are the key points from this meeting?"
- "What should I remember about this person?"
- "What's the main takeaway from this article?"

**Where to view**:
- Questions page: List of all your questions and answers
- Memory detail page: See questions linked to that memory

---

### Words
**What it is**: A vocabulary learning system for definitions, terms, and concepts.

**How it works**:
- Create word/phrase memories with their definitions
- Words are automatically detected in new memories
- When a word is mentioned in a future memory, it auto-links
- Each word can have multiple memories associated with it
- Supports foreign language vocabulary, technical terms, or any definition

**Use cases**:
- Build a personal dictionary
- Learn new languages
- Remember technical jargon
- Define concepts in your own words

---

### Slide Decks (Memory Training)
**What it is**: A spaced repetition training tool that uses your reminders to create active recall sessions.

**How it works**:
1. Select reminders to include in a slide deck
2. System generates slides from those memories
3. View in training mode with 3-phase cycle:
   - **Show phase**: Memory displays for 2 seconds
   - **Recall phase**: Blank screen for 5 seconds with "What did the message read?" prompt
   - **Revealed phase**: Answer shown, click Next to continue

**Controls**:
- Pause/Resume: Stop the timer at any point
- Skip to Answer: Jump directly to revealed phase
- Previous: Go back to any slide
- Next: Only enabled after answer is revealed (prevents skipping training)

**Purpose**: Transform passive review into active recall, proven to strengthen memory retention.

---

## Organization Features

### Topics (formerly Projects)
**What it is**: A way to organize related memories into groups or categories.

**How it works**:
- Create topics with names and descriptions
- Link memories to a topic during creation or later
- View all memories in a topic on the topic detail page
- Edit topic name/description
- Delete topics (doesn't delete the memories)

**Use cases**:
- Group work-related memories by project
- Organize study notes by course
- Track memories about a specific goal or interest
- Create themed collections

**Note**: Backend/API still uses "projects" terminology, but UI shows "Topics" to users.

---

### Trainings
**What it is**: Structured learning programs with memory collections and training decks.

**How it works**:
- Create a training with name and description
- Link memories to the training
- Generate training decks from linked memories
- View training progress and statistics
- Training decks use the same 3-phase memory training cycle as slide decks

**Use cases**:
- Create study courses
- Build training programs
- Organize learning paths
- Track educational progress

**Difference from Topics**: Trainings are specifically designed for active learning and review, while topics are for general organization.

---

## People & Social Features

### People
**What it is**: A contacts system that lets you link memories to specific individuals.

**How it works**:
- Create person profiles with name, email, phone, bio
- Link memories to people during creation
- View all memories associated with a person
- Create relationships between people
- Link images, URLs, videos to people

**Person-First Memory Creation**:
- Click a person, then click "Create Memory with This Person"
- Automatically links that person to the new memory
- Person's name shows in the capture page

**Use cases**:
- Remember conversations with specific people
- Track what you learned from someone
- Build a personal CRM
- Remember names, faces, and details

---

### Relationships
**What it is**: Network graph showing connections between people.

**How it works**:
- Link people together with relationship types
- Types: spouse, parent, colleague, friend, etc.
- View on Relationship Graph page (visual network)
- See relationships on person detail pages

**Use cases**:
- Map your social network
- Remember how people know each other
- Build a personal relationship database

---

## Location & Media Features

### Locations
**What it is**: Geographic places you want to associate with memories.

**How it works**:
- Create locations with name and coordinates
- Link memories to locations during creation
- View all memories from a specific location
- Supports any place: city, building, landmark, etc.

**Use cases**:
- Remember where events happened
- Track travel memories
- Associate learning with places
- Build a memory map

---

### Images
**What it is**: Visual content you can upload and link to memories.

**How it works**:
- Upload images on Capture page or Image Builder
- Automatic compression (reduces file size while maintaining quality)
- Thumbnail generation (256px and 1024px)
- Link images to memories, people, or other entities
- Supports JPG, PNG, GIF formats

**Technical details**:
- Storage: Amazon S3
- Compression: Client-side before upload
- Shows compression stats (e.g., "Reduced by 75%")

---

### URLs
**What it is**: Web pages and links you want to save with your memories.

**How it works**:
- Add URL on Capture page or URL Builder
- System fetches page metadata (title, description, image)
- Saves Open Graph data automatically
- Link URLs to memories or people
- View saved URLs in URL list

**Use cases**:
- Save articles to read/remember
- Link resources to memories
- Build a personal bookmark system
- Track sources of information

---

### YouTube Videos
**What it is**: YouTube content linked to your memories.

**How it works**:
- Paste YouTube URL on Capture page or YouTube Builder
- System extracts video metadata (title, creator, thumbnail)
- Fetches transcript if available
- Link videos to memories or people
- View all saved YouTube videos

**Use cases**:
- Remember educational videos
- Link tutorials to learning memories
- Save lectures and talks
- Build a curated video library

---

### TikTok Videos
**What it is**: TikTok content saved and linked to memories.

**How it works**:
- Paste TikTok URL on Capture page or TikTok Builder
- System extracts video metadata and transcript
- Link videos to memories or people
- View all saved TikTok videos

**Use cases**:
- Save educational TikToks
- Remember short-form content
- Link tips and tricks to memories

---

### Twitter/X Posts
**What it is**: Twitter/X posts saved for reference.

**How it works**:
- Save tweets with full metadata
- Link to memories or people
- View all saved posts
- Preserve content even if original is deleted

**Use cases**:
- Remember important threads
- Save insightful tweets
- Build a personal tweet archive

---

## AI & Intelligence Features

### AI Enrichment
**What it is**: Automatic enhancement of memories using OpenAI.

**How it works**:
- When you create a memory, AI analyzes the content
- Extracts: category, tags, sentiment
- Uses GPT-4o-mini model (cost-efficient)
- Happens in background (doesn't slow down capture)
- Circuit breaker prevents over-spending

**Enrichment fields**:
- **Category**: Main topic (e.g., "Work", "Personal", "Learning")
- **Tags**: Keywords extracted from content
- **Sentiment**: Positive, Neutral, or Negative

---

### Semantic Search
**What it is**: AI-powered search that understands meaning, not just keywords.

**How it works**:
- Each memory gets an embedding vector (OpenAI text-embedding-3-small)
- Vectors stored in PostgreSQL with pgvector extension
- Search finds memories similar in meaning
- Falls back to full-text search if embeddings unavailable
- 16 partitioned tables for performance

**Example**:
- Search "happy moments" finds memories about joy, celebration, good times
- Even if they don't contain the exact words "happy moments"

---

### Voice Input (Whisper)
**What it is**: Speech-to-text transcription for hands-free memory capture.

**How it works**:
- Click microphone icon on Capture page
- Speak your memory (mobile only)
- OpenAI Whisper model transcribes audio to text
- Text appears in capture field
- Can submit feedback to improve transcription

**Use cases**:
- Capture memories while driving
- Quick voice notes
- When typing is inconvenient

---

## System Features

### User Tiers
**What it is**: Usage-based access control system.

**Tiers**:
- **Free**: 10 memories per day, 100/month
- **Premium**: 100 memories per day, unlimited monthly

**Limits tracked**:
- Memory creation
- AI embeddings (100/day free)
- AI classifications (50/day free)
- Daily and monthly counters

---

### Offline Mode
**What it is**: Create memories without internet connection.

**How it works**:
- When offline, memories queue in browser (IndexedDB)
- Max 50 pending memories, 24-hour TTL
- Auto-syncs when connection restored
- Preserves idempotency keys for proper deduplication
- Shows offline status toast

---

### Audit Trail
**What it is**: System-wide logging of all actions (admin only).

**What it logs**:
- User actions (create, update, delete)
- System events (enrichment, sync)
- API calls and responses
- Changes to data

**Purpose**: Debugging, compliance, security monitoring.

---

### Admin Panel
**What it is**: Administrative interface for system management (admin role required).

**Features**:
- View all users
- Manage memory types
- View system metrics
- Monitor AI costs
- Access audit trail
- User management

---

## Advanced Features

### Memory Types
**What it is**: Extensible type system for different memory formats.

**Storage strategies**:
- **Generic**: Data stored in `memories.data` JSONB field
- **Structured**: Dedicated tables (events, locations, people, words)

**Current types**:
- Text, Image, URL, Event, Location, Person, Word, Question
- YouTube Video, TikTok Video, Twitter Post
- Admin can create custom types

---

### Memory Links
**What it is**: Generic relationship system between memories and entities.

**Link types**:
- **locatedAt**: Memory happened at a location
- **summaryOf**: Memory summarizes another memory
- **hasMedia**: Memory has associated media
- **related**: General relationship
- **mentions**: Memory mentions a person/thing

**Example**: A memory about a meeting can be:
- Located at "Office Conference Room"
- Mentions "John Doe" and "Jane Smith"
- Has media: meeting notes PDF
- Related to "Q4 Planning Project"

---

### Spaced Repetition Science
**What it is**: Evidence-based learning technique used throughout the app.

**How it works**:
- Based on Ebbinghaus forgetting curve
- Review at increasing intervals (1 day, 3 days, 7 days)
- Strengthens neural pathways each review
- Moves information from short-term to long-term memory

**Where it's used**:
- Reminders system
- Slide decks
- Training decks
- Questions feature

---

### Idempotency & Deduplication
**What it is**: System safeguards to prevent duplicate memories.

**Idempotency**:
- Each memory creation gets a unique key
- Retrying same request returns cached response
- Prevents accidental duplicates from network issues
- 24-hour window for idempotency

**Deduplication**:
- Content hash (SHA-256) of memory text
- Rejects memories with identical content
- Separate from idempotency (different purposes)

---

## Navigation Structure

### Desktop Navigation
**Primary items** (always visible):
- Capture
- Slides
- Train
- Search

**More menu** (dropdown):
- Topics, Trainings, Words, Questions
- Locations, People, Images, URLs
- YouTube, TikTok, X/Twitter
- Network (Relationships)
- Reminders (with due count badge)
- Settings

### Mobile Navigation
**Bottom nav** (4 items):
- Capture
- Slides
- Train
- Search

**More menu** (bottom sheet):
- All other items from desktop More menu
- Logout

---

## Data Flow Examples

### Creating a Memory with Everything
1. User types memory text
2. Uploads an image
3. Adds a URL
4. Links to a person
5. Selects a topic
6. Clicks "Save with Reminders"

**What happens**:
1. Client generates idempotency key
2. Memory saved to database (SAVED state)
3. Image compressed and uploaded to S3
4. Image linked to memory
5. URL metadata fetched and saved
6. URL page linked to memory
7. Person linked to memory
8. Topic linked to memory
9. 3 SRS reminders created (1d, 3d, 7d)
10. AI enrichment queued (background)
11. Embedding generation queued (background)
12. User redirected to Reminder Schedule page
13. Memory transitions to ENRICHING → ENRICHED

### Searching for a Memory
1. User types search query: "coffee meeting"
2. System generates embedding for query
3. Vector similarity search in PostgreSQL
4. Results ranked by relevance
5. Displayed with highlights and metadata
6. Click result to view full memory

---

## Best Practices

### For Better Memory Retention
- ✅ Use "Save with Reminders" for important information
- ✅ Create slide decks and review regularly
- ✅ Use the "Ask" feature to generate questions
- ✅ Link related memories together
- ✅ Add context (people, locations, topics)

### For Better Organization
- ✅ Create topics for different areas of life
- ✅ Link people to their related memories
- ✅ Use consistent tagging (AI helps with this)
- ✅ Add images and URLs for context
- ✅ Build relationships between entities

### For Better Search
- ✅ Write complete thoughts, not just keywords
- ✅ Include context in your memories
- ✅ Use semantic search for concept-based queries
- ✅ Tag memories with relevant metadata
- ✅ Link related content

---

## Technical Architecture

### Frontend
- **Framework**: React + Vite
- **Routing**: React Router
- **State**: React Query (TanStack Query)
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB (offline queue)
- **Mobile**: Responsive design with haptics

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL 16 with pgvector
- **Cache**: Redis
- **Storage**: Amazon S3
- **AI**: OpenAI API (GPT-4o, Whisper, Embeddings)

### Key Patterns
- **Idempotency**: Request replay protection
- **Circuit Breaker**: AI cost control
- **Partitioning**: 16 embedding partitions
- **Offline-First**: Queue-based sync
- **RBAC**: Role-based access control

---

## Future Roadmap Ideas
*(Not yet implemented, but possible directions)*

- Mobile apps (iOS/Android)
- Browser extensions
- Email integration
- Calendar integration
- More AI models and providers
- Collaborative features
- Public memory sharing
- Import from other note apps
- Export to various formats
- Advanced analytics and insights

---

## Getting Help

- **Code**: See `CLAUDE.md` for development guide
- **Deployment**: See `Docs/GODADDY_DEPLOYMENT_GUIDE.md`
- **Architecture**: See `Docs/FINAL_MVP_STATUS.md`
- **Issues**: Report at https://github.com/anthropics/claude-code/issues

---

**Last Updated**: January 15, 2026
