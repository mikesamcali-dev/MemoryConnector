You are Claude. You are helping me build a feature that extracts structured data from a TikTok video by transcribing audio with OpenAI Whisper.

Goal
Given a TikTok URL (or a local video/audio file path), produce:
1) A clean transcript.
2) A structured JSON record that captures key details from the video.

Constraints
- Do not invent facts. If something is unclear, set the field to null and add a note in "uncertain_items".
- Preserve important proper nouns (names, products, places). If unsure, include best guess plus "confidence" and "evidence_quote".
- Keep output deterministic. Follow the exact JSON schema provided.
- If the input is a TikTok URL, assume the caller will download the video/audio outside of Whisper if needed. Whisper only transcribes audio.

Inputs I will provide
- SourceType: "tiktok_url" OR "local_file"
- Source: the TikTok URL or local file path
- LanguageHint: optional (ex: "en"), otherwise auto-detect
- WantTimestamps: true/false
- WhisperModel: default "whisper-1"
- OutputFormat: "json" OR "text" OR "verbose_json"

Your job
1) Explain the end-to-end steps to extract data from the TikTok video using OpenAI Whisper.
2) Provide exact API request examples (curl) for Whisper transcription.
3) Provide post-processing rules to turn the transcript into structured JSON.
4) Output the final transcript and extracted JSON for the provided input.

Step-by-step workflow (must include)
A. Acquire audio
- If SourceType is "tiktok_url":
  - State that the system must download the video and extract audio (mp3 or m4a) before calling Whisper.
  - Provide example commands using ffmpeg to extract audio.
- If SourceType is "local_file":
  - If it’s a video, extract audio with ffmpeg.
  - If it’s already audio, proceed.

B. Transcribe with OpenAI Whisper
- Show a minimal curl request.
- Show an advanced curl request with:
  - language hint (if provided)
  - timestamps enabled (if WantTimestamps true, use verbose_json)
  - temperature set to 0
- Describe how to handle common failures:
  - silent audio
  - too short
  - heavy music/noise
  - multi-speaker confusion

C. Clean and normalize transcript
- Remove filler words when safe.
- Keep numbered steps, measurements, prices, dates, URLs, @handles.
- If WantTimestamps true, retain segment timestamps.

D. Extract structured data
- Use the schema below and fill it out from the transcript.
- Include evidence quotes for each extracted field where possible.

JSON schema (output exactly this shape)
{
  "source": {
    "source_type": null,
    "source_value": null
  },
  "transcription": {
    "language": null,
    "duration_seconds": null,
    "has_timestamps": null,
    "transcript_text": null,
    "segments": [
      {
        "start": null,
        "end": null,
        "text": null
      }
    ]
  },
  "extracted": {
    "summary": null,
    "topic_labels": [],
    "people": [
      {
        "name": null,
        "role": null,
        "confidence": null,
        "evidence_quote": null
      }
    ],
    "brands_or_products": [
      {
        "name": null,
        "type": null,
        "confidence": null,
        "evidence_quote": null
      }
    ],
    "locations": [
      {
        "name": null,
        "confidence": null,
        "evidence_quote": null
      }
    ],
    "key_points": [],
    "how_to_steps": [
      {
        "step_number": null,
        "instruction": null,
        "confidence": null,
        "evidence_quote": null
      }
    ],
    "numbers_and_claims": [
      {
        "value": null,
        "unit_or_context": null,
        "confidence": null,
        "evidence_quote": null
      }
    ],
    "calls_to_action": [],
    "links_and_handles": [
      {
        "type": null,
        "value": null,
        "confidence": null,
        "evidence_quote": null
      }
    ],
    "safety_or_medical_flags": [
      {
        "flag": null,
        "reason": null,
        "evidence_quote": null
      }
    ],
    "uncertain_items": [
      {
        "item": null,
        "why_uncertain": null,
        "candidate_values": []
      }
    ]
  }
}

Output format rules
- First output: "WORKFLOW" with bullet steps.
- Second output: "WHISPER API EXAMPLES" with curl commands.
- Third output: "RESULTS" containing:
  - Transcript (plain text)
  - JSON object matching the schema

Now do the task for this input:
SourceType: {{SourceType}}
Source: {{Source}}
LanguageHint: {{LanguageHint}}
WantTimestamps: {{WantTimestamps}}
WhisperModel: {{WhisperModel}}
OutputFormat: {{OutputFormat}}
