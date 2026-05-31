from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from app.core.auth import get_supabase
from app.models.job import JobStatusResponse
from app.core.exceptions import AppException

class JobService:
    def __init__(self, token: str = None):
        self.supabase = get_supabase(token)

    async def create(self, user_id: str, file_url: str, file_name: str, file_size_bytes: Optional[int]) -> Any:
        """Create a new job in the database."""
        try:
            data = {
                "user_id": user_id,
                "status": "queued",
                "step": "uploaded",
                "progress_pct": 0,
                "file_url": file_url,
                "file_name": file_name,
                "file_size_bytes": file_size_bytes
            }
            # supabase-py insert is synchronous
            res = self.supabase.table("jobs").insert(data).execute()
            if not res.data:
                raise AppException("DATABASE_ERROR", "Failed to create job in database")
            
            # Create a simple wrapper object with .id
            class JobObj:
                def __init__(self, row):
                    self.id = row["id"]
                    self.status = row["status"]
                    self.step = row["step"]
                    self.file_name = row["file_name"]
            
            return JobObj(res.data[0])
        except Exception as e:
            raise AppException("DATABASE_ERROR", f"Failed to insert job: {str(e)}")

    async def get(self, job_id: str, user_id: str) -> Optional[JobStatusResponse]:
        """Get job status for user."""
        try:
            res = self.supabase.table("jobs").select("*").eq("id", job_id).eq("user_id", user_id).execute()
            if not res.data:
                return None
            row = res.data[0]
            return JobStatusResponse(
                id=UUID(row["id"]),
                status=row["status"],
                step=row.get("step"),
                progress_pct=row.get("progress_pct", 0),
                file_name=row.get("file_name"),
                file_size_bytes=row.get("file_size_bytes"),
                error_message=row.get("error_message"),
                meeting_id=UUID(row["meeting_id"]) if row.get("meeting_id") else None,
                created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
                updated_at=datetime.fromisoformat(row["updated_at"].replace("Z", "+00:00"))
            )
        except Exception as e:
            raise AppException("DATABASE_ERROR", f"Failed to get job status: {str(e)}")

    async def get_active_jobs(self, user_id: str) -> list[JobStatusResponse]:
        """Get all active (queued/processing) jobs for user, auto-failing stuck ones."""
        try:
            res = self.supabase.table("jobs").select("*").eq("user_id", user_id).in_("status", ["queued", "processing"]).execute()
            if not res.data:
                return []
            
            from datetime import timezone
            now = datetime.now(timezone.utc)
            active_jobs = []
            
            for row in res.data:
                created_at_str = row["created_at"].replace("Z", "+00:00")
                created_at = datetime.fromisoformat(created_at_str)
                
                # If a job is stuck in queued or processing state for > 5 minutes, auto-fail it
                if (now - created_at).total_seconds() > 300:
                    await self.mark_failed(row["id"], "Pipeline timeout or interruption.")
                    continue
                    
                active_jobs.append(
                    JobStatusResponse(
                        id=UUID(row["id"]),
                        status=row["status"],
                        step=row.get("step"),
                        progress_pct=row.get("progress_pct", 0),
                        file_name=row.get("file_name"),
                        file_size_bytes=row.get("file_size_bytes"),
                        error_message=row.get("error_message"),
                        meeting_id=UUID(row["meeting_id"]) if row.get("meeting_id") else None,
                        created_at=created_at,
                        updated_at=datetime.fromisoformat(row["updated_at"].replace("Z", "+00:00"))
                    )
                )
            return active_jobs
        except Exception as e:
            raise AppException("DATABASE_ERROR", f"Failed to get active jobs: {str(e)}")

    async def get_raw(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get raw job dictionary by ID (called by worker without user auth context filter)."""
        try:
            # Service role bypass / direct fetch
            res = self.supabase.table("jobs").select("*").eq("id", job_id).execute()
            if not res.data:
                return None
            return res.data[0]
        except Exception as e:
            raise AppException("DATABASE_ERROR", f"Failed to get raw job: {str(e)}")

    async def update_step(self, job_id: str, step: str) -> None:
        """Update current step and increment progress percent based on step."""
        progress_map = {
            "queued": 0,
            "converting": 10,
            "transcribing": 30,
            "diarizing": 60,
            "generating_minutes": 80,
            "extracting_actions": 90,
            "preparing_exports": 95
        }
        progress_pct = progress_map.get(step, 0)
        try:
            self.supabase.table("jobs").update({
                "step": step,
                "progress_pct": progress_pct,
                "status": "processing"
            }).eq("id", job_id).execute()
        except Exception as e:
            # Log error but don't break pipeline
            print(f"Failed to update step: {e}")

    async def mark_completed(self, job_id: str, meeting_id: str) -> None:
        """Mark job as completed with reference to meeting ID."""
        try:
            self.supabase.table("jobs").update({
                "status": "completed",
                "progress_pct": 100,
                "meeting_id": meeting_id
            }).eq("id", job_id).execute()
        except Exception as e:
            raise AppException("DATABASE_ERROR", f"Failed to complete job: {str(e)}")

    async def mark_failed(self, job_id: str, error: str) -> None:
        """Mark job as failed with error message."""
        try:
            self.supabase.table("jobs").update({
                "status": "failed",
                "error_message": error
            }).eq("id", job_id).execute()
        except Exception as e:
            print(f"Failed to mark job failed: {e}")
