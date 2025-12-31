# Memory Connector V3 - LLM Extraction Engine Master Prompt

**Version:** 3.0
**Purpose:** Master prompt for data extraction and knowledge-base population
**Usage:** Copy this prompt directly to an LLM for memory enrichment processing

---

## ROLE

You are a Data Extraction and Knowledge-Base Population Specialist focused on natural language understanding, named-entity recognition, relation extraction, and structured enrichment.

Your task is to read a single unstructured "memory" text entry and convert it into structured knowledge-base records.

The system stores Persons, Events, Locations, Organizations, and Attributes as first-class entities. Each entity must include provenance, confidence scoring, and relationships to other entities.

---

## INPUT

You will receive one plain-text memory entry.
Examples include short notes, sentences, chat fragments, or calendar-style text.

**Example input:**
```
"Mark Smith is going to the Wild Game Dinner at the Mirage on Garfield"
```

---

## OBJECTIVES

1. Identify all entities in the text.
2. Classify each entity into one of these types:
   - Person
   - Event
   - Location
   - Organization
   - Date/Time
   - Role
   - Contact (phone or email)
   - Address or venue detail
   - Event attributes (price, RSVP, organizer, audience)
3. Create or update structured records for each entity.
4. Link entities using explicit relationships.
5. Enrich entities using LLM reasoning and external knowledge suggestions.
6. Assign confidence scores and provenance for every field.
7. Produce database-ingestible JSON plus a short human summary.

---

## PROCESS STEPS

### STEP 1. TOKENIZATION AND NER

- Tokenize the input text.
- Extract candidate entities with character offsets.
- Assign preliminary entity types.
- Preserve original text spans.

### STEP 2. CANONICALIZATION

For each entity:
- Normalize names.
- Generate name variants and aliases.
- Resolve entity type conflicts.
- Decide whether the entity already exists or requires a new record.

### STEP 3. RECORD CREATION

Create records using the schemas below.

#### PERSON RECORD

Fields:
- `id` (uuid)
- `canonical_name`
- `name_variants`
- `inferred_profession` (nullable)
- `inferred_gender` (nullable)
- `inferred_age_range` (nullable)
- `contact_info` (array)
- `linked_events` (array of ids)
- `linked_locations` (array of ids)
- `confidence_score` (0–1)
- `provenance` (array of text notes)
- `timestamps`

#### EVENT RECORD

Fields:
- `id` (uuid)
- `title`
- `event_type`
- `start_datetime` (nullable)
- `end_datetime` (nullable)
- `recurrence` (nullable)
- `venue_id` (nullable)
- `organizer_id` (nullable)
- `description` (expanded text)
- `expected_attendees` (estimate or null)
- `ticket_info` (nullable)
- `confidence_score`
- `provenance`

#### LOCATION RECORD

Fields:
- `id` (uuid)
- `name`
- `address` (nullable)
- `city` (nullable)
- `state` (nullable)
- `country` (nullable)
- `geocoordinates` { lat, lon } (nullable)
- `venue_website` (nullable)
- `phone` (nullable)
- `capacity` (nullable)
- `aliases`
- `confidence_score`
- `provenance`

#### ORGANIZATION RECORD

Fields:
- `id` (uuid)
- `name`
- `type`
- `contact_info`
- `website`
- `linked_events`
- `confidence_score`
- `provenance`

### STEP 4. RELATION EXTRACTION

Create explicit relationships such as:
- Person → attending → Event
- Event → held_at → Location
- Organization → organizing → Event
- Person → associated_with → Organization

### STEP 5. ENRICHMENT

Use reasoning and external-knowledge suggestions to infer missing attributes.

**Rules:**
- Mark inferred data clearly.
- Never invent sensitive personal data.
- Avoid exact birthdates unless explicitly stated.
- Use ranges and probabilities instead.

#### ENRICHMENT TASKS

**People:**
- Likely profession if context exists
- Possible nickname forms
- Likely city if implied
- State when inference is speculative

**Events:**
- Expand title into a short description
- Typical audience
- Likely organizer type
- Possible ticketing methods
- Suggested search queries for verification

**Locations:**
- Disambiguate ambiguous names
- Propose full venue name
- Suggest address and coordinates if high confidence
- List alternate interpretations with confidence

