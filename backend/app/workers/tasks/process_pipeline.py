"""
Main Celery pipeline task — orchestrates all AI processing steps.

GRASP Creator: This task creates all sub-tasks because it owns the full pipeline flow.
SOLID SRP: Each step delegates to a single-responsibility service.
"""
from app.workers.celery_app import celery_app
from app.services.job_service import JobService
from app.services.meeting_service import MeetingService
from app.workers.tasks.transcribe import transcribe_audio
from app.workers.tasks.diarize import diarize_audio
from app.workers.tasks.merge_segments import merge_segments
from app.workers.tasks.generate_minutes import generate_minutes
from app.workers.tasks.extract_actions import extract_action_items
from app.workers.tasks.generate_exports import generate_exports
from loguru import logger
import asyncio


def run_async_sync(coro):
    """Run an async coroutine synchronously, handling event loop differences."""
    try:
        return asyncio.run(coro)
    except RuntimeError:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(coro)


def _step(job_svc, job_id: str, step: str):
    """Update job step in DB synchronously."""
    run_async_sync(job_svc.update_step(job_id, step))


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_pipeline(self, job_id: str, token: str = None):
    """
    Full AI processing pipeline for a meeting recording.

    Steps:
    1. FFmpeg: extract audio
    2. Whisper: transcribe → segments
    3. PyAnnote: diarize → speaker segments
    4. Merge: align transcript + speakers
    5. Claude: generate minutes (EN)
    6. Claude: extract action items
    7. Generate PDF, DOCX, SRT exports
    8. Update job → completed
    """
    job_svc = JobService(token=token)
    meeting_svc = MeetingService(token=token)

    try:
        # Fetch job
        job = run_async_sync(job_svc.get_raw(job_id))
        if not job:
            logger.error(f"Job {job_id} not found")
            return

        logger.info(f"[{job_id}] Pipeline started for: {job['file_name']}")
        file_url = job["file_url"]

        # Step 1: Download + convert audio
        _step(job_svc, job_id, "converting")
        audio_path = transcribe_audio.prepare_audio(file_url, token=token)

        # Step 2: Transcribe
        _step(job_svc, job_id, "transcribing")
        transcript_segments = transcribe_audio.run(audio_path)
        logger.info(f"[{job_id}] Transcript: {len(transcript_segments)} segments")

        # Step 3: Diarize
        _step(job_svc, job_id, "diarizing")
        diarization_segments = diarize_audio.run(audio_path)
        logger.info(f"[{job_id}] Diarization: {len(diarization_segments)} speaker segments")

        # Step 4: Merge
        merged = merge_segments(transcript_segments, diarization_segments)

        # Step 5: Generate minutes
        _step(job_svc, job_id, "generating_minutes")
        minutes_en = generate_minutes(merged, output_language="en")

        # Step 6: Extract action items
        _step(job_svc, job_id, "extracting_actions")
        action_items = extract_action_items(merged)

        # Step 7: Generate exports
        _step(job_svc, job_id, "preparing_exports")
        meeting_data = {
            "title": job["file_name"],
            "transcript": merged,
            "minutes_en": minutes_en,
            "action_items": action_items,
        }
        export_urls = generate_exports(meeting_data, job_id, job["user_id"], token=token)

        # Step 8: Save meeting + mark job complete
        meeting_id = run_async_sync(
            meeting_svc.create_from_pipeline(
                job_id=job_id,
                user_id=job["user_id"],
                transcript=merged,
                minutes_en=minutes_en,
                action_items=action_items,
                export_urls=export_urls,
            )
        )

        run_async_sync(
            job_svc.mark_completed(job_id, meeting_id=meeting_id)
        )
        logger.info(f"[{job_id}] Pipeline complete. Meeting ID: {meeting_id}")

    except Exception as exc:
        logger.error(f"[{job_id}] Pipeline failed: {exc}")
        run_async_sync(
            job_svc.mark_failed(job_id, error=str(exc))
        )
        if self and not getattr(self.app.conf, "task_always_eager", False):
            raise self.retry(exc=exc)
        else:
            raise exc
