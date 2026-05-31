from datetime import datetime
from app.core.auth import get_supabase_admin
from app.services.export_generator import generate_pdf, generate_docx, generate_srt

def generate_exports(meeting_data: dict, job_id: str, user_id: str, token: str = None) -> dict[str, str]:
    """
    Generates and uploads real export files (PDF, DOCX, SRT) for a completed meeting.
    Returns a dict mapping format type to their Supabase Storage URLs.
    """
    urls = {}
    supabase_admin = get_supabase_admin()
    
    # Compute metadata to enrich meeting_data
    transcript = meeting_data.get("transcript", [])
    duration = int(transcript[-1]["end"]) if transcript else 0
    speakers_set = set(t.get("speaker") for t in transcript if t.get("speaker"))
    speaker_count = len(speakers_set)
    languages = list(set(t.get("language", "en") for t in transcript if t.get("language")))
    if not languages:
        languages = ["en"]
        
    speakers_list = []
    speaker_colors = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899"]
    for idx, spk in enumerate(sorted(list(speakers_set))):
        color = speaker_colors[idx % len(speaker_colors)]
        spk_name = f"Person {idx + 1}"
        speakers_list.append({
            "speaker_key": spk,
            "display_name": spk_name,
            "color": color
        })
        
    meeting_data["duration_seconds"] = duration
    meeting_data["speaker_count"] = speaker_count
    meeting_data["languages_detected"] = languages
    meeting_data["created_at"] = datetime.now()
    meeting_data["speakers"] = speakers_list

    for fmt in ["pdf", "docx", "srt"]:
        try:
            storage_path = f"{user_id}/{job_id}/{fmt}.{fmt}"
            bucket = supabase_admin.storage.from_("exports")
            
            if fmt == "pdf":
                file_bytes = generate_pdf(meeting_data)
                content_type = "application/pdf"
            elif fmt == "docx":
                file_bytes = generate_docx(meeting_data)
                content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            elif fmt == "srt":
                file_bytes = generate_srt(transcript, speakers_list)
                content_type = "text/plain"
            else:
                continue

            # Upload to Supabase exports bucket with upsert
            try:
                bucket.upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": content_type, "upsert": "true"}
                )
            except Exception:
                try:
                    bucket.remove([storage_path])
                except Exception:
                    pass
                bucket.upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": content_type}
                )
            
            # Get signed URL
            res_signed = bucket.create_signed_url(storage_path, 604800)
            url = res_signed.get("signedURL") or res_signed.get("signedUrl")
            if not url:
                url = f"https://vleiigdzvvyqszhiqwci.supabase.co/storage/v1/object/authenticated/exports/{storage_path}"
            
            if url:
                import urllib.parse
                safe_title = urllib.parse.quote(f"{meeting_data.get('title', 'meeting')}.{fmt}")
                separator = "&" if "?" in url else "?"
                url += f"{separator}download={safe_title}"
            urls[fmt] = url
        except Exception as e:
            print(f"Failed to generate pipeline export {fmt}: {e}")
            urls[fmt] = f"https://vleiigdzvvyqszhiqwci.supabase.co/storage/v1/object/authenticated/exports/{storage_path}"
            
    return urls