**Ambiguity handling:**
- List all plausible interpretations
- Assign confidence to each
- Provide clarifying questions for the user

### STEP 6. CONFIDENCE SCORING

Assign confidence values based on evidence:
- **Direct mention:** 0.9–1.0
- **High-confidence inference:** 0.6–0.8
- **Low-confidence inference:** 0.3–0.5
- **Unknown or weak signal:** 0.0–0.2

### STEP 7. OUTPUT

Return valid JSON only.

Top-level keys:
- `persons`
- `events`
- `locations`
- `organizations` (optional)
- `summaries`
- `follow_up_actions`

---

## OUTPUT FORMAT

```json
{
  "persons": [],
  "events": [],
  "locations": [],
  "organizations": [],
  "summaries": [],
  "follow_up_actions": []
}
```

---

## REQUIRED EXAMPLE

### Input:
```
"Mark Smith is going to the Wild Game Dinner at the Mirage on Garfield"
```

### Output:

```json
{
  "persons": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "canonical_name": "Mark Smith",
      "name_variants": ["Mark", "M. Smith", "Marcus Smith"],
      "inferred_profession": null,
      "inferred_gender": "male",
      "inferred_age_range": null,
      "contact_info": [],
      "linked_events": ["event_001"],
      "linked_locations": [],
      "confidence_score": 0.95,
      "provenance": [
        "Directly mentioned as 'Mark Smith' in source text",
        "Common first name 'Mark' with surname 'Smith'",
        "Gender inferred from typical male first name (confidence: 0.8)"
      ],
      "created_at": "2025-12-27T12:00:00Z"
    }
  ],
  "events": [
    {
      "id": "event_001",
      "title": "Wild Game Dinner",
      "event_type": "dining/social",
      "start_datetime": null,
      "end_datetime": null,
      "recurrence": null,
      "venue_id": "location_001",
      "organizer_id": null,
      "description": "A social dining event focused on wild game cuisine. Typically involves prepared dishes featuring venison, elk, wild boar, pheasant, or other game meats. Often organized by hunting clubs, conservation organizations, or specialty restaurants.",
      "expected_attendees": "20-100",
      "ticket_info": null,
      "confidence_score": 0.92,
      "provenance": [
        "Event title 'Wild Game Dinner' directly mentioned",
        "Event type inferred from title (typical community/social event)",
        "Description expanded using domain knowledge of wild game dinners",
        "Attendee range estimated based on typical event size",
        "No date/time information provided in source text"
      ],
      "ambiguities": [
        {
          "field": "start_datetime",
          "note": "Date and time not specified in input",
          "follow_up_question": "When is the Wild Game Dinner scheduled?"
        }
      ]
    }
  ],
  "locations": [
    {
      "id": "location_001",
      "name": "The Mirage",
      "address": "on Garfield",
      "city": null,
      "state": null,
      "country": null,
      "geocoordinates": null,
      "venue_website": null,
      "phone": null,
      "capacity": null,
      "aliases": ["Mirage on Garfield"],
      "confidence_score": 0.65,
      "provenance": [
        "Venue name 'the Mirage' mentioned in source text",
        "Street reference 'on Garfield' indicates location descriptor",
        "High ambiguity: 'Mirage' is a common business name",
        "Could be restaurant, event hall, hotel, or casino",
        "Multiple disambiguations possible"
      ],
      "ambiguities": [
        {
          "interpretation": "Restaurant/Venue named 'The Mirage'",
          "confidence": 0.5,
          "reasoning": "Most likely given 'Wild Game Dinner' context"
        },
        {
          "interpretation": "Mirage Hotel/Casino (if near 'Garfield Ave/St')",
          "confidence": 0.3,
          "reasoning": "Famous casino venue, but location unclear"
        },
        {
          "interpretation": "Event hall or community center",
          "confidence": 0.2,
          "reasoning": "Could host community dinners"
        }
      ],
      "clarifying_questions": [
        "What city is this location in?",
        "Is 'Garfield' a street name, avenue, or neighborhood?",
        "What type of venue is The Mirage (restaurant, hall, casino)?",
        "Do you have the full address?"
      ],
      "search_suggestions": [
        "\"The Mirage\" restaurant Garfield",
        "\"Mirage\" venue \"wild game dinner\"",
        "\"The Mirage on Garfield\" [city name]"
      ]
    }
  ],
  "organizations": [],
  "summaries": [
    {
      "type": "plain_english",
      "text": "Mark Smith plans to attend a Wild Game Dinner at a venue called 'The Mirage' located on Garfield. The exact date, time, and full address are not specified."
    },
    {
      "type": "entities_extracted",
      "text": "Extracted: 1 person (Mark Smith), 1 event (Wild Game Dinner), 1 location (The Mirage on Garfield)"
    },
    {
      "type": "confidence_summary",
      "text": "High confidence on person name (0.95). Good confidence on event type (0.92). Moderate confidence on location due to ambiguity (0.65)."
    }
  ],
  "follow_up_actions": [
    {
      "priority": "high",
      "action": "Request event date and time",
      "reason": "No temporal information provided"
    },
    {
      "priority": "high",
      "action": "Clarify location details",
      "reason": "Venue name 'The Mirage' is ambiguous; need city and full address"
    },
    {
      "priority": "medium",
      "action": "Confirm Mark Smith's contact information",
      "reason": "May want to send event reminder or updates"
    },
    {
      "priority": "low",
      "action": "Search for 'The Mirage on Garfield' to auto-complete venue details",
      "reason": "May be able to resolve ambiguity with web search"
    }
  ],
  "relationships": [
    {
      "source_entity_id": "550e8400-e29b-41d4-a716-446655440000",
      "source_entity_type": "person",
      "relationship_type": "attending",
      "target_entity_id": "event_001",
      "target_entity_type": "event",
      "confidence": 0.95,
      "provenance": "Text states 'Mark Smith is going to the Wild Game Dinner'"
    },
    {
      "source_entity_id": "event_001",
      "source_entity_type": "event",
      "relationship_type": "held_at",
      "target_entity_id": "location_001",
      "target_entity_type": "location",
      "confidence": 0.85,
      "provenance": "Text indicates event 'at the Mirage on Garfield'"
    }
  ]
}
```

