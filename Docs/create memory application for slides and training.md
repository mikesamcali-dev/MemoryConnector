You are Claude Code running inside Cursor in the project solution folder. Temperature=0. Max tokens=3200. Output must be deterministic.

Goal
Replace the existing “slides + training phrases” memory approach with a structured, interactive, robust memory system named Semantic Anchor Memory (SAM). Implement data model, UI flows, retrieval pipeline, micro-training, versioning, audit, import/export, and unit-testable behaviors.

Runtime inputs
The following variables will be provided at runtime. Treat them as trusted inputs, but sanitize stored text.

* current_conversation: array of { speaker: "user" | "assistant", content: string, timestamp?: string }
* active_task: string
* ui_state: object (describes current Cursor UI context, open file, selection, route, filters, etc.)
* memory_store_snapshot: optional { total_count: number, tags: string[], last_indexed_at?: string, vector_index?: { provider: string, dims: number } }
* user_action: optional one of "create" | "edit" | "delete" | "archive" | "recall" | "import" | "export" | "curate_batch" | "audit"
* user_payload: optional object specific to user_action (form fields, selected memory ids, search query, etc.)

Non-negotiable requirements

1. All storage-bound text must be normalized and sanitized:

* Trim whitespace.
* Normalize internal spacing to single spaces.
* canonical_phrases must be lowercased. title must keep original casing.
* Remove or redact PII using rules below.

2. All outputs must include:

* machine-readable JSON as the first top-level object (no prose before it)
* a ui_summary field containing concise, human-readable summaries for rendering

3. Explainable recall:
   Every recalled memory item must include a one-sentence rationale that references which signals triggered it (semantic similarity, exact match, tags, recency, confidence, ui_state relevance).
4. Fail-safe:
   If no memory exceeds similarity_threshold and composite score minimum, return suggested_follow_up_actions including “create_new_memory_prefill”.
5. Unit-testability:
   All core functions must be pure where feasible and have deterministic outputs given fixed inputs.

PII redaction rules (apply to any text intended for storage)

* Emails: replace with “[email]”
* Phone numbers: replace with “[phone]”
* Street addresses: replace with “[address]”
* Full names of private individuals: replace with “[name]” unless explicitly marked as public figure in source metadata
* Account ids / usernames: replace with “[id]” unless explicitly whitelisted in ui_state.security_context.allowlist
* Anything that looks like an API key/secret/token: replace with “[secret]”
  Provide a redaction_report list in outputs describing what was redacted and where.

Default SAM configuration

* embedding_model: "text-embedding-ada-002" (or project equivalent)
* vector_top_k: 10
* similarity_threshold: 0.75
* composite_score_min: 0.65
* recency_window_days: 30
* weights: semantic=0.50, exact=0.20, recency=0.15, confidence=0.15
* decay_policy: exponential half-life 90 days
* recall_top_n: 5
* rerank_top_n: 7

Tooling assumptions and calls
If the repo already has services, use them. If not, scaffold minimal interfaces.

* Embeddings service: Embeddings.Generate(text, model) -> { vector: number[], dims: number }
* Vector index: VectorIndex.Upsert(id, vector, metadata), VectorIndex.Query(vector, topK, filter) -> [{ id, score }]
* Storage: MemoryRepo.Create/Update/Get/List/Delete/Archive
* Audit log: MemoryAudit.Append(event)
* Schema validation: Validate(schema, data) -> { ok, errors[] }

Outputs required by action
Return a single JSON object with:

* action: user_action resolved
* ok: boolean
* ui_summary: object (strings and arrays for UI)
* redaction_report: array
* data: action-specific payload

Action payload shapes
Create

* data.memory: validated SAM entry JSON
* data.suggested_training_examples: array
* data.embedding_hint: { model, dims, text_hash }
* data.ui_payload: form defaults, field hints, validation warnings

Recall

* data.ranked_memory_list: array of { id, title, summary, rationale, score, signals: { semantic, exact, recency, confidence }, highlights: string[] }
* data.suggested_follow_up_actions: array of { type, label, payload }

Edit / Archive / Delete

* data.memory: updated SAM entry JSON
* data.changelog_diff: array of { path, before, after, reason }
* data.ui_payload: updated list row, badges, warnings

Import / Export

* data.export_bundle or data.import_report

