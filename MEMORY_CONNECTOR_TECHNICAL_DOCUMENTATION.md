# Memory Connector - Technical Documentation
## System Overview, Architecture, and User Interface

**Version:** 1.0.0-MVP  
**Last Updated:** December 2024  
**Document Type:** Technical Specification

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [What the Application Does](#what-the-application-does)
4. [User Interface Design](#user-interface-design)
5. [Technical Implementation Details](#technical-implementation-details)
6. [Data Flow and Processing](#data-flow-and-processing)
7. [API Architecture](#api-architecture)
8. [Database Schema](#database-schema)
9. [Frontend Architecture](#frontend-architecture)
10. [Backend Architecture](#backend-architecture)

---

## Executive Summary

Memory Connector is a full-stack web application designed as a personal memory management system. It enables users to capture, organize, search, and recall information using AI-powered semantic search capabilities. The system is built with a modern technology stack emphasizing offline-first functionality, cost-effective AI integration, and production-grade reliability.

### Core Functionality

The application serves as an intelligent note-taking and memory management platform that:

- **Captures** user memories in multiple formats (text, images, URLs, videos)
- **Enriches** memories automatically using AI for categorization and tagging
- **Searches** memories using natural language queries with semantic understanding
- **Organizes** memories through automatic classification and relationship mapping
- **Reminds** users of important memories that need follow-up
- **Works Offline** with automatic synchronization when connectivity is restored

### Technology Foundation

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: NestJS (Node.js) + TypeScript + Prisma ORM
- **Database**: PostgreSQL 16 with pgvector extension for vector search
- **Cache**: Redis for session management and circuit breaker state
- **AI Services**: OpenAI API for embeddings and classification
- **Offline Storage**: IndexedDB for browser-based queue management

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser (React)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Pages   │  │  Components  │  │   Hooks &    │      │
│  │              │  │              │  │   Services   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌────────────────────────────────────────────────────┐    │
│  │         IndexedDB (Offline Queue)                  │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST + JWT
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              NestJS API Server (Backend)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │   Services   │  │   Guards &   │      │
│  │              │  │              │  │  Interceptors  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Background Worker (Enrichment Queue)         │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────┬───────────────────────────┬─────────────────┘
                │                           │
        ┌───────▼────────┐          ┌───────▼────────┐
        │  PostgreSQL    │          │     Redis      │
        │  + pgvector    │          │   Cache/Queue   │
        └───────┬────────┘          └────────────────┘
                │
        ┌───────▼────────┐
        │   OpenAI API    │
        │  (Embeddings)   │
        └─────────────────┘
```

### Monorepo Structure

```
memory-connector/
├── apps/
│   ├── api/              # NestJS backend application
│   │   ├── src/
│   │   │   ├── auth/      # Authentication module
│   │   │   ├── memories/  # Memory CRUD operations
│   │   │   ├── search/    # Search functionality
│   │   │   ├── enrichment/# AI enrichment worker
│   │   │   ├── reminders/ # Reminder system
│   │   │   └── ...
│   │   └── prisma/        # Database schema and migrations
│   └── web/               # React frontend application
│       └── src/
│           ├── pages/     # Route pages
│           ├── components/# Reusable UI components
│           ├── hooks/     # Custom React hooks
│           ├── contexts/  # React context providers
│           └── api/       # API client functions
├── packages/
│   ├── shared/            # Shared TypeScript types
│   └── eslint-config/     # Shared linting configuration
└── infra/
    └── compose/            # Docker Compose files
```

---

## What the Application Does

### Primary Use Cases

#### 1. Memory Capture
Users can create memories through multiple interfaces:

- **Text Capture**: Primary interface for entering thoughts, notes, and information
- **Image Upload**: Attach images to memories with automatic linking
- **URL Capture**: Save web pages with automatic content extraction
- **Video Integration**: Link YouTube and TikTok videos to memories
- **Location Tagging**: Associate memories with geographic locations
- **Person Linking**: Connect memories to people in the user's network

#### 2. AI-Powered Enrichment
Automatic processing of captured memories:

- **Semantic Embeddings**: Generates 1536-dimensional vectors for semantic search
- **Content Classification**: Categorizes memories (note, event, location, person, etc.)
- **Tag Extraction**: Automatically identifies and extracts relevant tags
- **Sentiment Analysis**: Determines emotional context of memories
- **Entity Detection**: Identifies people, locations, and other entities mentioned
- **Spell Checking**: Detects and highlights spelling errors in real-time

#### 3. Intelligent Search
Natural language search capabilities:

- **Semantic Search**: Uses vector similarity to find contextually relevant memories
- **Keyword Fallback**: Falls back to PostgreSQL full-text search when AI unavailable
- **Hybrid Ranking**: Combines semantic and keyword results using RRF algorithm
- **Filtering**: Filter by category, date range, memory type, and relationships
- **Pagination**: Efficient handling of large result sets

#### 4. Memory Organization
Structured memory management:

- **Memory Types**: Supports multiple memory types (note, event, location, person, word, etc.)
- **Relationship Mapping**: Links memories together (located at, mentions, related to, etc.)
- **Slide Decks**: Organizes memories into presentation-style slide decks
- **Network Graph**: Visualizes relationships between people and memories
- **Location-Based Views**: Groups memories by geographic location

#### 5. Reminder System
Intelligent follow-up management:

- **Automatic Detection**: AI identifies memories that need follow-up
- **Reminder Inbox**: Centralized location for all reminders
- **Status Management**: Mark as read, dismiss, or reschedule reminders
- **Memory Linking**: Reminders connect directly to source memories

#### 6. Offline Functionality
Offline-first architecture:

- **Offline Capture**: Save memories without internet connection
- **Queue Management**: Stores up to 50 memories in IndexedDB
- **Automatic Sync**: Background synchronization when online
- **Conflict Resolution**: Handles sync conflicts intelligently
- **Status Indicators**: Visual feedback for sync status

---

## User Interface Design

### Design Philosophy

The application follows a **mobile-first, responsive design** approach with:

- **Clean, Minimal Interface**: Focus on content with minimal distractions
- **Consistent Navigation**: Predictable navigation patterns across all pages
- **Touch-Friendly**: Large tap targets (minimum 44px) for mobile devices
- **Progressive Disclosure**: Advanced features available but not overwhelming
- **Visual Feedback**: Clear indicators for loading, success, and error states

### Color Scheme and Styling

- **Primary Color**: Blue (#2563eb) for primary actions and branding
- **Background**: Light gray (#f9fafb) for main content areas
- **Text**: Dark gray (#111827) for primary text, medium gray (#6b7280) for secondary
- **Accents**: Green for success, red for errors, yellow for warnings
- **Framework**: Tailwind CSS for utility-first styling

### Layout Structure

#### Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│  Top Navigation Bar (Sticky)                            │
│  [Logo] [Nav Items] [User Email] [Tier Badge] [Logout] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Main Content Area (max-width: 7xl, centered)          │
│  ┌────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  Page Content                                   │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Footer (Copyright, Links)                               │
└─────────────────────────────────────────────────────────┘
```

#### Mobile Layout

```
┌─────────────────────────┐
│  Mobile Header          │
│  [Logo] [Menu]         │
├─────────────────────────┤
│                         │
│  Main Content           │
│  (Full width, padded)   │
│                         │
│                         │
│                         │
│                         │
├─────────────────────────┤
│  Bottom Navigation      │
│  [Capture] [Search]    │
│  [Reminders] [More]     │
└─────────────────────────┘
```

### Navigation Structure

#### Primary Navigation Items (Desktop & Mobile)

1. **Capture** (`/app/capture`) - Main memory creation interface
2. **Search** (`/app/search`) - Search and browse memories
3. **Slide Decks** (`/app/slidedecks`) - View and manage slide presentations
4. **Locations** (`/app/locations`) - Location-based memory organization
5. **People** (`/app/people`) - People management and relationships
6. **Images** (`/app/images`) - Image gallery and management
7. **URLs** (`/app/urls`) - Saved web pages
8. **YouTube** (`/app/youtube-videos`) - YouTube video collection
9. **TikTok** (`/app/tiktok-videos`) - TikTok video collection
10. **Network** (`/app/relationships`) - Relationship graph visualization
11. **Reminders** (`/app/reminders`) - Reminder inbox
12. **Settings** (`/app/settings`) - User preferences and account settings
13. **Admin** (`/app/admin`) - Admin dashboard (admin users only)

#### Mobile Navigation

- **Bottom Navigation Bar**: Always visible, contains 4 primary actions
  - Capture (Plus icon)
  - Search (Search icon)
  - Reminders (Bell icon)
  - Settings (Settings icon)
- **More Menu**: Bottom sheet that slides up with additional navigation items

### Page Descriptions

#### 1. Home Page (`/`)
- **Purpose**: Landing page for unauthenticated users
- **Features**: Product introduction, login/signup links
- **Layout**: Centered content with call-to-action buttons

#### 2. Login Page (`/login`)
- **Purpose**: User authentication
- **Features**: 
  - Email and password input fields
  - "Forgot Password" link
  - "Sign Up" link for new users
  - Form validation with error messages
- **Layout**: Centered card with form inputs

#### 3. Capture Page (`/app/capture`)
- **Purpose**: Primary memory creation interface
- **Features**:
  - Large text input area for memory content
  - Real-time text analysis (debounced 1 second)
  - Entity detection (people, locations, videos, words)
  - Spell checking with inline indicators
  - Image upload with preview
  - URL input with automatic page extraction
  - Date/time picker for memory timestamp
  - Location picker with map integration
  - Entity suggestions modal
  - Draft auto-save to localStorage
- **Layout**: 
  - Mobile: Full-width form with stacked inputs
  - Desktop: Centered form with max-width constraint
- **Visual Elements**:
  - Text area with character counter
  - Image preview thumbnails
  - Entity chips showing detected/linked entities
  - Spell check indicators (red underlines)
  - Loading states for analysis and submission

#### 4. Search Page (`/app/search`)
- **Purpose**: Search and browse memories
- **Features**:
  - Search input with debounced queries
  - Recent memories display when no search active
  - Search results with relevance ranking
  - Filter panel (mobile: bottom sheet, desktop: sidebar)
  - Sort options (relevance, date)
  - Pagination controls
  - Degraded mode indicator (when using keyword search)
  - Pull-to-refresh on mobile
- **Layout**:
  - Mobile: Full-width search bar, stacked results
  - Desktop: Search bar with filters sidebar
- **Visual Elements**:
  - Memory cards with title, preview, date, and metadata
  - Relevance scores (when available)
  - Category badges
  - Loading skeletons during search
  - Empty state when no results

#### 5. Memory Detail Page (`/app/memories/:id`)
- **Purpose**: View and edit individual memories
- **Features**:
  - Full memory content display
  - Edit mode with inline editing
  - Linked entities display (people, locations, videos)
  - Relationship links (related memories)
  - Image gallery
  - Metadata display (created date, enrichment status)
  - Delete functionality
  - Link to other memories
- **Layout**: Centered content with sidebar for metadata
- **Visual Elements**:
  - Rich text display
  - Image galleries with lightbox
  - Entity chips with links
  - Relationship graph preview

#### 6. Reminders Page (`/app/reminders`)
- **Purpose**: Manage reminders and follow-ups
- **Features**:
  - List of all reminders
  - Unread count badge
  - Mark as read/dismiss actions
  - Filter by status (pending, read, dismissed)
  - Link to source memory
  - Empty state when no reminders
- **Layout**: List view with reminder cards
- **Visual Elements**:
  - Reminder cards with memory preview
  - Status indicators (pending, read)
  - Action buttons (mark read, dismiss)
  - Unread badge in navigation

#### 7. Settings Page (`/app/settings`)
- **Purpose**: User preferences and account management
- **Features**:
  - User profile information
  - Tier display and upgrade option
  - Usage statistics (daily/monthly limits)
  - Preferences (reminders, notifications)
  - Account actions (logout, delete account)
- **Layout**: Form-based with sections
- **Visual Elements**:
  - Usage progress bars
  - Tier badge
  - Form inputs with labels

#### 8. Relationship Graph Page (`/app/relationships`)
- **Purpose**: Visualize connections between people and memories
- **Features**:
  - Interactive network graph
  - Node-based visualization (people, memories)
  - Edge connections (relationships)
  - Zoom and pan controls
  - Node selection for details
- **Layout**: Full-screen canvas
- **Visual Elements**:
  - Graph nodes (circles for people, squares for memories)
  - Connecting lines (edges)
  - Color-coded relationship types
  - Interactive controls

### Component Library

#### Reusable Components

1. **AppLayout**: Main application wrapper with navigation
   - Desktop: Top navigation bar with logo and menu items
   - Mobile: Bottom navigation with "More" menu
   - Responsive breakpoint detection

2. **ProtectedRoute**: Route guard for authentication
   - Redirects to login if not authenticated
   - Supports admin-only routes

3. **SyncToast**: Offline status indicator
   - Shows sync status (online, offline, syncing)
   - Displays queued items count
   - Auto-dismisses on sync completion

4. **EntitySuggestionsModal**: Entity linking interface
   - Shows detected entities (people, locations, videos)
   - Allows linking/unlinking entities
   - Search functionality for existing entities

5. **ConflictResolutionModal**: Sync conflict handler
   - Displays conflict details
   - Options to keep local, use server, or merge
   - Clear error messages

6. **SpellCheckIndicator**: Real-time spell checking
   - Highlights misspelled words
   - Suggests corrections
   - Click to apply fixes

7. **BottomSheet**: Mobile menu component
   - Slides up from bottom
   - Backdrop overlay
   - Smooth animations

8. **BottomNav**: Mobile bottom navigation
   - Fixed position at bottom
   - Icon-based navigation
   - Active state indicators

### Responsive Design

#### Breakpoints

- **Mobile**: < 768px (default, mobile-first)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

#### Mobile-Specific Features

- **Touch Targets**: Minimum 44px height/width
- **Pull-to-Refresh**: Swipe down to refresh content
- **Bottom Navigation**: Always accessible navigation
- **Bottom Sheets**: Native-feeling modals
- **Safe Area Insets**: Respects device notches and home indicators

#### Desktop-Specific Features

- **Top Navigation**: Horizontal navigation bar
- **Sidebar Filters**: Persistent filter panels
- **Hover States**: Interactive hover effects
- **Keyboard Navigation**: Full keyboard accessibility

---

## Technical Implementation Details

### Frontend Architecture

#### Technology Stack

- **React 18**: UI library with hooks and context API
- **TypeScript 5.3+**: Type-safe development
- **Vite 5.0+**: Fast build tool and dev server
- **React Router v6**: Client-side routing
- **TanStack Query (React Query)**: Server state management
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **idb**: IndexedDB wrapper

#### State Management

1. **React Context API**: Global state (authentication, offline sync)
2. **React Query**: Server state caching and synchronization
3. **Local State**: Component-level state with useState
4. **IndexedDB**: Offline queue persistence
5. **localStorage**: Draft storage and preferences

#### Code Organization

```
apps/web/src/
├── pages/              # Route-level page components
│   ├── LoginPage.tsx
│   ├── CapturePage.tsx
│   ├── SearchPage.tsx
│   └── ...
├── components/         # Reusable UI components
│   ├── AppLayout.tsx
│   ├── ProtectedRoute.tsx
│   ├── SyncToast.tsx
│   └── mobile/          # Mobile-specific components
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useOfflineSync.ts
│   ├── useIsMobile.ts
│   └── useDebounce.ts
├── contexts/           # React context providers
│   └── AuthContext.tsx
├── api/                # API client functions
│   ├── client.ts       # HTTP client with auth
│   ├── memories.ts
│   ├── search.ts
│   └── ...
├── services/           # Business logic services
│   └── offline-queue.ts
└── utils/              # Utility functions
    ├── idempotency.ts
    └── graphTransform.ts
```

#### Performance Optimizations

1. **Code Splitting**: Lazy loading of route components
2. **Bundle Optimization**: 75% reduction in initial bundle size
3. **Query Caching**: React Query for intelligent caching
4. **Debouncing**: Input debouncing for search and analysis
5. **Optimistic Updates**: Immediate UI feedback
6. **Virtual Scrolling**: For large lists (future enhancement)

### Backend Architecture

#### Technology Stack

- **NestJS 10.3+**: Enterprise Node.js framework
- **TypeScript 5.3+**: Type-safe backend development
- **Prisma 5.8+**: Type-safe ORM
- **PostgreSQL 16**: Primary database
- **pgvector**: Vector similarity search extension
- **Redis 7+**: Caching and session storage
- **OpenAI API**: AI embeddings and classification
- **JWT**: Authentication tokens
- **Argon2**: Password hashing

#### Module Structure

```
apps/api/src/
├── auth/               # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/
│   └── strategies/
├── memories/           # Memory CRUD operations
│   ├── memories.controller.ts
│   ├── memories.service.ts
│   └── dto/
├── search/             # Search functionality
│   ├── search.controller.ts
│   └── search.service.ts
├── enrichment/        # AI enrichment worker
│   ├── enrichment.service.ts
│   └── enrichment.worker.ts
├── embeddings/         # Vector generation
├── reminders/        # Reminder system
├── usage/              # Usage tracking
├── idempotency/        # Request deduplication
├── ai-circuit-breaker/ # Cost management
└── common/            # Shared utilities
```

#### Key Patterns

1. **Dependency Injection**: NestJS built-in DI container
2. **Guards**: Authentication and authorization
3. **Interceptors**: Idempotency, logging, transformation
4. **Pipes**: Validation and data transformation
5. **Filters**: Global exception handling
6. **Background Workers**: Async processing for enrichment

---

## Data Flow and Processing

### Memory Creation Flow

```
User Input → Frontend Validation → Idempotency Key Generation
    ↓
IndexedDB Queue (if offline) OR Direct API Call
    ↓
Backend: Idempotency Check → Usage Limit Check → Duplicate Detection
    ↓
Database: Memory Saved → Usage Counter Incremented
    ↓
Enrichment Queue (if budget allows)
    ↓
Background Worker: Generate Embedding → Classify → Update Memory
    ↓
Frontend: Display Success → Update UI
```

### Search Flow

```
User Query → Debounce (500ms) → API Request
    ↓
Backend: Generate Query Embedding (if AI available)
    ↓
Database: Vector Similarity Search (pgvector) OR Full-Text Search (FTS)
    ↓
Hybrid Ranking: Combine Results (RRF Algorithm)
    ↓
Apply Filters → Paginate → Return Results
    ↓
Frontend: Display Results with Relevance Scores
```

### Offline Sync Flow

```
Offline Memory Save → IndexedDB Queue
    ↓
Connection Restored → Background Sync Triggered
    ↓
For Each Queued Item:
    - Retrieve Original Idempotency Key
    - POST to API with Same Key
    - Handle Response:
      * Success → Remove from Queue
      * Duplicate → Remove with Warning
      * Limit Exceeded → Remove with Error
      * Other Error → Keep in Queue for Retry
    ↓
Update Sync Status Toast
```

### AI Enrichment Flow

```
Memory Created → Enrichment Queue Entry
    ↓
Background Worker (5s polling):
    - Check Circuit Breaker State
    - Check Per-User Limits
    - Fetch Next Pending Memory
    ↓
OpenAI API:
    - Generate Embedding (text-embedding-3-small)
    - Classify Content (GPT-3.5-turbo)
    ↓
Database:
    - Save Embedding to Partition (user_id % 16)
    - Update Memory State (ENRICHED)
    - Track Costs
    ↓
Check Budget Thresholds → Update Circuit Breaker if Needed
```

---

## API Architecture

### RESTful API Design

Base URL: `/api/v1`

#### Authentication Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login (returns JWT)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (revokes refresh token)

#### Memory Endpoints

- `GET /memories` - List memories (paginated)
- `POST /memories` - Create memory (requires Idempotency-Key header)
- `GET /memories/:id` - Get memory details
- `PATCH /memories/:id` - Update memory
- `DELETE /memories/:id` - Delete memory
- `POST /memories/analyze` - Analyze text for entities

#### Search Endpoints

- `POST /search` - Semantic/keyword search
  - Query parameters: `query`, `category`, `dateFrom`, `dateTo`, `page`, `limit`

#### Reminder Endpoints

- `GET /reminders` - List reminders
- `PATCH /reminders/:id/read` - Mark reminder as read
- `DELETE /reminders/:id` - Dismiss reminder

#### Admin Endpoints (Admin Only)

- `GET /admin/stats` - System statistics
- `GET /admin/costs` - AI cost tracking
- `GET /admin/circuit-breaker` - Circuit breaker status

### Request/Response Format

#### Request Headers

```
Authorization: Bearer <access_token>
Idempotency-Key: <uuid> (required for POST/PATCH/DELETE)
Content-Type: application/json
```

#### Response Format

```typescript
{
  data: T,              // Response data
  meta?: {               // Metadata (pagination, etc.)
    page: number,
    limit: number,
    total: number
  },
  error?: {              // Error details (if applicable)
    code: string,
    message: string,
    details?: any
  }
}
```

### Error Handling

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions or rate limit exceeded
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate content detected
- **422 Unprocessable Entity**: Idempotency key mismatch
- **500 Internal Server Error**: Server error

---

## Database Schema

### Core Tables

#### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  tier VARCHAR DEFAULT 'free',
  roles TEXT[] DEFAULT ARRAY['user'],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### Memories Table
```sql
memories (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  body TEXT NOT NULL,
  content_hash VARCHAR(64) UNIQUE,  -- SHA-256 for duplicate detection
  state VARCHAR DEFAULT 'SAVED',    -- SAVED, ENRICHING, ENRICHED
  occurred_at TIMESTAMP,
  latitude DECIMAL,
  longitude DECIMAL,
  data JSONB,                       -- Flexible metadata
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### Embeddings Tables (16 Partitions)
```sql
embeddings_partition_0 ... embeddings_partition_15 (
  id UUID PRIMARY KEY,
  memory_id UUID REFERENCES memories(id),
  user_id UUID REFERENCES users(id),
  vector vector(1536),              -- pgvector type
  model VARCHAR DEFAULT 'text-embedding-3-small',
  cost_cents INTEGER,
  created_at TIMESTAMP
)
-- HNSW index on vector column for fast similarity search
```

#### Reminders Table
```sql
reminders (
  id UUID PRIMARY KEY,
  memory_id UUID REFERENCES memories(id),
  user_id UUID REFERENCES users(id),
  schedule_for TIMESTAMP,
  status VARCHAR DEFAULT 'pending',  -- pending, sent, cancelled
  message TEXT,
  created_at TIMESTAMP
)
```

#### User Usage Table
```sql
user_usage (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  memories_today INTEGER DEFAULT 0,
  memories_this_month INTEGER DEFAULT 0,
  searches_today INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  last_daily_reset DATE,
  last_monthly_reset DATE
)
```

### Indexes

- **Full-Text Search**: GIN index on `text_search_vector` (tsvector)
- **Vector Search**: HNSW indexes on each embedding partition
- **User Queries**: Indexes on `user_id`, `created_at`, `state`
- **Usage Tracking**: Composite indexes on `user_id + date`

---

## Frontend Architecture

### Component Hierarchy

```
App
├── AuthProvider (Context)
├── BrowserRouter
│   ├── Routes
│   │   ├── HomePage (Public)
│   │   ├── LoginPage (Public)
│   │   └── ProtectedRoute
│   │       └── AppLayout
│   │           ├── TopNav (Desktop) / BottomNav (Mobile)
│   │           └── Page Components
│   │               ├── CapturePage
│   │               ├── SearchPage
│   │               ├── RemindersPage
│   │               └── ...
│   └── OfflineStatusToast
└── Suspense Boundaries (Lazy Loading)
```

### Custom Hooks

1. **useAuth**: Authentication state and methods
2. **useOfflineSync**: Offline queue management
3. **useIsMobile**: Responsive breakpoint detection
4. **useDebounce**: Input debouncing utility
5. **usePullToRefresh**: Mobile pull-to-refresh gesture

### API Client

Centralized HTTP client with:
- Automatic token refresh
- Request/response interceptors
- Error handling
- Offline detection
- Idempotency key generation

---

## Backend Architecture

### NestJS Module System

Each feature is organized as a module:

```typescript
@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [MemoriesController],
  providers: [MemoriesService, DuplicateDetectionService],
  exports: [MemoriesService]
})
export class MemoriesModule {}
```

### Guards and Interceptors

- **AuthGuard**: Validates JWT tokens
- **RolesGuard**: Checks user roles (admin, user)
- **UsageLimitGuard**: Enforces tier-based limits
- **IdempotencyInterceptor**: Prevents duplicate requests
- **LoggingInterceptor**: Request/response logging

### Background Workers

Enrichment worker runs as separate process:
- Polls queue every 5 seconds
- Processes memories in order
- Respects circuit breaker state
- Tracks costs and limits

---

## Conclusion

Memory Connector is a sophisticated, production-ready application that combines modern web technologies with AI capabilities to create an intelligent memory management system. The architecture emphasizes:

- **Offline-First**: Works without internet connection
- **Cost-Conscious**: Advanced budget management for AI operations
- **Scalable**: Designed to handle 10,000+ concurrent users
- **Maintainable**: Clean codebase with comprehensive documentation
- **User-Friendly**: Intuitive interface with responsive design

The system is ready for production deployment and can be extended with additional features as needed.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Production-Ready MVP
