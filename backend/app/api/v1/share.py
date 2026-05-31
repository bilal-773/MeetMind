"""POST /api/v1/share/{meeting_id} — generate shareable link."""
import secrets
from fastapi import APIRouter, Depends
from app.core.auth import verify_token
from app.services.meeting_service import MeetingService

router = APIRouter()


@router.post("/{meeting_id}")
async def create_share_link(meeting_id: str, user: dict = Depends(verify_token)):
    """Generate a public shareable link for a meeting."""
    svc = MeetingService(token=user.get("token"))
    share_token = secrets.token_urlsafe(16)
    await svc.set_share_token(meeting_id, share_token, user_id=user["id"])
    return {
        "share_url": f"https://meetmind.ai/shared/{share_token}",
        "token": share_token,
    }


@router.get("/public/{token}")
async def get_shared_meeting(token: str):
    """Returns a meeting by share token (no auth required)."""
    svc = MeetingService()
    meeting = await svc.get_by_token(token)
    if not meeting:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Shared meeting not found or expired")
    return meeting