Curate_batch / Audit

* data.batch_suggestions / data.audit_timeline

System architecture tasks to perform

1. Create the SAM data model and JSON Schema.
2. Implement SAM enrichment pipeline on create/update:

* sanitize + normalize
* summary generation
* canonical phrase suggestion
* tag suggestion
* embedding generation + upsert vector index
* training example generation (1–3)
* run deterministic unit tests

3. Implement Cursor UI:

* Create memory form with live preview and validation
* Micro-train editor with “run test” in-situ
* Batch curation tool with merge/conflict resolution
* Audit timeline view with recall event “why recalled”
* Archive/forget workflow with decay policies and manual override

4. Implement retrieval pipeline:

* build query context
* hybrid candidate retrieval (vector + exact + tags + recency)
* composite scoring
* rerank step that produces concise rationales
* return top-N and fail-safe

5. Implement governance:

* roles/tags access control hooks
* encryption-at-rest notes
* audit logs

6. Add tests:

* schema validation
* sanitization and redaction
* embedding and vector search plumbing (mocked)
* scoring correctness
* merge logic
* end-to-end recall determinism

Section A. Sample memory entry before and after SAM enrichment

Before (legacy style)
{
"title": "MudSnackbar preference",
"text": "Prefer MudSnackbar over MudDialog for alert pop-ups."
}

After (SAM)

* canonical_phrases lowercased
* summary short
* training_examples added
* confidence_score and decay policy set
* embeddings stored separately but referenced

Example SAM entry (illustrative)
{
"id": "mem_01HZZZ...",
"title": "MudSnackbar preferred for alerts",
"content": "Use MudSnackbar instead of MudDialog for alert-style notifications in Blazor UI.",
"summary": "Use MudSnackbar for alerts, avoid MudDialog for quick notifications.",
"canonical_phrases": [
"use mudsnackbar for alerts",
"avoid muddialog for alert pop-ups",
"prefer snackbar notifications"
],
"tags": ["ui", "blazor", "mudblazor", "preference"],
"source": { "type": "user", "ref": "chat", "uri": null },
"created_at": "2026-01-19T00:00:00Z",
"updated_at": "2026-01-19T00:00:00Z",
"confidence_score": 0.85,
"reliability": "confirmed",
"usage_count": 0,
"last_used_at": null,
"context_window": { "applies_to": ["blazor", "mudblazor"], "excludes": [] },
"training_examples": [
{
"id": "tr_01",
"user": "Show an alert after save succeeds.",
"assistant": "Use MudSnackbar to show a success message, keep it short, no dialog.",
"assertions": ["mentions MudSnackbar", "does not propose MudDialog", "provides snippet or steps"],
"last_tested_at": null,
"pass_rate": 0.0
}
],
"decay_policy": { "type": "exponential", "half_life_days": 90, "min_confidence": 0.40 },
"archive_flag": false,
"version": 1,
"embeddings": { "model": "text-embedding-ada-002", "dims": 1536, "vector_ref": "vec://mem_01HZZZ..." }
}

Section B. Micro-training pair example

Template

* user: a realistic prompt that should trigger this memory
* assistant: expected behavior that explicitly applies the memory
* assertions: deterministic checks

Example
user: "Need a quick pop-up after a form submit."
assistant: "Use MudSnackbar for the confirmation, avoid MudDialog for this alert use case."
assertions: ["MudSnackbar", "avoid MudDialog"]

Section C. Retrieval example with composite scoring calculation

Assume candidate memory mem_A has:
semantic=0.82 exact=0.10 recency=0.60 confidence=0.85
weights: 0.50, 0.20, 0.15, 0.15
score = 0.50*0.82 + 0.20*0.10 + 0.15*0.60 + 0.15*0.85
score = 0.41 + 0.02 + 0.09 + 0.1275 = 0.6475

If composite_score_min=0.65, this candidate narrowly fails and should be either:

* included only if it is within top-N and close to threshold, or
* reranked and potentially included with a low-confidence flag
  Default behavior: require score >= 0.65 unless exact >= 0.60 or confidence >= 0.90.

Implementation instructions for Claude Code
Perform the following modifications in-repo. Use existing patterns and frameworks if present. If not present, implement minimal, clean TypeScript (for web UI) and a simple service layer. Prefer:

