# Hybrid Memory Types Architecture

## Overview

The Memory Connector now implements a **hybrid storage strategy pattern** that allows memory types to store data either generically (JSONB) or in dedicated structured tables. This provides flexibility for both rapid prototyping of new memory types and optimized querying for frequently-accessed structured data.

## Core Concepts

### Storage Strategies

1. **Generic Storage** (`StorageStrategy.generic`)
   - Data stored in `memories.data` as JSONB
   - Flexible schema - no database migrations needed for new types
   - Best for: experimental features, user-defined types, unstructured data
   - Examples: notes, ideas, quotes

2. **Structured Storage** (`StorageStrategy.structured`)
   - Data stored in dedicated table (e.g., `events`, `locations`, `words`, `people`)
   - Type-safe schema with proper indexes
   - Best for: core features, complex queries, relational data
   - Examples: events, locations, people, words

### Memory as Root Entity

In this architecture, `Memory` is the **canonical root entity**:
- All memories exist in the `memories` table regardless of type
- Common fields: `title`, `body`, `occurredAt`, `startAt`, `endAt`, `latitude`, `longitude`
- Structured types extend Memory via 1:1 relationship (foreign key = `memory_id`)

## Database Schema

### Key Tables

#### `memory_types`
Admin-controlled registry of all memory types.

```prisma
model MemoryType {
  code            String          @unique  // e.g., "event", "note"
  label           String                   // Human-readable name
  storageStrategy StorageStrategy          // generic or structured
  tableName       String?                  // e.g., "events", null for generic
  enabled         Boolean
  sortOrder       Int
}
```

#### `memories`
Root entity for all memories.

```prisma
model Memory {
  userId      String
  title       String?
  body        String?
  occurredAt  DateTime?   // When it happened
  startAt     DateTime?   // For events
  endAt       DateTime?   // For events
  data        Json?       // Generic metadata
  latitude    Float?
  longitude   Float?

  // 1:1 relations to structured types
  event       Event?
  location    Location?
  person      Person?
  word        Word?

  // Many-to-many type assignments
  typeAssignments MemoryTypeAssignment[]

  // Memory links
  linksFrom   MemoryLink[] @relation("LinkSource")
  linksTo     MemoryLink[] @relation("LinkTarget")
}
```

#### `memory_type_assignments`
Many-to-many relationship between memories and types (allows multi-typing).

```prisma
model MemoryTypeAssignment {
  memoryId     String
  memoryTypeId String
  confidence   Float?  @default(1.0)  // AI confidence score

  @@id([memoryId, memoryTypeId])
}
```

#### Structured Type Tables

All structured types use `memory_id` as their primary key (1:1 with Memory):

```prisma
model Event {
  memoryId       String    @id
  startAt        DateTime?
  endAt          DateTime?
  timezone       String?
  recurrenceRule String?
  description    String?
  tags           String[]

  memory Memory @relation(fields: [memoryId], references: [id], onDelete: Cascade)
}

model Location {
  memoryId  String  @id
  address   String?
  city      String?
  state     String?
  country   String?
  latitude  Float?
  longitude Float?
  placeType String?

  memory Memory @relation(fields: [memoryId], references: [id], onDelete: Cascade)
}

model Person {
  memoryId    String  @id
  displayName String
  email       String?
  phone       String?
  bio         String?

  memory Memory @relation(fields: [memoryId], references: [id], onDelete: Cascade)
}

model Word {
  memoryId     String  @id
  word         String
  description  String?
  phonetic     String?
  partOfSpeech String?
  etymology    String?
  examples     Json?
  synonyms     Json?
  antonyms     Json?
  difficulty   String?

  memory Memory @relation(fields: [memoryId], references: [id], onDelete: Cascade)
}
```

#### `memory_links`
Typed relationships between memories (replaces old `memory_relationships`).

```prisma
enum LinkType {
  locatedAt    // Memory is located at another memory (location)
  summaryOf    // Memory summarizes another memory
  hasMedia     // Memory has media attachment
  related      // Generic relationship
  mentions     // Memory mentions a person/entity
}

model MemoryLink {
  sourceId  String
  targetId  String
  linkType  LinkType
  metadata  Json?

  source Memory @relation("LinkSource", fields: [sourceId], references: [id])
  target Memory @relation("LinkTarget", fields: [targetId], references: [id])

  @@unique([sourceId, targetId, linkType])
}
```

## Migration from Old Schema

### Breaking Changes

1. **MemoryType fields renamed:**
   - `name` → `label`
   - `slug` → `code`
   - `isActive` → `enabled`
   - Added: `storageStrategy`, `tableName`

2. **Memory fields changed:**
   - `textContent` → split into `title` and `body`
   - Removed direct foreign keys: `typeId`, `wordId`, `eventId`, `locationId`, `entityId`
   - Added: `occurredAt`, `startAt`, `endAt`, `data`

3. **Structured tables restructured:**
   - Events, Locations, Words now use `memory_id` as primary key (no more independent IDs)
   - One event/location/word per memory (1:1 relationship)

4. **Relationships changed:**
   - `memory_relationships` → `memory_links` with typed `LinkType` enum
   - `memory_entities` table removed (replaced by hybrid approach)

### Migration Script

The migration is in: `apps/api/prisma/migrations/20251226000000_hybrid_memory_types/migration.sql`

Key steps:
1. Create new enums (`StorageStrategy`, `LinkType`)
2. Update `memory_types` table structure
3. Add new columns to `memories` table
4. Create `memory_type_assignments` table
5. Create `memory_links` table
6. Restructure `events`, `locations`, `words` tables
7. Create `people` table
8. Migrate existing data
9. Clean up old columns and tables

