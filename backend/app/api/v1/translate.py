"""POST /api/v1/translate/{meeting_id}?target=ur|en"""
from fastapi import APIRouter, Depends, Query
from app.core.auth import verify_token
from app.services.translate_service import TranslateService

router = APIRouter()


@router.post("/{meeting_id}")
async def translate_meeting(
    meeting_id: str,
    target: str = Query(..., pattern="^(en|ur)$"),
    user: dict = Depends(verify_token),
):
    """
    Translate meeting minutes using Claude.
    target=en → translate to English
    target=ur → translate to Urdu (returns Urdu script, not Roman Urdu)
    """
    svc = TranslateService(token=user.get("token"))
    result = await svc.translate(meeting_id, target_lang=target, user_id=user["id"])
    return result
