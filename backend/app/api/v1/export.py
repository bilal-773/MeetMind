"""POST /api/v1/export/{meeting_id}/{format}"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.core.auth import verify_token
from app.models.export import ExportResponse
from app.services.export_service import ExportService
import io

router = APIRouter()
FORMATS = {"pdf", "docx", "srt", "gdocs"}


@router.post("/{meeting_id}/{format}")
async def export_meeting(
    meeting_id: str,
    format: str,
    user: dict = Depends(verify_token),
):
    """
    Generate and return export for a meeting.
    - pdf, docx, srt: returns download URL
    - gdocs: returns external Google Docs URL
    """
    if format not in FORMATS:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Unsupported format: {format}. Use: {FORMATS}")

    svc = ExportService(token=user.get("token"))
    result = await svc.export(meeting_id, format, user_id=user["id"])
    return result