* React + TypeScript for UI components
* Zod for runtime validation if available, otherwise JSON Schema validation
* A repository pattern for storage
* A service for embeddings and vector search
* Deterministic tests using Vitest or Jest

Return results as the required JSON object.

1. JSON Schema for SAM entries
   Create a file:

* /sam/schema/memoryEntry.schema.json
  Use the schema in Section 2 below.

2. Backend services and domain model
   Create:

* /sam/domain/types.ts
* /sam/domain/normalize.ts
* /sam/domain/redact.ts
* /sam/domain/scoring.ts
* /sam/services/MemoryService.ts
* /sam/services/RetrievalService.ts
* /sam/services/TrainingService.ts
* /sam/services/AuditService.ts
* /sam/repo/MemoryRepo.ts (interface + simple implementation)
* /sam/vector/VectorIndex.ts (interface + mock adapter)
* /sam/embeddings/Embeddings.ts (interface + mock adapter)

3. Cursor UI components
   Create:

* /sam/ui/MemoryCreateForm.tsx
* /sam/ui/MemoryEditor.tsx
* /sam/ui/MicroTrainPanel.tsx
* /sam/ui/MemoryList.tsx
* /sam/ui/BatchCurate.tsx
* /sam/ui/AuditTimeline.tsx
* /sam/ui/RecallInspector.tsx

4. Retrieval pipeline
   Implement hybrid retrieval and rerank rationales.

5. Tests
   Create:

* /sam/tests/schema.test.ts
* /sam/tests/redaction.test.ts
* /sam/tests/normalize.test.ts
* /sam/tests/scoring.test.ts
* /sam/tests/retrieval.test.ts
* /sam/tests/microtrain.test.ts
* /sam/tests/e2e.recall.test.ts

Required behavior details

A) Create memory flow (UI-driven)
UI steps

1. MemoryList, click “New Memory”.
2. MemoryCreateForm shows fields:

* title
* content
* tags (chips with suggestions)
* source type and reference
* confidence slider (default 0.75)
* reliability dropdown: unverified | inferred | confirmed
* context window: applies_to, excludes
* decay policy: type + half-life

3. Live preview panel:

* auto summary
* suggested canonical phrases
* PII warnings
* estimated embedding readiness

4. Micro-train step:

* add 1–3 training examples
* run tests button that simulates recall and checks assertions

5. Save:

* validates schema
* writes to repo
* generates embedding and upserts index
* appends audit event

6. Post-save:

* RecallInspector shows “where this memory will trigger” with canonical phrases.

B) Edit flow

* increment version
* preserve version history
* create changelog diff
* re-embed if content or canonical phrases change
* re-run training tests

C) Archive/forget flow

* soft-delete with archive_flag=true
* keep in store but excluded from default retrieval
* decay policy continues but with lower priority
* allow restore
* append audit event

D) Retrieval behavior
Context builder

* last_n_turns default 8
* include active_task
* include ui_state.route and selection text if present
* produce query_text for embedding and exact match

Candidate retrieval

1. Vector query: topK=vector_top_k over non-archived by default
2. Exact match: find canonical phrases present in query_text and active_task
3. Tag boost: if ui_state includes tag filters, boost matching tags
4. Recency promotion: if last_used_at within recency_window_days

Composite scoring

* semantic: vector similarity in [0,1]
* exact: fraction of canonical phrase hits, capped at 1
* recency: exp(-days_since_last_used/recency_window_days)
* confidence: confidence_score in [0,1]
  score = w_sem*semantic + w_exact*exact + w_rec*recency + w_conf*confidence

Rerank step (lightweight, deterministic)

* Take top rerank_top_n
* Produce one-sentence rationale per item using explicit signals
* If conflicting memories exist (same tags but contradictory canonical phrases), flag conflict and request clarification via suggested_follow_up_actions

Fail-safe
If no item meets similarity_threshold OR score >= composite_score_min:

* return empty ranked list
* return follow-up action create_new_memory_prefill:
  payload must include suggested title, content draft, tags, and canonical phrases derived from current_conversation and active_task

E) Continuous learning

* Confirmations:

  * when user explicitly confirms a memory helped, increment confidence_score by +0.02 up to 0.95
