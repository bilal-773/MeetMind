"""GET /api/v1/jobs/{job_id} — poll job status."""
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import verify_token
from app.models.job import JobStatusResponse
from app.services.job_service import JobService

router = APIRouter()


@router.get("/active", response_model=list[JobStatusResponse])
async def list_active_jobs(user: dict = Depends(verify_token)):
    """
    Returns all active (queued/processing) jobs for the user, auto-recovering stuck ones.
    """
    svc = JobService(token=user.get("token"))
    return await svc.get_active_jobs(user_id=user["id"])


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str, user: dict = Depends(verify_token)):
    """
    Returns current status of a processing job.
    Poll this endpoint every 3 seconds to track progress.
    """
    print(f"DEBUG: get_job_status called for job_id={job_id}, user_id={user.get('id')}")
    svc = JobService(token=user.get("token"))
    try:
        job = await svc.get(job_id, user_id=user["id"])
        print(f"DEBUG: svc.get returned: {job}")
    except Exception as e:
        print(f"DEBUG: svc.get raised exception: {e}")
        raise
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

