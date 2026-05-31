# AI Meeting Intelligence Web App — Full Blueprint
### Role: Senior Software Engineer + AI Engineer + Prompt Engineer

> **Scope:** Full-stack architecture, frontend design system, backend structure, AI pipeline, SOLID/GRASP principles, and complete implementation prompts for every layer.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Final Feature Set](#2-final-feature-set)
3. [Tech Stack Decision Matrix](#3-tech-stack-decision-matrix)
4. [Architecture Overview](#4-architecture-overview)
5. [Backend — Detailed Structure & Prompt](#5-backend--detailed-structure--prompt)
6. [AI Pipeline — Detailed Design & Prompts](#6-ai-pipeline--detailed-design--prompts)
7. [Frontend — Design System & Prompt](#7-frontend--design-system--prompt)
8. [Database Schema](#8-database-schema)
9. [API Contract](#9-api-contract)
10. [SOLID & GRASP Application Map](#10-solid--grasp-application-map)
11. [Supabase MCP Integration](#11-supabase-mcp-integration)
12. [Export Pipeline](#12-export-pipeline)
13. [Security & Error Handling](#13-security--error-handling)
14. [Development Phases & Checklist](#14-development-phases--checklist)

---

## 1. Project Overview

**App Name:** MeetMind AI *(suggested)*

**Core Problem:**  
Pakistani professional and academic meetings are primarily conducted in a mixture of Urdu and English (code-switching). Existing transcription tools fail on this pattern. MeetMind AI is a web app that accepts audio/video files, transcribes them accurately with speaker diarization, generates structured meeting minutes, extracts action items, and exports results in multiple formats — all in a single, beautiful interface.

**Primary Users:**
- University students and faculty (FAST-NUCES type environments)
- Corporate teams in Pakistan conducting bilingual meetings
- Remote teams needing searchable meeting history

**Languages Supported:** Urdu, English, and mixed Urdu-English (code-switching)

---

## 2. Final Feature Set

### Core Features (MVP)
| # | Feature | Description |
|---|---------|-------------|
| 1 | Audio/Video Upload | Up to 10GB, chunked multipart upload |
| 2 | Transcription | Whisper-based, Urdu + English + code-switching |
| 3 | Speaker Diarization | PyAnnote detects speakers (Person 1, Person 2…) |
| 4 | Timestamped Transcript | Full transcript with per-segment timestamps |
| 5 | AI Meeting Minutes | Claude/GPT generates structured minutes |
| 6 | PDF Export | Formatted, downloadable PDF |
| 7 | Auth | Supabase Auth (email + OAuth) |

### Advanced Features (Included)

**Language Features**
- Output language toggle — view minutes in Urdu or English
- Mixed-language (code-switching) support — detect and handle seamlessly
- RTL rendering for Urdu output in the UI

**Action Items Extraction**
- Claude/GPT automatically extracts tasks, owners, and deadlines from the transcript
- Action items displayed in a separate card panel
- Exportable as part of minutes

**Export Options**
- Export as Word `.docx`
- Export raw transcript as `.srt` subtitle file
- Export to Google Docs directly

---

## 3. Tech Stack Decision Matrix

### Frontend
| Concern | Choice | Reason |
|---------|--------|--------|
| Framework | React + Vite + TypeScript | Fast dev server, strong typing |
| Styling | Tailwind CSS | Utility-first, consistent spacing |
| Components | Shadcn/ui | Accessible, unstyled base components |
| State | Zustand | Simple global store, no boilerplate |
| Data Fetching | TanStack Query (React Query) | Cache, loading/error states, polling for job status |
| Animation | Framer Motion | Page transitions, skeleton loaders, microinteractions |
| Forms | React Hook Form + Zod | Type-safe form validation |
| RTL Support | `dir="rtl"` + Tailwind RTL plugin | For Urdu output rendering |

### Backend
| Concern | Choice | Reason |
|---------|--------|--------|
| API Framework | FastAPI (Python) | Async, auto OpenAPI docs, fast |
| Task Queue | Celery + Redis | Background job processing for large files |
| Database | Supabase (PostgreSQL) | Auth + DB + Storage + Realtime in one |
| File Storage | Supabase Storage | Replaces AWS S3, no extra config |
| Auth | Supabase Auth | JWT, email, Google OAuth |
| Audio Processing | FFmpeg | Video-to-audio, audio normalization |

### AI / ML
| Concern | Choice | Reason |
|---------|--------|--------|
| Transcription | OpenAI Whisper (large-v3) | Best multilingual + Urdu support |
| Speaker Diarization | PyAnnote.audio 3.x | SOTA speaker segmentation |
| Minutes + Summary | Claude claude-sonnet-4-20250514 | Best for long-context structured output |
| Action Items | Claude claude-sonnet-4-20250514 | Structured JSON extraction via tool use |
| Translation | Claude claude-sonnet-4-20250514 | Urdu ↔ English context-aware translation |

### Export
| Format | Library |
|--------|---------|
| PDF | WeasyPrint |
| DOCX | python-docx |
| SRT | Custom formatter (pure Python) |
| Google Docs | Google API Python Client |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                           │
│  Upload → Status Polling → View Transcript → Export/Share       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS REST + WebSocket (Supabase Realtime)
┌──────────────────────▼──────────────────────────────────────────┐
│                    FastAPI Backend                               │
│  /upload  /status  /export  /share  /translate  /action-items   │
└──────┬───────────────────────────────────────────────┬──────────┘
       │ Celery Task                                   │ Supabase Client
┌──────▼──────────┐                        ┌──────────▼──────────┐
│  Redis (Broker) │                        │  Supabase           │
│  Job Queue      │                        │  ├─ PostgreSQL DB    │
└──────┬──────────┘                        │  ├─ Auth (JWT)       │
       │                                   │  ├─ Storage (Files)  │
┌──────▼────────────────────────────┐      │  └─ Realtime        │
│         Celery Worker             │      └─────────────────────┘
│  1. FFmpeg → extract audio        │
│  2. Whisper → transcript chunks   │
│  3. PyAnnote → speaker segments   │
│  4. Merge segments + timestamps   │
│  5. Claude → minutes + actions    │
│  6. Claude → translate (optional) │
│  7. Generate PDF / DOCX / SRT     │
│  8. Upload artifacts to Supabase  │
│  9. Update job status in DB       │
└───────────────────────────────────┘
```

**Key Design Decisions:**
- Jobs are async — UI polls job status using TanStack Query with `refetchInterval`
- Supabase Realtime can push job updates (no polling needed for premium feature)
- All file storage goes through Supabase Storage (no AWS)
- Claude is called with structured outputs / tool use for deterministic extraction

---

## 5. Backend — Detailed Structure & Prompt

### Directory Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app factory
│   ├── config.py                # Settings (pydantic-settings)
│   ├── dependencies.py          # DI: DB, auth, storage clients
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py            # Aggregates all routers
│   │   ├── v1/
│   │   │   ├── upload.py        # POST /api/v1/upload
│   │   │   ├── jobs.py          # GET /api/v1/jobs/{id}
│   │   │   ├── meetings.py      # GET/PATCH /api/v1/meetings/{id}
│   │   │   ├── export.py        # POST /api/v1/export/{id}/{format}
│   │   │   ├── translate.py     # POST /api/v1/translate/{id}
│   │   │   └── share.py         # POST /api/v1/share/{id}
│   │
│   ├── core/
│   │   ├── auth.py              # Supabase JWT verification middleware
│   │   ├── exceptions.py        # Custom exception hierarchy
│   │   └── logging.py           # Structured logging setup
│   │
│   ├── models/
│   │   ├── job.py               # Pydantic models for jobs
│   │   ├── meeting.py           # Meeting, Transcript, Speaker models
│   │   ├── export.py            # Export request/response models
│   │   └── action_item.py       # ActionItem model
│   │
│   ├── services/
│   │   ├── upload_service.py    # Chunked upload + storage
│   │   ├── job_service.py       # Job creation + status tracking
│   │   ├── meeting_service.py   # CRUD for meetings
│   │   ├── export_service.py    # Orchestrates export format selection
│   │   ├── translate_service.py # Language toggle (Urdu ↔ English)
│   │   └── share_service.py     # Generate shareable links / Google Docs
│   │
│   ├── workers/
│   │   ├── celery_app.py        # Celery instance + config
│   │   ├── tasks/
│   │   │   ├── process_pipeline.py   # Main Celery task (orchestrator)
│   │   │   ├── transcribe.py         # Whisper transcription step
│   │   │   ├── diarize.py            # PyAnnote diarization step
│   │   │   ├── merge_segments.py     # Align transcript + speaker labels
│   │   │   ├── generate_minutes.py   # Claude minutes generation
│   │   │   ├── extract_actions.py    # Claude action items extraction
│   │   │   └── generate_exports.py   # PDF, DOCX, SRT generation
│   │
│   ├── ai/
│   │   ├── whisper_client.py    # Whisper API/local wrapper
│   │   ├── pyannote_client.py   # PyAnnote wrapper
│   │   ├── claude_client.py     # Anthropic SDK wrapper
│   │   └── prompts/
│   │       ├── minutes_prompt.py
│   │       ├── action_items_prompt.py
│   │       └── translation_prompt.py
│   │
│   ├── exporters/
│   │   ├── base_exporter.py     # Abstract base class (SOLID: OCP)
│   │   ├── pdf_exporter.py
│   │   ├── docx_exporter.py
│   │   ├── srt_exporter.py
│   │   └── gdocs_exporter.py
│   │
│   └── db/
│       ├── supabase_client.py   # Supabase Python client singleton
│       └── queries/
│           ├── jobs.py
│           ├── meetings.py
│           └── users.py
│
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

---

### Backend Implementation Prompt

**Paste this into your AI coding assistant (Cursor, Claude, etc.) for backend scaffolding:**

```
You are a senior Python engineer. Build the FastAPI backend for MeetMind AI — 
an AI-powered meeting transcription and minutes generation app.

== TECH STACK ==
- FastAPI with async endpoints
- Celery + Redis for background processing
- Supabase (Python client) for auth, storage, and PostgreSQL database
- OpenAI Whisper (large-v3) for transcription
- PyAnnote.audio 3.x for speaker diarization
- Anthropic Claude claude-sonnet-4-20250514 for minutes, action items, and translation
- WeasyPrint for PDF export
- python-docx for .docx export
- Custom SRT formatter
- Google API Python Client for Google Docs export

== SOLID PRINCIPLES TO APPLY ==
1. Single Responsibility: Each service class does ONE thing.
   - UploadService: only handles chunked upload to Supabase Storage
   - TranscriptionService: only calls Whisper and returns raw segments
   - DiarizationService: only calls PyAnnote and returns speaker segments
   - MinutesService: only calls Claude and formats minutes
   - ActionItemService: only calls Claude for task extraction
2. Open/Closed: Use an abstract BaseExporter class. Each format (PDF, DOCX, SRT, GDocs) is a subclass. Adding a new format means adding a new subclass, not editing existing code.
3. Liskov Substitution: All exporters are substitutable via the base interface.
4. Interface Segregation: Keep service interfaces small. Don't force TranscriptionService to know about PDF generation.
5. Dependency Inversion: Use dependency injection everywhere. All services receive their clients (Supabase, Anthropic, Whisper) via constructor injection.

== GRASP PRINCIPLES TO APPLY ==
1. Information Expert: Assign responsibility to the class that has the data.
   - Job status → JobService (it owns job data)
   - Segment merging → MergeService (it owns both transcript and diarization data)
2. Creator: The ProcessPipeline Celery task creates sub-tasks, not the API endpoint.
3. Controller: API route handlers delegate to services, never contain business logic.
4. Low Coupling: Workers import only what they need. No circular imports.
5. High Cohesion: The ai/prompts/ folder only contains prompt strings/builders.

== PIPELINE FLOW ==
POST /api/v1/upload
  → UploadService.save_to_supabase_storage()
  → JobService.create_job(file_url, user_id)
  → process_pipeline.delay(job_id)  # Celery async task
  → return { job_id, status: "queued" }

Celery Task: process_pipeline(job_id)
  Step 1: FFmpeg audio extraction (if video)
  Step 2: Whisper transcription → list of { start, end, text, language }
  Step 3: PyAnnote diarization → list of { start, end, speaker }
  Step 4: MergeService.merge(transcript_segments, diarization_segments) → merged_transcript
  Step 5: Claude → meeting minutes (structured Markdown)
  Step 6: Claude → action items (JSON with { task, owner, deadline })
  Step 7: Generate PDF + DOCX + SRT artifacts
  Step 8: Upload artifacts to Supabase Storage
  Step 9: Update job status → "completed", store result_id in DB

== CHUNKED UPLOAD ==
- Accept files up to 10GB
- Use multipart/form-data with chunks
- Store each chunk in temp storage, assemble on completion
- On upload, return presigned Supabase Storage URL

== LANGUAGE HANDLING ==
- Whisper supports urdu (language="ur") and auto-detection
- Code-switching: pass language=None to Whisper for auto-detection per segment
- Store BOTH Urdu and English versions of minutes/summary in DB
- Translation endpoint: POST /api/v1/translate/{meeting_id}?target=en|ur
  → Uses Claude to translate the full transcript and minutes

== ACTION ITEMS EXTRACTION ==
- Use Claude tool_use / structured output
- Return JSON array: [{ "task": str, "owner": str | null, "deadline": str | null, "context": str }]
- Store in action_items table linked to meeting_id
- Frontend displays them in a dedicated ActionItemsPanel component

== EXPORT ==
BaseExporter interface:
  abstract def export(meeting: MeetingData) -> bytes

Subclasses: PDFExporter, DocxExporter, SrtExporter, GDocsExporter

Export endpoint: POST /api/v1/export/{meeting_id}/{format}
  Accepted formats: "pdf", "docx", "srt", "gdocs"

== AUTHENTICATION ==
All endpoints require Supabase JWT in Authorization header.
Middleware decodes JWT, injects user_id into request state.

== ERROR HANDLING ==
Define exception hierarchy:
  AppException (base)
  ├── UploadException
  ├── ProcessingException
  │   ├── TranscriptionException
  │   ├── DiarizationException
  │   └── AIGenerationException
  └── ExportException

Return structured error responses:
  { "error": { "code": str, "message": str, "details": any } }

== ENVIRONMENT VARIABLES ==
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=            # for Whisper API (if using hosted)
HUGGINGFACE_TOKEN=         # for PyAnnote model download
REDIS_URL=
WHISPER_MODE=              # "local" or "api"
WHISPER_MODEL_SIZE=        # large-v3 (recommended) or medium, small
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

Generate:
1. All service files with docstrings
2. All Celery task files
3. All API route files
4. models/ Pydantic schemas
5. docker-compose.yml with FastAPI + Celery Worker + Redis
6. requirements.txt
```

---

## 6. AI Pipeline — Detailed Design & Prompts

### 6.1 Whisper — Complete Guide

#### Local vs Hosted API: Which to Use?

| | Local Whisper (`openai-whisper` pip) | OpenAI Whisper API |
|---|---|---|
| **Cost** | Free after setup | ~$0.006/min |
| **Speed** | Fast on GPU, slow on CPU | Fast always |
| **Privacy** | Audio never leaves your server | Audio sent to OpenAI |
| **Urdu quality** | ✅ Excellent (large-v3) | ✅ Good |
| **Setup** | Needs GPU + ffmpeg + ~3GB model | Just an API key |
| **Best for** | Production (cost at scale) | Prototyping / no GPU |

**Recommendation:** Use local Whisper in production (GPU server or Celery worker with GPU). Use OpenAI API during development/prototyping. Control this with `WHISPER_MODE=local|api` env var.

---

#### Model Size Comparison

| Model | Size | Speed (CPU) | Speed (GPU) | Urdu Accuracy | Use Case |
|-------|------|------------|------------|---------------|----------|
| `tiny` | 75MB | Very fast | Very fast | Poor | Testing only |
| `base` | 145MB | Fast | Fast | Fair | Dev/testing |
| `small` | 244MB | Medium | Fast | Good | Low-resource prod |
| `medium` | 769MB | Slow | Medium | Very good | Balanced |
| `large-v2` | 1.5GB | Very slow | Medium | Excellent | Production |
| `large-v3` | 1.5GB | Very slow | Medium | **Best** | **Recommended** |

**Always use `large-v3` for Urdu/English code-switching in production.** The accuracy gap between medium and large-v3 on Urdu is significant (~15-20% WER improvement).

---

#### Installation

```bash
# Local Whisper
pip install openai-whisper
pip install faster-whisper       # 4x faster, same accuracy (recommended for prod)
apt-get install ffmpeg            # required

# CUDA support (GPU)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

---

#### Local Whisper Client (Full Implementation)

```python
# ai/whisper_client.py
import os
from faster_whisper import WhisperModel
from anthropic import Anthropic

WHISPER_MODE = os.getenv("WHISPER_MODE", "local")
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "large-v3")

# ── BILINGUAL INITIAL PROMPT ──────────────────────────────────────────
# CRITICAL: This primes Whisper to expect Urdu + English mixing.
# Without this, Whisper often transcribes Urdu words as gibberish
# Roman Urdu or garbled English phonetics.
URDU_ENGLISH_PROMPT = (
    "یہ ایک پاکستانی میٹنگ کی ریکارڈنگ ہے۔ "         # Urdu script
    "This is a Pakistani professional meeting. "
    "Speakers may freely mix Urdu and English. "
    "Common Urdu words: کام، میٹنگ، ٹھیک ہے، ابھی، کل، آج۔"
)

class WhisperClient:
    """
    Wrapper for Whisper transcription.
    Supports both local faster-whisper and OpenAI hosted API.
    
    SOLID: Single Responsibility — only handles transcription.
    GRASP: Information Expert — owns all transcription config.
    """
    
    def __init__(self):
        if WHISPER_MODE == "local":
            # Load model once at startup (expensive operation)
            # Device: "cuda" if GPU available, else "cpu"
            device = "cuda" if self._cuda_available() else "cpu"
            compute_type = "float16" if device == "cuda" else "int8"
            self.model = WhisperModel(
                WHISPER_MODEL_SIZE,
                device=device,
                compute_type=compute_type
            )
        self.mode = WHISPER_MODE

    def transcribe(self, audio_path: str) -> list[dict]:
        """
        Transcribe audio file. Returns list of segments.
        
        Returns:
            [{ "start": float, "end": float, "text": str, "language": str }]
        """
        if self.mode == "local":
            return self._transcribe_local(audio_path)
        return self._transcribe_api(audio_path)

    def _transcribe_local(self, audio_path: str) -> list[dict]:
        """Use faster-whisper for local transcription."""
        segments, info = self.model.transcribe(
            audio_path,
            language=None,                    # Auto-detect language per segment
            task="transcribe",                # Do NOT use "translate" — keep original lang
            initial_prompt=URDU_ENGLISH_PROMPT,
            word_timestamps=True,             # Needed for accurate SRT generation
            condition_on_previous_text=True,  # Better continuity across segments
            vad_filter=True,                  # Voice Activity Detection: skip silence
            vad_parameters={
                "min_silence_duration_ms": 500  # Skip silences > 0.5 seconds
            }
        )
        
        return [
            {
                "start": seg.start,
                "end": seg.end,
                "text": seg.text.strip(),
                "language": info.language,    # "ur", "en", or "auto"
                "words": [
                    {"word": w.word, "start": w.start, "end": w.end}
                    for w in (seg.words or [])
                ]
            }
            for seg in segments
        ]

    def _transcribe_api(self, audio_path: str) -> list[dict]:
        """Use OpenAI hosted Whisper API (for dev/prototyping)."""
        from openai import OpenAI
        client = OpenAI()
        
        with open(audio_path, "rb") as f:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="verbose_json",   # Returns segments with timestamps
                timestamp_granularities=["segment", "word"],
                prompt=URDU_ENGLISH_PROMPT
            )
        
        return [
            {
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
                "language": response.language,
                "words": seg.get("words", [])
            }
            for seg in response.segments
        ]

    @staticmethod
    def _cuda_available() -> bool:
        try:
            import torch
            return torch.cuda.is_available()
        except ImportError:
            return False
```

---

#### Handling Large Files (Chunking Strategy)

For recordings over 30 minutes, Whisper can run out of memory or produce drift in timestamps. Use chunk-based processing:

```python
# workers/tasks/transcribe.py
import subprocess

def extract_audio_chunks(audio_path: str, chunk_minutes: int = 10) -> list[str]:
    """
    Split audio into N-minute chunks using FFmpeg.
    Returns list of chunk file paths.
    """
    chunk_paths = []
    duration = get_audio_duration(audio_path)   # via ffprobe
    chunk_secs = chunk_minutes * 60
    
    for i, start in enumerate(range(0, int(duration), chunk_secs)):
        out_path = f"/tmp/chunk_{i}.wav"
        subprocess.run([
            "ffmpeg", "-i", audio_path,
            "-ss", str(start),
            "-t", str(chunk_secs),
            "-ar", "16000",    # 16kHz sample rate (Whisper requirement)
            "-ac", "1",        # Mono channel
            "-y", out_path
        ], check=True)
        chunk_paths.append((out_path, start))   # (path, time_offset)
    
    return chunk_paths

def transcribe_chunked(audio_path: str) -> list[dict]:
    """Transcribe in chunks, adjust timestamps by offset."""
    client = WhisperClient()
    all_segments = []
    
    for chunk_path, time_offset in extract_audio_chunks(audio_path):
        segments = client.transcribe(chunk_path)
        # Adjust timestamps by chunk start offset
        for seg in segments:
            seg["start"] += time_offset
            seg["end"] += time_offset
        all_segments.extend(segments)
    
    return all_segments
```

---

#### Audio Pre-processing (FFmpeg Pipeline)

Before passing audio to Whisper, normalize it for best accuracy:

```python
def preprocess_audio(input_path: str) -> str:
    """
    Convert any video/audio to Whisper-optimized WAV.
    - 16kHz sample rate (Whisper's native rate)
    - Mono channel
    - Normalize volume (loudnorm filter)
    - Remove background noise where possible
    """
    out_path = input_path.replace(input_path.split(".")[-1], "wav")
    
    subprocess.run([
        "ffmpeg", "-i", input_path,
        "-ar", "16000",          # 16kHz — Whisper requirement
        "-ac", "1",              # Mono
        "-af", "loudnorm",       # Normalize volume levels
        "-y", out_path
    ], check=True)
    
    return out_path
```

---

#### Language Detection Logic

Whisper returns a detected language per transcription. Use this to:
1. Detect if the meeting is Urdu, English, or mixed
2. Store `languages_detected` in DB
3. Show "Urdu + English detected" badge on the Processing page

```python
def detect_meeting_language(segments: list[dict]) -> list[str]:
    """
    Returns list of unique languages found in the transcript.
    e.g. ["ur", "en"] for a bilingual meeting
    """
    langs = set(seg.get("language", "en") for seg in segments)
    return sorted(list(langs))
```

**Note on Roman Urdu:** Whisper may sometimes transcribe spoken Urdu in Roman script (e.g., "theek hai" instead of "ٹھیک ہے"). The `initial_prompt` reduces this significantly but doesn't eliminate it entirely. For production, consider a post-processing step with Claude to normalize Roman Urdu to Urdu script:

```python
# In generate_minutes.py — add a normalization step before minutes generation
ROMAN_URDU_NORMALIZATION_PROMPT = """
The following transcript may contain some Urdu words written in Roman script 
(e.g. "theek hai", "kya baat hai", "bilkul"). 
Convert all Roman Urdu to proper Urdu script where you are confident.
Leave English words in English. Return only the corrected transcript.
"""
```

---

### 6.2 PyAnnote Speaker Diarization

```python
# ai/pyannote_client.py
from pyannote.audio import Pipeline

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token=HUGGINGFACE_TOKEN
)

# Run diarization
diarization = pipeline(audio_file, num_speakers=None)  # auto-detect

# Output: list of (segment, _, speaker_label)
# segment.start, segment.end, speaker_label → "SPEAKER_00", "SPEAKER_01"
```

---

### 6.3 Segment Merge Algorithm

After Whisper and PyAnnote run independently, merge by temporal overlap:

```python
def merge_segments(transcript: list[dict], diarization: list[dict]) -> list[dict]:
    """
    For each transcript segment, find the speaker with maximum overlap.
    Returns: [{ start, end, speaker, text, language }]
    
    SOLID: Single responsibility — this function does ONLY alignment.
    """
    merged = []
    for t_seg in transcript:
        best_speaker = find_best_speaker(t_seg, diarization)
        merged.append({
            "start": t_seg["start"],
            "end": t_seg["end"],
            "speaker": best_speaker or "Unknown",
            "text": t_seg["text"],
            "language": t_seg.get("language", "auto")
        })
    return merged
```

---

### 6.4 Claude Minutes Generation Prompt

```python
# ai/prompts/minutes_prompt.py

SYSTEM_PROMPT = """
You are a professional meeting secretary specializing in bilingual 
Pakistani corporate and academic meetings. You generate clear, 
structured meeting minutes from transcripts that may contain 
a mixture of Urdu and English (code-switching).

Rules:
- Always produce output in the requested output_language
- If output_language is "ur", write in Urdu script (not Roman Urdu)
- If output_language is "en", write in formal English
- Preserve technical terms in their original language
- Do not fabricate information not present in the transcript
- Use the speakers' names if provided, otherwise use Person 1, Person 2, etc.
"""

def build_minutes_prompt(transcript: str, output_language: str = "en") -> str:
    return f"""
Here is the meeting transcript with speaker labels and timestamps:

<transcript>
{transcript}
</transcript>

Generate meeting minutes in {output_language} with this exact structure:

## Meeting Minutes

**Date:** [extract from transcript or write "Not specified"]
**Attendees:** [list all speakers]
**Duration:** [calculate from timestamps]

### Agenda / Topics Discussed
[Bullet points of main topics]

### Key Discussion Points
[Per topic: what was discussed, by whom, key decisions]

### Decisions Made
[Numbered list of formal decisions]

### Action Items
[Format: Task | Owner | Deadline]

### Next Steps
[Summary of what happens next]

---
*Minutes generated by MeetMind AI*
"""
```

---

### 6.5 Claude Action Items Extraction Prompt

```python
# ai/prompts/action_items_prompt.py

def build_action_items_prompt(transcript: str) -> str:
    return f"""
Analyze this meeting transcript and extract ALL action items, tasks, 
and commitments mentioned by participants.

<transcript>
{transcript}
</transcript>

Return a JSON array ONLY. No explanation, no markdown fences. 
Each object must have:
{{
  "task": "clear description of what needs to be done",
  "owner": "person responsible (or null if not specified)",
  "deadline": "deadline mentioned (or null if not mentioned)",
  "context": "brief sentence explaining why this task came up",
  "priority": "high | medium | low (your assessment)"
}}

If no action items exist, return: []
"""
```

---

### 6.6 Claude Translation Prompt

```python
# ai/prompts/translation_prompt.py

def build_translation_prompt(text: str, source_lang: str, target_lang: str) -> str:
    lang_names = {"en": "English", "ur": "Urdu"}
    
    return f"""
Translate the following meeting minutes from {lang_names[source_lang]} to {lang_names[target_lang]}.

Rules:
- If translating to Urdu, use Urdu script (not Roman Urdu)
- Preserve all proper nouns, technical terms, and brand names as-is
- Maintain the exact same document structure and formatting
- Keep timestamps and speaker labels unchanged
- Translate naturally — do not translate word-for-word awkwardly

<source_text>
{text}
</source_text>

Return only the translated text. No explanation.
"""
```

---

## 7. Frontend — Design System & Prompt

### 7.1 Design Philosophy

**Aesthetic Direction: "Precision Intelligence" — Dark editorial, data-forward, surgical UI**

Think: the feeling of a high-end terminal meets a Bloomberg terminal meets a Tokyo architectural magazine. Dark backgrounds with warm amber/gold accents, monospace typography for transcripts, sharp geometric layouts, and purposeful animation.

**Color Palette:**
```css
:root {
  --bg-primary: #0a0a0f;        /* Deep near-black */
  --bg-secondary: #111118;      /* Card backgrounds */
  --bg-tertiary: #1a1a24;       /* Elevated panels */
  --border: #2a2a38;            /* Subtle borders */
  --accent-gold: #f59e0b;       /* Primary accent — warm amber */
  --accent-gold-dim: #92400e;   /* Dimmed accent for backgrounds */
  --accent-teal: #14b8a6;       /* Secondary accent — transcripts */
  --accent-red: #ef4444;        /* Errors, deletions */
  --text-primary: #f1f5f9;      /* Main text */
  --text-secondary: #94a3b8;    /* Muted labels */
  --text-tertiary: #475569;     /* Very muted hints */
  --speaker-1: #f59e0b;         /* Speaker color coding */
  --speaker-2: #14b8a6;
  --speaker-3: #8b5cf6;
  --speaker-4: #ec4899;
}
```

**Typography:**
```css
/* Display: Clash Display — bold, geometric, authoritative */
@import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,600&display=swap');

/* Body: Plus Jakarta Sans — modern, readable, clean */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

/* Transcript/Code: JetBrains Mono — technical precision */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

--font-display: 'Clash Display', sans-serif;
--font-body: 'Plus Jakarta Sans', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

---

### 7.2 Page Structure & Components

```
src/
├── App.tsx
├── main.tsx
├── index.css              # Tailwind + CSS variables
│
├── pages/
│   ├── Landing.tsx        # Hero + feature overview
│   ├── Dashboard.tsx      # Meeting history list
│   ├── Upload.tsx         # File upload page
│   ├── Processing.tsx     # Live job status page
│   └── Meeting.tsx        # Full meeting view (main app page)
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx       # Sidebar + main area layout
│   │   ├── Sidebar.tsx        # Navigation
│   │   └── TopBar.tsx         # User, credits, settings
│   │
│   ├── upload/
│   │   ├── DropZone.tsx       # Drag & drop file area
│   │   ├── UploadProgress.tsx # Chunked upload progress bar
│   │   └── FilePreview.tsx    # File info before upload
│   │
│   ├── processing/
│   │   ├── JobStatusCard.tsx  # Animated status tracker
│   │   └── PipelineSteps.tsx  # Shows each AI step live
│   │
│   ├── meeting/
│   │   ├── TranscriptPanel.tsx    # Scrollable timestamped transcript
│   │   ├── SpeakerSegment.tsx     # Individual speaker block
│   │   ├── MinutesPanel.tsx       # Generated meeting minutes
│   │   ├── ActionItemsPanel.tsx   # Extracted tasks list
│   │   ├── SpeakerLegend.tsx      # Color-coded speaker list
│   │   └── LanguageToggle.tsx     # Urdu / English switch
│   │
│   ├── export/
│   │   ├── ExportMenu.tsx         # Export format picker
│   │   └── ShareModal.tsx         # Share link + Google Docs
│   │
│   └── ui/
│       ├── GlowButton.tsx         # CTA button with ambient glow
│       ├── StatusBadge.tsx        # Queued/Processing/Done badges
│       └── Skeleton.tsx           # Loading placeholders
│
├── stores/
│   ├── authStore.ts           # Supabase auth state
│   ├── meetingStore.ts        # Current meeting data
│   └── uiStore.ts             # Language, theme, panel states
│
├── hooks/
│   ├── useJobPolling.ts       # TanStack Query job status polling
│   ├── useUpload.ts           # Chunked upload logic
│   └── useExport.ts           # Export API calls
│
├── lib/
│   ├── supabase.ts            # Supabase client init
│   ├── api.ts                 # Axios instance + interceptors
│   └── utils.ts               # cn(), formatTime(), etc.
│
└── types/
    ├── meeting.ts
    ├── job.ts
    └── export.ts
```

---

### 7.3 Full Frontend Design Prompt

**Paste this into your AI frontend builder (v0.dev, Cursor, Bolt, etc.):**

```
You are a senior frontend engineer and UI/UX designer. Build the complete 
React frontend for MeetMind AI — a premium AI-powered meeting transcription app.

== DESIGN SYSTEM ==

Aesthetic: "Precision Intelligence" — dark editorial with amber/teal accents.
Think Bloomberg terminal meets Vercel dashboard meets Tokyo typographic design.

Color palette (CSS variables):
--bg-primary: #0a0a0f
--bg-secondary: #111118
--bg-tertiary: #1a1a24
--border: #2a2a38
--accent-gold: #f59e0b
--accent-teal: #14b8a6
--accent-red: #ef4444
--text-primary: #f1f5f9
--text-secondary: #94a3b8
--text-tertiary: #475569
Speaker colors: amber (#f59e0b), teal (#14b8a6), violet (#8b5cf6), pink (#ec4899)

Fonts:
- Display headings: Clash Display (700 weight) from Fontshare
- Body/UI: Plus Jakarta Sans from Google Fonts
- Transcript text: JetBrains Mono (monospace, technical feel)

Use Tailwind CSS + Shadcn/ui + Framer Motion + React Hook Form + Zod.

== PAGE: Landing ==
Hero section:
- Full-viewport dark section
- Animated waveform visualization (CSS or canvas) representing audio
- Heading: "Your meetings, understood." in Clash Display 72px
- Subheading: "Transcribe Urdu & English meetings in minutes. AI-powered minutes, action items, and exports."
- Two CTAs: "Start Free" (amber glow button) and "Watch Demo" (ghost button)
- Feature grid (4 cards): Transcription, Speaker ID, Action Items, Multi-format Export
- Each card has an icon, title, one-line description
- Subtle grid texture overlay on dark background
- Staggered fade-in animation on scroll (Framer Motion whileInView)

== PAGE: Upload ==
Main upload area:
- Large centered DropZone (drag & drop)
- Dashed amber border with hover state (border glows gold)
- Inside: Upload icon + "Drop your meeting file here" + "or browse"
- Accepted formats: MP4, MOV, AVI, MP3, WAV, M4A, OGG, WEBM
- Max 10GB, show human-readable file size limit
- After file select: show FilePreview card (filename, size, duration estimate, format icon)
- Chunked upload progress bar: animated amber fill with percentage + "Uploading... X.X MB/s"
- On complete: auto-navigate to Processing page

== PAGE: Processing ==
Job Status Tracker:
- Dark card in center of screen
- Large filename at top with muted file type badge
- Vertical stepper showing pipeline stages:
  1. "File Uploaded" — always complete first
  2. "Converting Audio" — FFmpeg step
  3. "Transcribing" — Whisper (shows language detected: "Urdu + English detected")
  4. "Identifying Speakers" — PyAnnote (shows speaker count as detected: "3 speakers found")
  5. "Generating Minutes" — Claude
  6. "Extracting Action Items" — Claude
  7. "Preparing Exports" — Export generation
- Each completed step: amber checkmark + timestamp
- Current active step: pulsing amber dot + animated ellipsis "..."
- Pending steps: muted text
- Below stepper: estimated time remaining (if available)
- Poll every 3 seconds using TanStack Query refetchInterval
- On completion: fade out and reveal "Meeting Ready →" with animated arrow

== PAGE: Meeting (Main) ==
Three-panel layout:
LEFT PANEL (30%): 
- "Transcript" header with speaker count badge
- SpeakerLegend: colored dot + "Person 1 → [editable name field]"
- Scrollable transcript: each segment is a SpeakerSegment
  - Speaker dot (colored by speaker) + speaker name
  - Timestamp in JetBrains Mono (muted teal, small)
  - Transcript text in Plus Jakarta Sans
  - Urdu segments: automatically set dir="rtl", larger font
  - Hover: shows "Jump to" timestamp button

CENTER PANEL (40%):
- Tab switcher: "Minutes" | "Action Items"
- Minutes tab:
  - Rendered Markdown meeting minutes
  - LanguageToggle at top: [EN] [اردو] pill toggle
    - Switching language calls translate API + re-renders minutes
    - Urdu view: dir="rtl", larger Urdu-suitable font, right-aligned
  - Clean markdown rendering: headings, bold, tables supported
- Action Items tab:
  - List of extracted tasks as cards
  - Each card: Task description | Owner tag | Deadline badge | Priority dot
  - Priority: red=high, amber=medium, green=low
  - Checkbox to mark complete (local state)
  - "Copy All" button copies action items as formatted text

RIGHT PANEL (30%):
- Meeting metadata: date, duration, speaker count, language mix
- Export section with format buttons:
  - [PDF] — downloads instantly
  - [DOCX] — downloads instantly  
  - [SRT] — downloads raw transcript as subtitle file
  - [Google Docs] — opens modal to connect Google account
- Each button has icon + label + subtle hover glow

Export button behavior:
- On click: show loading spinner inside button
- On success: brief green checkmark flash → back to normal
- On error: red flash + error tooltip

Mobile behavior:
- Stack panels vertically
- Show tab selector: Transcript | Minutes | Actions | Export
- Responsive Tailwind breakpoints

== COMPONENT: DropZone ==
- Use react-dropzone
- Accept: video/*, audio/*
- On drop: validate file type and size
- Visual feedback: green border flash on valid drop, red on invalid

== COMPONENT: SpeakerSegment ==
Props: { speaker: string, color: string, timestamp: number, text: string, isRTL: boolean }
- Left: colored vertical bar (2px, speaker color)
- Header: speaker name (small, colored) + timestamp (JetBrains Mono, teal, smaller)
- Body: transcript text (dir="rtl" if isRTL)
- Hover: highlight bg-tertiary, show timestamp jump button

== COMPONENT: LanguageToggle ==
- Pill-style toggle: [English] [اردو]
- Smooth sliding indicator animation (Framer Motion layoutId)
- On switch: show skeleton loader while translation loads
- If translation not yet generated: trigger API call on first switch

== COMPONENT: ActionItemsPanel ==
- Each action item is a card with:
  - Left: priority dot (red/amber/green)
  - Main: task text in bold
  - Tags row: owner tag (amber badge), deadline badge (teal), context text (muted)
  - Right: checkbox
- At top: filter buttons (All | Mine | Overdue)
- At bottom: "Export Action Items" button (copy as markdown table)

== STATE MANAGEMENT (Zustand) ==
authStore: { user, session, login(), logout() }
meetingStore: { meeting, transcript, minutes, actionItems, outputLanguage, setOutputLanguage() }
uiStore: { activeMeetingPanel, exportLoading, speakerNames, renameSpeaker() }

== SUPABASE INTEGRATION ==
- supabase.ts: init Supabase client with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
- Auth: use Supabase Auth UI component for login/signup, then store session in authStore
- All API calls include Supabase JWT in Authorization header

== ANIMATIONS (Framer Motion) ==
- Page transitions: fade + slight upward slide (y: 10 → 0, opacity: 0 → 1)
- Stagger children in processing stepper (staggerChildren: 0.1)
- Language toggle: smooth layoutId animation
- Upload progress bar: smooth spring animation on width change
- Action items: AnimatePresence for add/remove

== ACCESSIBILITY ==
- All interactive elements keyboard navigable
- ARIA labels on icon-only buttons
- Color contrast ≥ 4.5:1 for all text
- dir="rtl" set correctly on all Urdu text

== RESPONSIVE BREAKPOINTS ==
- Mobile (<768px): single-column, tab navigation
- Tablet (768-1024px): 2-column (transcript + tabbed right panel)
- Desktop (>1024px): full 3-panel layout

Build this with TypeScript strict mode. Use path aliases (@/components etc.). 
Export each component as a named export. Include JSDoc for all hook functions.
```

---

## 8. Database Schema

All tables live in Supabase PostgreSQL.

```sql
-- Users table (managed by Supabase Auth, extended here)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs: track the async processing pipeline
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('queued','processing','completed','failed')),
    step TEXT,                          -- current pipeline step
    file_url TEXT NOT NULL,             -- Supabase Storage URL
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings: final output of a completed job
CREATE TABLE public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID UNIQUE NOT NULL REFERENCES public.jobs(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT,
    duration_seconds INTEGER,
    languages_detected TEXT[],          -- e.g. ['ur', 'en']
    speaker_count INTEGER,
    transcript_raw JSONB,               -- [{ start, end, speaker, text, language }]
    minutes_en TEXT,                    -- English minutes (Markdown)
    minutes_ur TEXT,                    -- Urdu minutes (Markdown), generated on demand
    summary_en TEXT,
    summary_ur TEXT,
    share_token TEXT UNIQUE,            -- for shareable links
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Speakers: per-meeting speaker labels (renameable)
CREATE TABLE public.speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    speaker_key TEXT NOT NULL,          -- "SPEAKER_00" from PyAnnote
    display_name TEXT NOT NULL,         -- "Person 1" default, user-editable
    color TEXT,                         -- hex color for UI
    UNIQUE (meeting_id, speaker_key)
);

-- Action Items: extracted from transcript
CREATE TABLE public.action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    owner TEXT,
    deadline TEXT,
    context TEXT,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exports: track generated export files
CREATE TABLE public.exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('pdf', 'docx', 'srt')),
    file_url TEXT NOT NULL,             -- Supabase Storage URL
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their meetings" ON public.meetings
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their action items" ON public.action_items
    FOR ALL USING (
        meeting_id IN (SELECT id FROM public.meetings WHERE user_id = auth.uid())
    );
```

---

## 9. API Contract

### Upload

```
POST /api/v1/upload
Authorization: Bearer <supabase_jwt>
Content-Type: multipart/form-data

Body: file (binary, chunked)

Response 202:
{
  "job_id": "uuid",
  "status": "queued",
  "estimated_seconds": 120
}
```

### Job Status

```
GET /api/v1/jobs/{job_id}
Authorization: Bearer <supabase_jwt>

Response 200:
{
  "job_id": "uuid",
  "status": "processing",
  "step": "transcribing",
  "progress_pct": 45,
  "meeting_id": null  // populated when completed
}
```

### Get Meeting

```
GET /api/v1/meetings/{meeting_id}
Authorization: Bearer <supabase_jwt>

Response 200:
{
  "id": "uuid",
  "title": "Q3 Planning Meeting",
  "duration_seconds": 3612,
  "languages_detected": ["ur", "en"],
  "speaker_count": 3,
  "transcript": [...],
  "minutes_en": "## Meeting Minutes...",
  "minutes_ur": null,  // null until first translate call
  "action_items": [...]
}
```

### Translate

```
POST /api/v1/translate/{meeting_id}?target=ur
Authorization: Bearer <supabase_jwt>

Response 200:
{
  "meeting_id": "uuid",
  "language": "ur",
  "minutes": "## میٹنگ کی کارروائی..."
}
```

### Export

```
POST /api/v1/export/{meeting_id}/{format}
Authorization: Bearer <supabase_jwt>
format: pdf | docx | srt | gdocs

Response 200 (pdf/docx/srt):
{
  "download_url": "https://supabase.../exports/file.pdf",
  "expires_at": "2026-01-01T00:00:00Z"
}

Response 200 (gdocs):
{
  "external_url": "https://docs.google.com/document/d/...",
  "message": "Document created in your Google Drive"
}
```

---

## 10. SOLID & GRASP Application Map

| Principle | Where Applied | How |
|-----------|--------------|-----|
| **SRP** | All service classes | `TranscriptionService` only calls Whisper. `MinutesService` only calls Claude. No service does two things. |
| **OCP** | `BaseExporter` | Add new export format = add subclass. Never modify existing exporters. |
| **LSP** | `BaseExporter` subclasses | All exporters accept `MeetingData`, return `bytes`. Fully substitutable. |
| **ISP** | Service interfaces | `ITranscriptionService` only has `transcribe()`. No fat interfaces. |
| **DIP** | All services | Services receive `supabase_client`, `anthropic_client` via `__init__`. No `import X; x = X()` inside methods. |
| **Information Expert** (GRASP) | `MergeService` | Owns merging logic because it holds both transcript + diarization data. |
| **Creator** (GRASP) | `ProcessPipeline` task | Creates sub-tasks (transcribe, diarize, etc.) because it orchestrates the full flow. |
| **Controller** (GRASP) | API route handlers | Routes delegate to services, zero business logic in route files. |
| **Low Coupling** (GRASP) | Workers folder | `tasks/transcribe.py` imports only `WhisperClient`. No circular deps. |
| **High Cohesion** (GRASP) | `ai/prompts/` folder | Only prompt builders live here. No API calls, no DB access. |

---

## 11. Supabase MCP Integration

The Supabase MCP (Model Context Protocol) server can be used to directly query and manage your Supabase project from Claude or your CI pipeline.

### Setup

```bash
# .env
SUPABASE_MCP_URL=https://mcp.supabase.com
SUPABASE_ACCESS_TOKEN=<your_personal_access_token>
SUPABASE_PROJECT_REF=<your_project_ref>
```

### What Supabase MCP Enables

| Use Case | Supabase MCP Tool | Benefit |
|----------|------------------|---------|
| Auto-migrate DB | `apply_migration` | Push schema changes from code |
| Debug jobs | `execute_sql` | Query `jobs` table directly in Claude |
| Inspect RLS | `list_tables` + `get_table` | Verify security policies |
| Manage storage | `list_buckets` | Check file storage from Claude |
| Monitor live | `get_logs` | Tail Supabase logs during dev |

### Recommended Buckets

```
meeting-files/         → raw uploaded audio/video (private)
  └── {user_id}/{job_id}/original.{ext}

exports/               → generated PDF, DOCX, SRT files (private, signed URLs)
  └── {user_id}/{meeting_id}/{format}.{ext}
```

Storage policies: users can only access their own folders.

---

## 12. Export Pipeline

### PDF Export (WeasyPrint)

```python
# exporters/pdf_exporter.py
class PDFExporter(BaseExporter):
    def export(self, meeting: MeetingData) -> bytes:
        html = render_template("meeting_minutes.html", meeting=meeting)
        return weasyprint.HTML(string=html).write_pdf()
```

PDF HTML template must include:
- MeetMind AI header with meeting title and date
- Attendees list
- Minutes section (rendered from Markdown → HTML)
- Action items table with priority colors
- Transcript appendix (optional toggle)
- Page numbers in footer

### DOCX Export (python-docx)

```python
# exporters/docx_exporter.py
class DocxExporter(BaseExporter):
    def export(self, meeting: MeetingData) -> bytes:
        doc = Document()
        # Add heading, attendees, minutes sections
        # Add action items as formatted table
        # Apply styles: dark heading = #1a1a24 background
        buffer = BytesIO()
        doc.save(buffer)
        return buffer.getvalue()
```

### SRT Export (Custom)

```python
# exporters/srt_exporter.py
class SrtExporter(BaseExporter):
    def export(self, meeting: MeetingData) -> bytes:
        lines = []
        for i, seg in enumerate(meeting.transcript, start=1):
            start = format_srt_time(seg["start"])
            end = format_srt_time(seg["end"])
            speaker = seg["speaker"]
            text = seg["text"].strip()
            lines.append(f"{i}\n{start} --> {end}\n[{speaker}] {text}\n")
        return "\n".join(lines).encode("utf-8")

def format_srt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
```

### Google Docs Export

```python
# exporters/gdocs_exporter.py
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

class GDocsExporter(BaseExporter):
    """
    Exports meeting minutes to a new Google Doc in the user's Drive.
    Requires user's Google OAuth2 tokens (stored in Supabase user_profiles).
    
    OAuth Flow:
    1. User clicks "Connect Google" → frontend redirects to Google OAuth consent
    2. Backend receives auth code → exchanges for access_token + refresh_token
    3. Tokens stored encrypted in user_profiles table
    4. Used here for each export
    """
    
    def export(self, meeting: MeetingData, google_tokens: dict) -> dict:
        creds = Credentials(
            token=google_tokens["access_token"],
            refresh_token=google_tokens["refresh_token"],
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            token_uri="https://oauth2.googleapis.com/token"
        )
        
        docs_service = build("docs", "v1", credentials=creds)
        drive_service = build("drive", "v3", credentials=creds)
        
        # Create blank document
        doc = docs_service.documents().create(
            body={"title": meeting.title or "Meeting Minutes"}
        ).execute()
        doc_id = doc["documentId"]
        
        # Insert formatted content via batchUpdate
        requests = build_gdocs_requests(meeting)
        docs_service.documents().batchUpdate(
            documentId=doc_id,
            body={"requests": requests}
        ).execute()
        
        doc_url = f"https://docs.google.com/document/d/{doc_id}/edit"
        return {"external_url": doc_url}


def build_gdocs_requests(meeting: MeetingData) -> list[dict]:
    """
    Build Google Docs API batchUpdate requests for meeting content.
    Inserts: title, attendees, minutes sections, action items table.
    """
    requests = []
    index = 1  # Google Docs insertion index (starts at 1)
    
    # Helper to append text with style
    def insert_text(text, style=None):
        nonlocal index
        req = [{"insertText": {"location": {"index": index}, "text": text}}]
        if style:
            req.append({"updateParagraphStyle": {
                "range": {"startIndex": index, "endIndex": index + len(text)},
                "paragraphStyle": {"namedStyleType": style},
                "fields": "namedStyleType"
            }})
        index += len(text)
        return req
    
    requests.extend(insert_text(f"{meeting.title}\n", "HEADING_1"))
    requests.extend(insert_text(f"Date: {meeting.date or 'Not specified'}\n"))
    requests.extend(insert_text(f"Duration: {meeting.duration_formatted}\n"))
    requests.extend(insert_text("\nMeeting Minutes\n", "HEADING_2"))
    requests.extend(insert_text(meeting.minutes_en + "\n"))
    
    return requests
```

**Google OAuth Setup:**
```python
# api/v1/auth_google.py
# Endpoint to initiate Google OAuth flow

GET /api/v1/auth/google
  → Redirects user to Google OAuth consent screen
  → Scopes: ["https://www.googleapis.com/auth/documents", 
             "https://www.googleapis.com/auth/drive.file"]

GET /api/v1/auth/google/callback?code=...
  → Exchanges code for tokens
  → Stores encrypted tokens in user_profiles.google_tokens (JSONB)
  → Redirects back to frontend
```

---

## 13. Security & Error Handling

### Auth Middleware

```python
# core/auth.py
async def verify_token(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    user = supabase.auth.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user.user
```

### File Validation

```python
ALLOWED_MIME_TYPES = {
    "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm",
    "audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/webm"
}
MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024  # 10GB

def validate_upload(file: UploadFile):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise UploadException(f"Unsupported file type: {file.content_type}")
    if file.size > MAX_FILE_SIZE:
        raise UploadException("File exceeds 10GB limit")
```

### Rate Limiting

```python
# Use slowapi (FastAPI rate limiter)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/v1/upload")
@limiter.limit("10/hour")  # 10 uploads per hour per user
async def upload_file(...):
    ...
```

---

## 14. Development Phases & Checklist

### Phase 1 — Foundation (Week 1-2)
- [ ] Supabase project setup (DB, Storage, Auth)
- [ ] FastAPI skeleton with auth middleware
- [ ] Basic file upload endpoint (no processing)
- [ ] Celery + Redis with a test task
- [ ] React app scaffold (Vite + TypeScript + Tailwind)
- [ ] Supabase Auth UI integration
- [ ] Basic upload page (DropZone + progress bar)

### Phase 2 — Core AI Pipeline (Week 3-4)
- [ ] FFmpeg audio extraction worker
- [ ] Whisper transcription (with Urdu initial_prompt)
- [ ] PyAnnote diarization
- [ ] Segment merge algorithm
- [ ] Job status polling (frontend + backend)
- [ ] Processing page with live stepper

### Phase 3 — Minutes & Output (Week 5)
- [ ] Claude minutes generation
- [ ] Claude action items extraction
- [ ] Meeting view page (3-panel layout)
- [ ] Transcript rendering with speaker colors
- [ ] Language toggle (EN/UR) with translation

### Phase 4 — Exports (Week 6)
- [ ] PDF export (WeasyPrint)
- [ ] DOCX export (python-docx)
- [ ] SRT export
- [ ] Google Docs export (OAuth flow + Docs API)

### Phase 5 — Polish (Week 7)
- [ ] Speaker renaming (Person 1 → Ali)
- [ ] Shareable meeting links
- [ ] Dashboard with meeting history
- [ ] Mobile responsiveness
- [ ] Error handling + loading states throughout
- [ ] Accessibility audit

---

*Blueprint authored for MeetMind AI — Version 2.0*  
*Changes: Notion removed everywhere; Whisper section fully expanded (local vs API, model sizes, chunking, audio pre-processing, language detection, Roman Urdu normalization); Google Docs exporter added with full OAuth flow.*  
*Stack: React + FastAPI + Celery + Supabase + Claude + Whisper (faster-whisper) + PyAnnote*