* Corrections:

  * when user contradicts a memory, create revision workflow:

    * mark reliability “contested”
    * decrease confidence_score by -0.10
    * create a new version with updated content upon resolution
* Usage count:

  * increment when memory is applied in an assistant response or explicitly selected in UI

F) Import/Export

* Export bundle: JSONL or JSON array of SAM entries + metadata
* Import: validate each entry, remap ids if conflicts, append audit “imported”
* Provide deterministic import_report with counts

Section 1. Prompt outputs
Based on user_action, produce JSON with required fields, and implement or modify code accordingly.

Section 2. JSON Schema for memory entries (create file exactly as below)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SAMMemoryEntry",
  "type": "object",
  "required": [
    "id",
    "title",
    "content",
    "summary",
    "canonical_phrases",
    "tags",
    "source",
    "created_at",
    "updated_at",
    "confidence_score",
    "reliability",
    "usage_count",
    "last_used_at",
    "context_window",
    "training_examples",
    "decay_policy",
    "archive_flag",
    "version",
    "embeddings"
  ],
  "properties": {
    "id": { "type": "string", "minLength": 8 },
    "title": { "type": "string", "minLength": 3, "maxLength": 120 },
    "content": { "type": "string", "minLength": 10, "maxLength": 8000 },
    "summary": { "type": "string", "minLength": 10, "maxLength": 320 },
    "canonical_phrases": {
      "type": "array",
      "minItems": 1,
      "maxItems": 12,
      "items": { "type": "string", "minLength": 3, "maxLength": 120 }
    },
    "tags": {
      "type": "array",
      "minItems": 0,
      "maxItems": 24,
      "items": { "type": "string", "minLength": 2, "maxLength": 40 }
    },
    "source": {
      "type": "object",
      "required": ["type", "ref", "uri"],
      "properties": {
        "type": { "type": "string", "enum": ["user", "system", "import", "derived", "doc"] },
        "ref": { "type": "string", "minLength": 1, "maxLength": 200 },
        "uri": { "type": ["string", "null"], "maxLength": 500 }
      }
    },
    "created_at": { "type": "string", "format": "date-time" },
    "updated_at": { "type": "string", "format": "date-time" },
    "confidence_score": { "type": "number", "minimum": 0, "maximum": 1 },
    "reliability": { "type": "string", "enum": ["unverified", "inferred", "confirmed", "contested"] },
    "usage_count": { "type": "integer", "minimum": 0 },
    "last_used_at": { "type": ["string", "null"], "format": "date-time" },
    "context_window": {
      "type": "object",
      "required": ["applies_to", "excludes"],
      "properties": {
        "applies_to": { "type": "array", "items": { "type": "string" }, "maxItems": 32 },
        "excludes": { "type": "array", "items": { "type": "string" }, "maxItems": 32 }
      }
    },
    "training_examples": {
      "type": "array",
      "minItems": 0,
      "maxItems": 6,
      "items": {
        "type": "object",
        "required": ["id", "user", "assistant", "assertions", "last_tested_at", "pass_rate"],
        "properties": {
          "id": { "type": "string", "minLength": 4, "maxLength": 64 },
          "user": { "type": "string", "minLength": 3, "maxLength": 600 },
          "assistant": { "type": "string", "minLength": 3, "maxLength": 1200 },
          "assertions": { "type": "array", "items": { "type": "string" }, "maxItems": 12 },
          "last_tested_at": { "type": ["string", "null"], "format": "date-time" },
          "pass_rate": { "type": "number", "minimum": 0, "maximum": 1 }
        }
      }
    },
    "decay_policy": {
      "type": "object",
      "required": ["type", "half_life_days", "min_confidence"],
      "properties": {
        "type": { "type": "string", "enum": ["exponential", "none"] },
        "half_life_days": { "type": "integer", "minimum": 7, "maximum": 3650 },
        "min_confidence": { "type": "number", "minimum": 0, "maximum": 1 }
      }
    },
    "archive_flag": { "type": "boolean" },
    "version": { "type": "integer", "minimum": 1 },
    "embeddings": {
      "type": "object",
      "required": ["model", "dims", "vector_ref"],
      "properties": {
        "model": { "type": "string", "minLength": 3, "maxLength": 80 },
        "dims": { "type": "integer", "minimum": 8, "maximum": 8192 },
        "vector_ref": { "type": "string", "minLength": 6, "maxLength": 200 }
      }
    }
  }
}
```

Section 3. Example Cursor UI components and handlers (TSX pseudocode to implement)

Create form

* Controlled inputs
* Live enrichment preview
* “Generate suggestions” and “Run micro-train tests”

```tsx
// /sam/ui/MemoryCreateForm.tsx
import React, { useMemo, useState } from "react";
import { SamMemoryDraft, SamMemoryEntry, SamEnrichmentPreview } from "../domain/types";
import { normalizeForStorage } from "../domain/normalize";
import { redactPII } from "../domain/redact";
import { MemoryService } from "../services/MemoryService";
import { TrainingService } from "../services/TrainingService";

