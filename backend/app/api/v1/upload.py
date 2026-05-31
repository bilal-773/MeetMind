"""
POST /api/v1/upload
Accepts audio/video file (up to 10GB via chunked multipart).
Saves to Supabase Storage, creates a Job, queues Celery task.
"""
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, Request, BackgroundTasks
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.auth import verify_token
from app.core.exceptions import UploadException
from app.config import settings
from app.models.job import JobResponse
from app.services.upload_service import UploadService
from app.services.job_service import JobService
from app.workers.tasks.process_pipeline import process_pipeline

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm",
    "audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/webm",
}


def run_pipeline_task(job_id: str, token: str):
    try:
        process_pipeline.run(job_id, token)
    except Exception as e:
        print(f"Background pipeline failed: {e}")


@router.post("", response_model=JobResponse, status_code=202)
async def upload_file(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(verify_token),
):
    """
    Upload a meeting recording. Returns a job_id to poll for status.
    Rate limited: 10 uploads per hour per IP.
    """
    import traceback
    try:
        print(f"DEBUG: Upload received: filename={file.filename}, content_type={file.content_type}, size={file.size}")
        # Validate
        file_ext = (file.filename or "").split(".")[-1].lower()
        is_valid_ext = file_ext in {"mp4", "mov", "avi", "webm", "mp3", "wav", "m4a", "ogg"}
        is_valid_mime = (
            file.content_type in ALLOWED_MIME_TYPES or 
            (file.content_type and (file.content_type.startswith("audio/") or file.content_type.startswith("video/")))
        )
        if not (is_valid_ext or is_valid_mime):
            print(f"DEBUG: Validation failed for content_type={file.content_type}, ext={file_ext}")
            raise UploadException(f"Unsupported file type: {file.content_type}")

        token = user.get("token")
        # Save to Supabase Storage
        upload_svc = UploadService(token=token)
        file_url = await upload_svc.save(file, user_id=user["id"])
        print(f"DEBUG: Uploaded to storage, URL={file_url}")

        # Create job
        job_svc = JobService(token=token)
        job = await job_svc.create(
            user_id=user["id"],
            file_url=file_url,
            file_name=file.filename or "recording",
            file_size_bytes=file.size,
        )
        print(f"DEBUG: Created job {job.id}")

        # Queue Celery pipeline
        from app.workers.celery_app import celery_app
        if celery_app.conf.task_always_eager:
            background_tasks.add_task(run_pipeline_task, str(job.id), token)
            print(f"DEBUG: Queued pipeline via FastAPI BackgroundTasks for job {job.id}")
        else:
            process_pipeline.delay(str(job.id), token)
            print(f"DEBUG: Queued pipeline via Celery for job {job.id}")

        return JobResponse(
            job_id=str(job.id),
            status="queued",
            estimated_seconds=120,
        )
    except Exception as e:
        print("DEBUG: Exception in upload_file:")
        traceback.print_exc()
        raise e
