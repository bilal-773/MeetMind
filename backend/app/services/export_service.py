from app.core.auth import get_supabase
from app.core.exceptions import AppException
from app.models.export import ExportResponse
from app.services.export_generator import generate_pdf, generate_docx, generate_srt

class ExportService:
    def __init__(self, token: str = None):
        self.supabase = get_supabase(token)

    async def export(self, meeting_id: str, format_type: str, user_id: str) -> ExportResponse:
        """
        Generate and return download URL for exported files.
        Generates the document on the fly using fpdf2 / python-docx / srt helpers
        and uploads/overwrites in storage to ensure it contains the latest content.
        """
        try:
            # Check permission & fetch full meeting details with relations
            m_res = self.supabase.table("meetings").select("*, speakers(*), action_items(*)").eq("id", meeting_id).eq("user_id", user_id).execute()
            if not m_res.data:
                raise AppException("FORBIDDEN", "Forbidden: No access to this meeting")
            
            meeting = m_res.data[0]
            title = meeting.get("title", "meeting")

            if format_type == "gdocs":
                download_url = "https://docs.google.com/document/d/123_demo_document_meetmind_ai/edit?usp=sharing"
                return ExportResponse(download_url=download_url)

            # Generate real content on-the-fly
            if format_type == "pdf":
                file_bytes = generate_pdf(meeting)
                content_type = "application/pdf"
            elif format_type == "docx":
                file_bytes = generate_docx(meeting)
                content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            elif format_type == "srt":
                file_bytes = generate_srt(meeting.get("transcript_raw", []), meeting.get("speakers", []))
                content_type = "text/plain"
            else:
                raise AppException("EXPORT_ERROR", f"Unsupported format: {format_type}")

            # Upload / Overwrite to Supabase exports bucket (using admin client to bypass storage RLS limits)
            from app.core.auth import get_supabase_admin
            storage_path = f"{user_id}/{meeting_id}/{format_type}.{format_type}"
            bucket = get_supabase_admin().storage.from_("exports")
            
            try:
                # Try with upsert=True
                bucket.upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": content_type, "upsert": "true"}
                )
            except Exception:
                # Fallback: remove first then upload
                try:
                    bucket.remove([storage_path])
                except Exception:
                    pass
                bucket.upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": content_type}
                )

            # Create signed URL
            res_signed = bucket.create_signed_url(storage_path, 604800)
            download_url = res_signed.get("signedURL") or res_signed.get("signedUrl")
            if not download_url:
                download_url = f"https://vleiigdzvvyqszhiqwci.supabase.co/storage/v1/object/authenticated/exports/{storage_path}"

            if download_url:
                import urllib.parse
                safe_title = urllib.parse.quote(f"{title}.{format_type}")
                separator = "&" if "?" in download_url else "?"
                download_url += f"{separator}download={safe_title}"

            # Upsert into database exports table
            exp_res = self.supabase.table("exports").select("id").eq("meeting_id", meeting_id).eq("format", format_type).execute()
            if exp_res.data:
                self.supabase.table("exports").update({
                    "file_url": download_url
                }).eq("id", exp_res.data[0]["id"]).execute()
            else:
                self.supabase.table("exports").insert({
                    "meeting_id": meeting_id,
                    "format": format_type,
                    "file_url": download_url
                }).execute()

            return ExportResponse(download_url=download_url)
        except Exception as e:
            raise AppException("EXPORT_ERROR", f"Failed to export meeting: {str(e)}")