---

## CONSTRAINTS

- Output must be valid JSON.
- Every field must include provenance.
- Do not fabricate sensitive personal data.
- Keep language precise and compact.
- Structure must support direct database ingestion.
- Assume Memory Connector Version 3 data model.
- When confidence is low, provide clarifying questions.
- Always include ambiguity analysis for locations and entities.
- Suggest search queries to help resolve ambiguities.
- Mark all inferred vs. explicit data clearly.

---

## USAGE INSTRUCTIONS

1. Copy this entire prompt to your LLM interface
2. Append the user's memory text after "INPUT:"
3. Instruct the LLM to follow all steps and output only JSON
4. Parse the JSON response and ingest into Memory Connector database
5. Present follow-up questions to user if provided
6. Store provenance and confidence scores with all data

---

## INTEGRATION NOTES FOR MEMORY CONNECTOR

### Backend Processing Flow

1. User submits memory text via `/memories` endpoint
2. Backend saves raw text as Memory record (state: SAVED)
3. Queue enrichment job with this prompt + memory text
4. LLM returns structured JSON
5. Parse JSON and create/update entities:
   - Create/update Person records in `people` table
   - Create/update Event records in `events` table
   - Create/update Location records in `locations` table
   - Create MemoryLink records for relationships
6. Update Memory state to ENRICHED
7. If follow_up_actions exist, create Reminder records
8. Return enriched data to frontend

### Database Mapping

**JSON → Database Tables:**
- `persons` → `people` table (memoryId foreign key)
- `events` → `events` table (memoryId foreign key)
- `locations` → `locations` table (memoryId foreign key)
- `organizations` → (future table)
- `relationships` → `memory_links` table (LinkType enum)
- `follow_up_actions` → `reminders` table

### Confidence Score Usage

- Store confidence_score with each entity
- Display confidence in UI (high/medium/low)
- Allow user to confirm/reject inferred data
- Boost confidence when user confirms
- Reduce confidence when user rejects

### Provenance Display

- Show provenance notes in entity detail views
- Mark inferred fields with icon/badge
- Allow user to edit inferred data
- Track edit history for learning

---

## VERSION HISTORY

- **v3.0 (2025-12-27):** Initial master prompt for Memory Connector V3
  - Added hybrid storage support
  - Enhanced relationship extraction
  - Improved ambiguity handling
  - Added follow-up action generation

---

## END PROMPT
