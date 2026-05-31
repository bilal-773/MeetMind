"""GET|PATCH /api/v1/meetings/{meeting_id}"""
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import verify_token
from app.models.meeting import MeetingResponse, MeetingPatch
from app.services.meeting_service import MeetingService

router = APIRouter()


@router.get("/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(meeting_id: str, user: dict = Depends(verify_token)):
    """Returns full meeting data including transcript, minutes, and action items."""
    svc = MeetingService(token=user.get("token"))
    meeting = await svc.get(meeting_id, user_id=user["id"])
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.get("", response_model=list[MeetingResponse])
async def list_meetings(user: dict = Depends(verify_token)):
    """Returns all meetings for the authenticated user."""
    svc = MeetingService(token=user.get("token"))
    return await svc.list_by_user(user_id=user["id"])


@router.patch("/{meeting_id}/speakers/{speaker_key}")
async def rename_speaker(
    meeting_id: str,
    speaker_key: str,
    body: dict,
    user: dict = Depends(verify_token),
):
    """Rename a speaker (e.g. SPEAKER_00 → Ali)."""
    svc = MeetingService(token=user.get("token"))
    await svc.rename_speaker(meeting_id, speaker_key, body.get("display_name", ""), user["id"])
    return {"ok": True}


@router.delete("/{meeting_id}")
async def delete_meeting(meeting_id: str, user: dict = Depends(verify_token)):
    """Delete a meeting and its associated records & files."""
    svc = MeetingService(token=user.get("token"))
    await svc.delete(meeting_id, user_id=user["id"])
    return {"ok": True}