type Props = {
  initial?: Partial<SamMemoryDraft>;
  onSaved: (entry: SamMemoryEntry) => void;
};

export function MemoryCreateForm({ initial, onSaved }: Props) {
  const [draft, setDraft] = useState<SamMemoryDraft>({
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    tags: initial?.tags ?? [],
    reliability: initial?.reliability ?? "unverified",
    confidence_score: initial?.confidence_score ?? 0.75,
    context_window: initial?.context_window ?? { applies_to: [], excludes: [] },
    decay_policy: initial?.decay_policy ?? { type: "exponential", half_life_days: 90, min_confidence: 0.4 },
    source: initial?.source ?? { type: "user", ref: "cursor_ui", uri: null }
  });

  const preview: SamEnrichmentPreview = useMemo(() => {
    const norm = normalizeForStorage(draft);
    const redacted = redactPII(norm);
    return MemoryService.previewEnrichment(redacted.cleaned);
  }, [draft]);

  async function onGenerateTraining() {
    const generated = await TrainingService.suggestTrainingExamples({
      title: draft.title,
      content: draft.content,
      canonical_phrases: preview.canonical_phrases
    });
    setDraft(d => ({ ...d, training_examples: generated }));
  }

  async function onRunTests() {
    const report = await TrainingService.runTrainingTests({
      draft,
      canonical_phrases: preview.canonical_phrases
    });
    // render report in UI
  }

  async function onSave() {
    const result = await MemoryService.createFromDraft({ draft, preview });
    if (result.ok) onSaved(result.entry);
    // show validation errors otherwise
  }

  return (
    <div className="sam-form">
      {/* left: inputs */}
      {/* right: live preview panel showing summary, canonical phrases, pii warnings */}
      {/* actions: generate training, run tests, save */}
    </div>
  );
}
```

Micro-train panel

```tsx
// /sam/ui/MicroTrainPanel.tsx
export function MicroTrainPanel({ examples, onChange, onRunTests }) {
  // list 1–3 examples
  // each example: user text, assistant expected, assertions chips
  // run tests button calls onRunTests
  return null;
}
```

Audit timeline

```tsx
// /sam/ui/AuditTimeline.tsx
export function AuditTimeline({ memoryId }) {
  // fetch audit events, render chronological with diff highlights
  // show recall events with rationale and signals
  return null;
}
```

Section 4. Retrieval pipeline pseudocode and scoring function

```ts
// /sam/services/RetrievalService.ts
import { buildQueryText, exactMatchScore, recencyScore, compositeScore } from "../domain/scoring";

export async function recallSAM({
  current_conversation,
  active_task,
  ui_state,
  repo,
  vectorIndex,
  cfg
}) {
  const queryText = buildQueryText({ current_conversation, active_task, ui_state, lastTurns: 8 });

  const queryEmbedding = await Embeddings.Generate(queryText, cfg.embedding_model);

  const vecHits = await vectorIndex.Query(queryEmbedding.vector, cfg.vector_top_k, { archive_flag: false });

  const candidates = await repo.getMany(vecHits.map(h => h.id));

  const scored = candidates.map(mem => {
    const semantic = vecHits.find(v => v.id === mem.id)?.score ?? 0;
    const exact = exactMatchScore(queryText, mem.canonical_phrases);
    const recency = recencyScore(mem.last_used_at, cfg.recency_window_days);
    const conf = mem.confidence_score;

    const score = compositeScore({ semantic, exact, recency, confidence: conf }, cfg.weights);

    return {
      mem,
      score,
      signals: { semantic, exact, recency, confidence: conf }
    };
  });

  const filtered = scored
    .filter(x => x.signals.semantic >= cfg.similarity_threshold || x.signals.exact >= 0.6)
    .sort((a,b) => b.score - a.score)
    .slice(0, cfg.rerank_top_n);

  if (filtered.length === 0 || filtered[0].score < cfg.composite_score_min) {
    return { ranked: [], failSafe: true, prefill: suggestNewMemoryPrefill({ queryText, active_task }) };
  }

  const ranked = filtered.slice(0, cfg.recall_top_n).map(x => ({
    id: x.mem.id,
    title: x.mem.title,
    summary: x.mem.summary,
    score: round3(x.score),
    signals: x.signals,
    rationale: buildRationale(x.mem, x.signals, ui_state, active_task),
    highlights: makeHighlights(queryText, x.mem)
  }));

  return { ranked, failSafe: false };
}