## Usage Examples

### Creating a Generic Memory (Note)

```typescript
// 1. Create the memory
const memory = await prisma.memory.create({
  data: {
    userId: user.id,
    title: 'Important Thought',
    body: 'Remember to follow up on the project proposal',
    occurredAt: new Date(),
    data: { priority: 'high', tags: ['work', 'todo'] },
  },
});

// 2. Link to memory type
await prisma.memoryTypeAssignment.create({
  data: {
    memoryId: memory.id,
    memoryTypeId: noteType.id,
    confidence: 1.0,
  },
});
```

### Creating a Structured Memory (Event)

```typescript
// 1. Create the root memory
const memory = await prisma.memory.create({
  data: {
    userId: user.id,
    title: 'Team Meeting',
    body: 'Quarterly planning session',
    occurredAt: new Date(),
    startAt: meetingStart,
    endAt: meetingEnd,
  },
});

// 2. Create structured event data
await prisma.event.create({
  data: {
    memoryId: memory.id,
    startAt: meetingStart,
    endAt: meetingEnd,
    timezone: 'America/Los_Angeles',
    description: 'Q1 planning and team alignment',
    tags: ['work', 'planning', 'quarterly'],
  },
});

// 3. Link to event type
await prisma.memoryTypeAssignment.create({
  data: {
    memoryId: memory.id,
    memoryTypeId: eventType.id,
  },
});
```

### Linking Memories

```typescript
// Link event to location
await prisma.memoryLink.create({
  data: {
    sourceId: eventMemory.id,
    targetId: locationMemory.id,
    linkType: 'locatedAt',
    metadata: { notes: 'Meeting at coffee shop' },
  },
});
```

### Querying Polymorphically

```typescript
// Get memory with all possible structured types
const memory = await prisma.memory.findUnique({
  where: { id: memoryId },
  include: {
    typeAssignments: {
      include: {
        memoryType: true,
      },
    },
    event: true,
    location: true,
    person: true,
    word: true,
    linksFrom: {
      include: {
        target: true,
      },
    },
    linksTo: {
      include: {
        source: true,
      },
    },
  },
});

// Check which structured type is present
if (memory.event) {
  console.log('This is an event:', memory.event.description);
} else if (memory.location) {
  console.log('This is a location:', memory.location.address);
} else if (memory.data) {
  console.log('Generic memory data:', memory.data);
}
```

## Admin API Changes

### DTO Updates

**CreateMemoryTypeDto:**
```typescript
{
  code: string;              // was: slug
  label: string;             // was: name
  description?: string;
  icon?: string;
  color?: string;
  storageStrategy?: StorageStrategy;  // NEW
  tableName?: string;                 // NEW
  enabled?: boolean;         // was: isActive
  sortOrder?: number;
}
```

### Endpoints

- `GET /admin/memory-types` - Lists all types with assignment counts
- `POST /admin/memory-types` - Create new type (generic or structured)
- `PUT /admin/memory-types/:id` - Update type metadata
- `DELETE /admin/memory-types/:id` - Soft delete (sets `enabled = false`)

## Benefits of Hybrid Approach

### Flexibility
- Add new generic types without database migrations
- Experiment with user-defined types
- Rapid prototyping of features

### Performance
- Structured types have proper indexes
- Complex queries on core entities remain fast
- Relational integrity for critical data

### Scalability
- Hot path (core features) uses optimized tables
- Long tail (experimental features) uses JSONB
- Easy migration path: generic → structured when usage justifies it

### Developer Experience
- Single source of truth (Memory table)
- Type-safe queries for structured data
- Flexible JSON for exploratory work
- Clear separation of concerns

## Next Steps

1. **Update Services:**
   - MemoriesService: Implement polymorphic loading logic
   - EventsService: Work with new memory_id PK structure
   - LocationsService: Work with new memory_id PK structure
   - WordsService: Work with new memory_id PK structure

2. **Update Frontend:**
   - Admin UI for managing memory types
   - Display storage strategy badges
   - Handle polymorphic memory data

3. **Testing:**
   - Unit tests for each storage strategy
   - Migration tests
   - Integration tests for polymorphic queries

4. **Documentation:**
   - API documentation updates
   - Developer guides for adding new types
   - Best practices for choosing storage strategy

## Rollout Plan

1. ✅ Schema design and migration script created
2. ✅ Seed data updated with examples
3. ✅ Admin endpoints and DTOs updated
4. ⏳ Update backend services
5. ⏳ Update frontend components
6. ⏳ Run migration on development database
7. ⏳ Test all functionality
8. ⏳ Deploy to production

## Troubleshooting

### Migration Issues

**File lock when running `prisma generate`:**
```bash
# Stop the dev server first
# Then run:
cd apps\api
pnpm db:generate
```

**Migration fails with foreign key errors:**
- Ensure no orphaned records exist before migration
- Check that all memories have valid user_id

**Data loss during migration:**
- The migration script preserves all existing data
- Old tables are only dropped after data is migrated to new structure
- Review migration.sql before running

### Service Compatibility

After schema changes, update these files:
- `memories.service.ts` - Update create/findOne methods
- `events.service.ts` - Use memory_id instead of event.id
- `locations.service.ts` - Use memory_id instead of location.id
- `words.service.ts` - Use memory_id instead of word.id
- `admin.controller.ts` - Use new field names (code, label, enabled)
- `create-memory.dto.ts` - Update field names to match new schema

## References

- Original specification: See previous conversation
- Prisma schema: `apps/api/prisma/schema.prisma`
- Migration SQL: `apps/api/prisma/migrations/20251226000000_hybrid_memory_types/migration.sql`
- Seed examples: `apps/api/prisma/seed.ts`
