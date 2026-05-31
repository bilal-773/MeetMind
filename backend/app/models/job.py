from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class JobResponse(BaseModel):
    job_id: str
    status: str
    estimated_seconds: int

class JobStatusResponse(BaseModel):
    id: UUID
    status: str
    step: Optional[str] = None
    progress_pct: int = 0
    file_name: Optional[str] = None
    file_size_bytes: Optional[int] = None
    error_message: Optional[str] = None
    meeting_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
