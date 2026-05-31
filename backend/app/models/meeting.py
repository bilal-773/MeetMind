from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class SpeakerModel(CamelModel):
    id: UUID
    meeting_id: UUID
    speaker_key: str
    display_name: str
    color: Optional[str] = None

class ActionItemModel(CamelModel):
    id: UUID
    meeting_id: UUID
    task: str
    owner: Optional[str] = None
    deadline: Optional[str] = None
    context: Optional[str] = None
    priority: Optional[str] = None
    is_completed: bool = False
    created_at: datetime

class MeetingResponse(CamelModel):
    id: UUID
    job_id: UUID
    user_id: UUID
    title: Optional[str] = None
    duration_seconds: Optional[int] = None
    languages_detected: Optional[List[str]] = None
    speaker_count: Optional[int] = None
    transcript: Optional[List[Dict[str, Any]]] = None  # Renamed from transcript_raw
    minutes_en: Optional[str] = None
    minutes_ur: Optional[str] = None
    summary_en: Optional[str] = None
    summary_ur: Optional[str] = None
    share_token: Optional[str] = None
    created_at: datetime
    speakers: List[SpeakerModel] = []
    action_items: List[ActionItemModel] = []

class MeetingPatch(CamelModel):
    title: Optional[str] = None
    minutes_en: Optional[str] = None
    minutes_ur: Optional[str] = None

