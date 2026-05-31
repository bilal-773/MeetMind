-- ================================================================
-- MeetMind AI — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL editor
-- ================================================================

-- User profiles (extends Supabase Auth)
CREATE TABLE public.user_profiles (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    google_tokens JSONB,    -- Encrypted Google OAuth tokens for Docs export
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Processing jobs
CREATE TABLE public.jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status          TEXT NOT NULL CHECK (status IN ('queued','processing','completed','failed')),
    step            TEXT,               -- Current pipeline step name
    progress_pct    INTEGER DEFAULT 0,
    file_url        TEXT NOT NULL,      -- Supabase Storage URL
    file_name       TEXT NOT NULL,
    file_size_bytes BIGINT,
    error_message   TEXT,
    meeting_id      UUID,               -- Set when completed
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings (output of completed jobs)
CREATE TABLE public.meetings (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id             UUID UNIQUE NOT NULL REFERENCES public.jobs(id),
    user_id            UUID NOT NULL REFERENCES auth.users(id),
    title              TEXT,
    duration_seconds   INTEGER,
    languages_detected TEXT[],          -- e.g. ['ur', 'en']
    speaker_count      INTEGER,
    transcript_raw     JSONB,           -- [{ start, end, speaker, text, language }]
    minutes_en         TEXT,            -- English minutes (Markdown)
    minutes_ur         TEXT,            -- Urdu minutes (generated on demand)
    summary_en         TEXT,
    summary_ur         TEXT,
    share_token        TEXT UNIQUE,     -- For shareable links
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Speakers (per-meeting, user-renameable)
CREATE TABLE public.speakers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id   UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    speaker_key  TEXT NOT NULL,         -- "SPEAKER_00" from PyAnnote
    display_name TEXT NOT NULL,         -- Default "Person 1", user-editable
    color        TEXT,                  -- Hex color for UI
    UNIQUE (meeting_id, speaker_key)
);

-- Action items extracted from transcripts
CREATE TABLE public.action_items (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id   UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    task         TEXT NOT NULL,
    owner        TEXT,
    deadline     TEXT,
    context      TEXT,
    priority     TEXT CHECK (priority IN ('high', 'medium', 'low')),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Export artifacts (PDF, DOCX, SRT)
CREATE TABLE public.exports (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    format     TEXT NOT NULL CHECK (format IN ('pdf', 'docx', 'srt')),
    file_url   TEXT NOT NULL,           -- Supabase Storage signed URL
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- Row Level Security Policies
-- ================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = id);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their jobs" ON public.jobs
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their meetings" ON public.meetings
    FOR ALL USING (auth.uid() = user_id);
-- Allow public read via share_token
CREATE POLICY "share token public read" ON public.meetings
    FOR SELECT USING (share_token IS NOT NULL);

ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their speakers" ON public.speakers
    FOR ALL USING (
        meeting_id IN (SELECT id FROM public.meetings WHERE user_id = auth.uid())
    );

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their action items" ON public.action_items
    FOR ALL USING (
        meeting_id IN (SELECT id FROM public.meetings WHERE user_id = auth.uid())
    );

ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their exports" ON public.exports
    FOR ALL USING (
        meeting_id IN (SELECT id FROM public.meetings WHERE user_id = auth.uid())
    );

-- ================================================================
-- Supabase Storage Buckets
-- (Run these via Supabase dashboard or API)
-- ================================================================
-- bucket: meeting-files   (private)  → {user_id}/{job_id}/original.{ext}
-- bucket: exports         (private)  → {user_id}/{meeting_id}/{format}.{ext}

-- ================================================================
-- Triggers: auto-update updated_at
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ================================================================
-- Performance Indexes (highly recommended for RLS policy speedups)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_job_id ON public.meetings(job_id);
CREATE INDEX IF NOT EXISTS idx_speakers_meeting_id ON public.speakers(meeting_id);
CREATE INDEX IF NOT EXISTS idx_action_items_meeting_id ON public.action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_exports_meeting_id ON public.exports(meeting_id);

