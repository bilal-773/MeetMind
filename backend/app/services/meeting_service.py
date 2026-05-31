from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.core.auth import get_supabase
from app.models.meeting import MeetingResponse, SpeakerModel, ActionItemModel
from app.core.exceptions import AppException

class MeetingService:
    def __init__(self, token: str = None):
        self.supabase = get_supabase(token)

    async def get(self, meeting_id: str, user_id: str) -> Optional[MeetingResponse]:
        """Fetch a single meeting with all nested relations (speakers, action items)."""
        try:
            res = self.supabase.table("meetings").select("*, speakers(*), action_items(*)").eq("id", meeting_id).eq("user_id", user_id).execute()
            if not res.data:
                return None
            return await self._assemble_meeting_response(res.data[0])
        except Exception as e:
            raise AppException("DATABASE_ERROR", f"Failed to get meeting: {str(e)}")

    async def get_by_token(self, share_token: str) -> Optional[MeetingResponse]:
        """Fetch a meeting by public share token."""
        try:
            res = self.supabase.table("meetings").select("*, speakers(*), action_items(*)").eq("share_token", share_token).execute()
            if not res.data:
                return None
            return await self._assemble_meeting_response(res.data[0])
        except Exception as e:
            raise AppException("DATABASE_ERROR", f"Failed to get shared meeting: {str(e)}")
    async def list_by_user(self, user_id: str) -> List[MeetingResponse]:
        """List all meetings for user."""
        try:
            res = self.supabase.table("meetings").select("id, job_id, user_id, title, duration_seconds, languages_detected, speaker_count, share_token, created_at, speakers(*), action_items(*)").eq("user_id", user_id).order("created_at", desc=True).execute()
            meetings = []
            for row in res.data:
                m = await self._assemble_meeting_response(row)
                meetings.append(m)
            return meetings
        except Exception as e:
            raise AppException("DATABASE_ERROR", f"Failed to list meetings: {str(e)}")
    async def rename_speaker(self, meeting_id: str, speaker_key: str, display_name: str, user_id: str) -> None:
        """Rename a speaker key in a meeting (e.g. SPEAKER_00 -> Ali)."""
        try:
            # Check permission first
            m_res = self.supabase.table("meetings").select("id").eq("id", meeting_id).eq("user_id", user_id).execute()
            if not m_res.data:
                raise AppException("FORBIDDEN", "You do not have access to this meeting")

            # Upsert speaker display name
            self.supabase.table("speakers").upsert({
                "meeting_id": meeting_id,
                "speaker_key": speaker_key,
                "display_name": display_name
            }, on_conflict="meeting_id,speaker_key").execute()
        except Exception as e:
            raise AppException("DATABASE_ERROR", f"Failed to rename speaker: {str(e)}")

    async def set_share_token(self, meeting_id: str, token: str, user_id: str) -> None:
        """Set a public share token for the meeting."""
        try:
            self.supabase.table("meetings").update({
                "share_token": token
            }).eq("id", meeting_id).eq("user_id", user_id).execute()
        except Exception as e:
            raise AppException("DATABASE_ERROR", f"Failed to set share token: {str(e)}")

    async def create_from_pipeline(
        self,
        job_id: str,
        user_id: str,
        transcript: List[Dict[str, Any]],
        minutes_en: str,
        action_items: List[Dict[str, Any]],
        export_urls: Dict[str, str]
    ) -> str:
        """Create meeting, speakers, action items, and export records from completed pipeline."""
        try:
            # Compute stats
            duration = int(transcript[-1]["end"]) if transcript else 0
            speakers_set = set(t["speaker"] for t in transcript)
            speaker_count = len(speakers_set)
            languages = list(set(t.get("language", "en") for t in transcript if t.get("language")))
            if not languages:
                languages = ["en"]

            # Format default title
            now_str = datetime.now().strftime("%B %d, %Y - %I:%M %p")
            title = f"Meeting on {now_str}"

            # Create meeting
            meeting_data = {
                "job_id": job_id,
                "user_id": user_id,
                "title": title,
                "duration_seconds": duration,
                "languages_detected": languages,
                "speaker_count": speaker_count,
                "transcript_raw": transcript,
                "minutes_en": minutes_en
            }
            res = self.supabase.table("meetings").insert(meeting_data).execute()
            if not res.data:
                raise AppException("DATABASE_ERROR", "Failed to insert meeting")
            
            meeting_row = res.data[0]
            meeting_id = meeting_row["id"]

            # Create default speakers (bulk insert)
            speaker_colors = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899"]
            speakers_data = [
                {
                    "meeting_id": meeting_id,
                    "speaker_key": spk,
                    "display_name": f"Person {idx + 1}",
                    "color": speaker_colors[idx % len(speaker_colors)]
                }
                for idx, spk in enumerate(sorted(list(speakers_set)))
            ]
            if speakers_data:
                self.supabase.table("speakers").insert(speakers_data).execute()

            # Create action items (bulk insert)
            action_items_data = [
                {
                    "meeting_id": meeting_id,
                    "task": item.get("task", ""),
                    "owner": item.get("owner"),
                    "deadline": item.get("deadline"),
                    "context": item.get("context"),
                    "priority": item.get("priority", "medium")
                }
                for item in action_items
            ]
            if action_items_data:
                self.supabase.table("action_items").insert(action_items_data).execute()

            # Create exports (bulk insert)
            exports_data = [
                {
                    "meeting_id": meeting_id,
                    "format": fmt,
                    "file_url": url
                }
                for fmt, url in export_urls.items()
                if fmt in ["pdf", "docx", "srt"]
            ]
            if exports_data:
                self.supabase.table("exports").insert(exports_data).execute()

            return meeting_id
        except Exception as e:
            raise AppException("DATABASE_ERROR", f"Failed to save meeting from pipeline: {str(e)}")

    async def _assemble_meeting_response(self, row: Dict[str, Any]) -> MeetingResponse:
        """Helper to fetch and format speakers and action items."""
        meeting_id = row["id"]
        
        # Fetch speakers (use pre-loaded nested data if available to avoid roundtrip)
        if "speakers" in row:
            speakers_data = row["speakers"]
        else:
            speakers_res = self.supabase.table("speakers").select("*").eq("meeting_id", meeting_id).execute()
            speakers_data = speakers_res.data or []

        speakers = [
            SpeakerModel(
                id=UUID(s["id"]),
                meeting_id=UUID(s["meeting_id"]),
                speaker_key=s["speaker_key"],
                display_name=s["display_name"],
                color=s.get("color")
            ) for s in speakers_data
        ]

        # Fetch action items (use pre-loaded nested data if available to avoid roundtrip)
        if "action_items" in row:
            actions_data = row["action_items"]
        else:
            actions_res = self.supabase.table("action_items").select("*").eq("meeting_id", meeting_id).execute()
            actions_data = actions_res.data or []

        action_items = [
            ActionItemModel(
                id=UUID(a["id"]),
                meeting_id=UUID(a["meeting_id"]),
                task=a["task"],
                owner=a.get("owner"),
                deadline=a.get("deadline"),
                context=a.get("context"),
                priority=a.get("priority"),
                is_completed=a.get("is_completed", False),
                created_at=datetime.fromisoformat(a["created_at"].replace("Z", "+00:00"))
            ) for a in actions_data
        ]

        return MeetingResponse(
            id=UUID(row["id"]),
            job_id=UUID(row["job_id"]),
            user_id=UUID(row["user_id"]),
            title=row.get("title"),
            duration_seconds=row.get("duration_seconds"),
            languages_detected=row.get("languages_detected", []),
            speaker_count=row.get("speaker_count"),
            transcript=row.get("transcript_raw"),
            minutes_en=row.get("minutes_en"),
            minutes_ur=row.get("minutes_ur"),
            summary_en=row.get("summary_en"),
            summary_ur=row.get("summary_ur"),
            share_token=row.get("share_token"),
            created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
            speakers=speakers,
            action_items=action_items
        )

    async def delete(self, meeting_id: str, user_id: str) -> None:
        """Delete a meeting, its speakers, action items, exports, and physical files from storage."""
        try:
            # Check ownership and get job_id
            m_res = self.supabase.table("meetings").select("id, job_id").eq("id", meeting_id).eq("user_id", user_id).execute()
            if not m_res.data:
                raise AppException("FORBIDDEN", "You do not have permission to delete this meeting or it does not exist")
            
            job_id = m_res.data[0].get("job_id")
            
            # Fetch job details to get the file url
            job_file_url = None
            if job_id:
                job_res = self.supabase.table("jobs").select("file_url").eq("id", job_id).execute()
                if job_res.data:
                    job_file_url = job_res.data[0].get("file_url")
            
            # 1. Delete database rows
            # Delete meeting first (cascades to speakers, action items, exports)
            self.supabase.table("meetings").delete().eq("id", meeting_id).eq("user_id", user_id).execute()
            
            # Delete corresponding job
            if job_id:
                self.supabase.table("jobs").delete().eq("id", job_id).eq("user_id", user_id).execute()
            
            # 2. Delete files from storage buckets in the background (prevent blocking the DB transaction and API response)
            from app.core.auth import get_supabase_admin
            supabase_admin = get_supabase_admin()
            
            def cleanup_storage():
                # Delete original recording
                if job_file_url and "/meeting-files/" in job_file_url:
                    try:
                        rel_path = job_file_url.split("/meeting-files/")[-1]
                        supabase_admin.storage.from_("meeting-files").remove([rel_path])
                    except Exception as e:
                        print(f"Failed to delete original recording from storage: {e}")
                        
                # Delete generated export files
                if job_id:
                    try:
                        formats = ["pdf", "docx", "srt"]
                        paths_to_remove = [f"{user_id}/{job_id}/{fmt}.{fmt}" for fmt in formats]
                        supabase_admin.storage.from_("exports").remove(paths_to_remove)
                    except Exception as e:
                        print(f"Failed to delete exports from storage: {e}")

            import asyncio
            asyncio.create_task(asyncio.to_thread(cleanup_storage))
                    
        except Exception as e:
            if isinstance(e, AppException):
                raise e
            raise AppException("DATABASE_ERROR", f"Failed to delete meeting: {str(e)}")