export function compositeScore(sig, w) {
  return w.semantic*sig.semantic + w.exact*sig.exact + w.recency*sig.recency + w.confidence*sig.confidence;
}
```

Rationale rules

* Mention strongest two signals and one contextual cue.
* Example: “Recalled due to high semantic match (0.82) and confidence (0.85), relevant to current MudBlazor UI task.”

Section 5. Micro-training templates and automated generation rules

Generation rules (deterministic)

* Produce 2 examples by default, 3 if memory has more than 6 canonical phrases.
* Example 1: direct user request that includes one canonical phrase verbatim.
* Example 2: paraphrase request that should still trigger memory.
* Optional example 3: edge case where memory should NOT apply, to reduce overuse.

Template

```json
{
  "id": "tr_auto_01",
  "user": "<short user prompt>",
  "assistant": "<expected behavior: apply memory explicitly, keep concise>",
  "assertions": ["<keyword>", "<forbidden:... optional>"],
  "last_tested_at": null,
  "pass_rate": 0.0
}
```

Test runner behavior

* For each example:

  * Build recall context from example.user + active_task
  * Ensure the memory itself appears in recall top-N
  * Check assistant expected contains required assertions
  * Update pass_rate deterministically from last N runs

Section 6. Unit and integration test cases

Schema validation
Input: missing required field “summary”
Expected: ok=false, errors includes “summary required”

Redaction
Input content: “Email me at [bob@example.com](mailto:bob@example.com)”
Expected stored content: “Email me at [email]”
Expected redaction_report includes path and pattern

Normalization
Input canonical phrase: “  Prefer   MudDialog  ”
Expected canonical phrase stored: “prefer muddialog”

Scoring
Given signals semantic=0.82 exact=0.10 recency=0.60 confidence=0.85
Expected score=0.6475 with default weights

Retrieval fail-safe
Given no vector hit above threshold
Expected ranked_memory_list empty
Expected suggested_follow_up_actions includes create_new_memory_prefill

Conflict detection
Two memories share tag “ui” but canonical phrases imply opposite preferences
Expected suggested_follow_up_actions includes “clarify_conflict”
Expected rationale marks conflict flag

End-to-end determinism
Given fixed repo contents and fixed embeddings mock vectors
Expected ranked ids and scores stable across runs

Section 7. Operational notes

Data governance

* Store minimal content. Keep embeddings separate from raw text where possible.
* Encrypt at rest. Protect memory tags with role-based access if ui_state includes roles.
* Maintain audit logs for create, edit, recall, archive, import.

Performance tuning

* Cache embeddings for identical queryText hash.
* Cache top recall results per active_task for 60 seconds.
* Background embedding generation on bulk import, but block saving only if schema invalid.

Rollback and versioning

* Every edit increments version and writes a diff record.
* Provide restore endpoint to revert to any prior version.
* Archive does not delete vectors, but marks excluded from default retrieval filter.

Archival and decay

* Compute effective_confidence = confidence_score * decayMultiplier(daysSinceUpdated, halfLife)
* If effective_confidence < min_confidence, auto-suggest archive in curation UI
* Do not auto-delete by default

Final output format
Return a single JSON object with fields:
action, ok, ui_summary, redaction_report, data

End with a short checklist in ui_summary.next_steps:

* Cursor UI tasks
* Backend tasks
* Tests
* Rollout plan

Now execute based on user_action. If user_action is missing, default to “recall” using current_conversation and active_task.
