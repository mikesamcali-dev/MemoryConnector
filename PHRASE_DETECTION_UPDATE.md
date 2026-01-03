# Phrase Detection Update

## Summary
Updated the word detection system to properly recognize and extract multi-word phrases and idioms like "red herring", "wild goose chase", etc.

## Changes Made

### 1. Enhanced AI Extraction Prompt
**File**: `apps/api/src/enrichment/llm-extraction.service.ts`

Updated the prompt to explicitly instruct the AI to:
- Extract common idioms as complete phrases: "red herring", "wild goose chase"
- Extract technical terms: "quantum entanglement", "machine learning"
- Extract proper nouns: "Detroit Tigers", "New York Times"
- Extract compound concepts: "supply chain", "climate change"

**Key Instruction**: "If you see 'red herring', extract it as ['red herring'] (NOT as ['red', 'herring'])"

### 2. Phrase Preservation in Singularization
**File**: `apps/api/src/enrichment/llm-extraction.service.ts` (line 159-167)

Added a list of common phrases that should NOT be singularized:
```typescript
const preservedPhrases = [
  'red herring', 'wild goose chase', 'piece of cake',
  'elephant in the room', 'silver lining',
  'united states', 'social media', 'climate change',
  'machine learning', 'artificial intelligence',
  // ... and more
];
```

### 3. Database Schema
**File**: `apps/api/prisma/schema.prisma` (line 399)

The Word model already supports phrases:
- `word String @unique @db.VarChar(100)` - allows up to 100 characters
- No constraint preventing spaces
- Unique constraint ensures each phrase is stored once

## How It Works

1. **User types text**: "That was a complete red herring in the investigation"
2. **AI extraction**: Detects "red herring" as a complete phrase
3. **Singularization**: Preserves "red herring" (doesn't break it apart)
4. **Database storage**: Stores "red herring" as a single word entry
5. **Word lookup**: When displaying, shows definition for "red herring" as a phrase

## Testing

To test phrase detection:

1. Go to Capture page and enter text with a common phrase:
   ```
   "The meeting was a wild goose chase. It turned out to be a red herring."
   ```

2. Click "Find Words" button

3. The system should detect:
   - "wild goose chase" (as a complete phrase)
   - "red herring" (as a complete phrase)
   - NOT break them into individual words

4. Link the words to your memory

5. View the memory detail page - you should see the phrases with their definitions

## Supported Phrase Types

- **Idioms**: "red herring", "wild goose chase", "piece of cake"
- **Technical terms**: "machine learning", "quantum computing", "artificial intelligence"
- **Proper nouns**: "United States", "United Nations", "Detroit Tigers"
- **Compound concepts**: "social media", "climate change", "supply chain"
- **Latin phrases**: "status quo", "modus operandi", "per se"

## Notes

- Phrases are case-insensitive when checking against the preserved list
- The AI is instructed to prioritize extracting well-known phrases as complete units
- Common 2-4 word phrases are supported
- Single words are still extracted normally alongside phrases
