from app.ai.claude_client import ClaudeClient
from app.workers.tasks.merge_segments import transcript_to_text
from app.config import settings

def generate_minutes(merged_transcript: list[dict], output_language: str = "en") -> str:
    """Generate minutes from transcript using Claude client."""
    transcript_str = transcript_to_text(merged_transcript)

    # Check if we have a valid LLM API key (Claude or Gemini)
    has_api_key = (
        (settings.anthropic_api_key and not settings.anthropic_api_key.startswith("your-") and not settings.anthropic_api_key.startswith("mock-"))
        or (settings.gemini_api_key and not settings.gemini_api_key.startswith("your-") and not settings.gemini_api_key.startswith("mock-"))
    )
    if has_api_key:
        try:
            client = ClaudeClient()
            return client.generate_minutes(transcript_str, output_language)
        except Exception as e:
            print(f"Claude generate_minutes failed, falling back to mock: {e}")

    # Fallback mock minutes — detailed 7-section example
    return """# Meeting Minutes

**Date:** May 28, 2026
**Time:** 10:00 AM — 11:15 AM
**Duration:** 1 hour 15 minutes
**Location / Platform:** Zoom (Remote)
**Prepared By:** MeetMind AI
**Attendees:**
- Ali Hassan — Frontend Lead
- Sara Qureshi — Backend Engineer
- Usman Tariq — Project Manager

---

## 1. Executive Summary

The team held a structured status-update meeting to review progress on the MeetMind AI transcription platform ahead of the internal demo deadline. Ali presented the completed UI layouts, Sara walked through the API and database integration status, and Usman outlined the project timeline and upcoming milestones. The overall mood was productive, with both technical tracks on schedule. The primary concern raised was the absence of a staging deployment environment, which needs to be resolved before the client demo.

---

## 2. Agenda / Topics Covered

1. Frontend UI status review
2. Backend API and Supabase integration update
3. Local pipeline testing and fallback behaviour
4. Staging deployment and demo preparation
5. Team action items and deadlines

---

## 3. Detailed Discussion

### 3.1 Frontend UI Status Review

**Summary:** Ali presented the completed UI, covering the Landing page, Auth flow, Dashboard, Upload page, Processing view, and the three-panel Meeting view. The design follows the agreed white/indigo theme with dark mode support. All responsive breakpoints have been tested at 1280px and 768px.

**Key Points Raised:**
- **Ali Hassan:** Confirmed all five core pages are complete and the component library is fully documented.
- **Ali Hassan:** Fixed a minor TypeScript linting issue in TopBar.tsx (unused `navigate` variable) during the session.
- **Usman Tariq:** Asked whether Urdu RTL support is functional — Ali confirmed it is, using the Noto Nastaliq Urdu font and `dir="rtl"` on transcript panels.

**Outcome:** Frontend declared feature-complete for the demo build. Minor polish items assigned to Ali.

---

### 3.2 Backend API and Supabase Integration Update

**Summary:** Sara provided a full status of the FastAPI backend, covering the seven REST endpoint groups: auth, upload, jobs, meetings, export, health, and webhooks. Supabase Storage for audio files and Postgres for structured data are both operational. Row-level security policies are applied on all user-owned tables.

**Key Points Raised:**
- **Sara Qureshi:** The file upload endpoint supports files up to 10 GB and streams directly to Supabase Storage without buffering to disk.
- **Sara Qureshi:** Gemini 2.5 Flash is the active LLM backend; the Anthropic Claude fallback is disabled due to a missing API key.
- **Usman Tariq:** Confirmed that the Supabase project was provisioned and keys distributed to the team via the shared `.env` file.

**Outcome:** Backend API is stable. Sara to complete the export-to-PDF endpoint before the demo.

---

### 3.3 Local Pipeline Testing and Fallback Behaviour

**Summary:** The team discussed how the processing pipeline degrades gracefully when Redis and Docker are unavailable. The Celery worker falls back to synchronous `task_always_eager` mode, and the Whisper transcription runs locally using the `base` model.

**Key Points Raised:**
- **Sara Qureshi:** Demonstrated a full upload-to-minutes cycle running locally without Redis, completing in ~45 seconds for a 3-minute audio clip.
- **Ali Hassan:** Confirmed the Processing page polls the `/jobs/{id}` endpoint every 3 seconds and updates step indicators in real time.
- **Usman Tariq:** Raised concern that the `base` Whisper model may not be accurate enough for heavily accented Urdu.

**Outcome:** Action assigned to Sara to update `WHISPER_MODEL_SIZE=medium` before the demo build.

---

### 3.4 Staging Deployment and Demo Preparation

**Summary:** The team reviewed the deployment plan. Currently the app only runs locally. A hosted staging environment is needed for the client demo scheduled in 5 days.

**Key Points Raised:**
- **Usman Tariq:** Proposed deploying the frontend to Vercel and the backend to Railway.
- **Sara Qureshi:** Flagged that CORS origins in `backend/.env` must be updated to include the production frontend URL once deployed.
- **Ali Hassan:** Agreed to set up the Vercel project and connect it to the GitHub repository.

**Outcome:** Deferred to action items. Usman to track deployment progress daily.

---

## 4. Decisions Made

1. **Whisper model upgraded to `medium`** — Approved by Sara Qureshi. Will take effect on the next backend restart.
2. **Staging to be deployed on Vercel + Railway** — Agreed by all attendees. Target deployment date: May 30, 2026.
3. **Export-to-PDF endpoint to be included in the demo** — Approved by Usman Tariq, contingent on Sara completing it by May 29, 2026.

---

## 5. Action Items

| # | Task Description | Assigned To | Deadline | Priority | Status |
|---|-----------------|-------------|----------|----------|--------|
| 1 | Update `WHISPER_MODEL_SIZE=medium` in backend `.env` | Sara Qureshi | May 29, 2026 | High | Open |
| 2 | Complete export-to-PDF endpoint | Sara Qureshi | May 29, 2026 | High | Open |
| 3 | Set up Vercel project and connect GitHub repo | Ali Hassan | May 30, 2026 | High | Open |
| 4 | Deploy backend to Railway and update CORS origins | Sara Qureshi | May 30, 2026 | High | Open |
| 5 | Add loading skeleton to Dashboard meeting list | Ali Hassan | May 30, 2026 | Low | Open |
| 6 | Send staging URL to client for review | Usman Tariq | May 31, 2026 | Medium | Open |

---

## 6. Open Issues & Risks

- ⚠️ **No staging environment exists** — Raised by Usman Tariq. Without a staging URL, the client cannot preview the app ahead of the demo. Risk: demo failure if deployment encounters last-minute issues.
- ⚠️ **Whisper `base` model accuracy on Urdu** — Raised by Usman Tariq. The smaller model may produce low-quality transcripts for the demo audio, which is Urdu-heavy. Mitigation: switch to `medium` model immediately.
- ⚠️ **Missing Anthropic API key** — Noted by Sara Qureshi. The LLM falls back to Gemini; if the Gemini quota is exceeded there is no secondary fallback. Mitigation: monitor API usage or add Anthropic key.

---

## 7. Next Steps

1. Sara to push the Whisper model update and test the full pipeline by end of day May 29.
2. Ali to create the Vercel project and share the preview URL with the team by May 30.
3. Sara to deploy the backend to Railway and confirm CORS and environment variables are correct.
4. Usman to schedule a 30-minute internal demo rehearsal for May 31 before sending the link to the client.
5. **Next check-in:** May 31, 2026 at 10:00 AM — review staging build and finalize the demo script.

---

*Minutes generated automatically by MeetMind AI · Please review for accuracy before distribution.*
"""
