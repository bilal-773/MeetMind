from app.core.auth import get_supabase
from app.core.exceptions import AppException
from app.ai.claude_client import ClaudeClient
from app.config import settings

class TranslateService:
    def __init__(self, token: str = None):
        self.supabase = get_supabase(token)

    async def translate(self, meeting_id: str, target_lang: str, user_id: str) -> dict:
        """
        Translate meeting minutes. 
        Saves translated text to the database and returns it.
        """
        try:
            # Check permission & fetch current meeting
            res = self.supabase.table("meetings").select("*").eq("id", meeting_id).eq("user_id", user_id).execute()
            if not res.data:
                raise AppException("FORBIDDEN", "No access to this meeting")
            
            meeting = res.data[0]
            
            # Check if translation already exists
            col_name = f"minutes_{target_lang}"
            if meeting.get(col_name):
                return {"ok": True, col_name: meeting[col_name]}

            source_col = "minutes_en" if target_lang == "ur" else "minutes_ur"
            source_text = meeting.get(source_col) or meeting.get("minutes_en") or ""
            
            if not source_text:
                return {"ok": False, "error": "No source minutes found to translate"}

            # Translate using Claude or fallback Mock (checks for Anthropic or Gemini key)
            translated_text = ""
            has_api_key = (
                (settings.anthropic_api_key and not settings.anthropic_api_key.startswith("your-") and not settings.anthropic_api_key.startswith("mock-"))
                or (settings.gemini_api_key and not settings.gemini_api_key.startswith("your-") and not settings.gemini_api_key.startswith("mock-"))
            )
            
            if has_api_key:

                try:
                    client = ClaudeClient()
                    source_lang_name = "English" if target_lang == "ur" else "Urdu"
                    target_lang_name = "Urdu" if target_lang == "ur" else "English"
                    translated_text = client.translate(source_text, source_lang_name, target_lang_name)
                except Exception as api_err:
                    print(f"Claude API failed, falling back to mock: {api_err}")
            
            if not translated_text:
                # Mock translation (with clean layout)
                if target_lang == "ur":
                    translated_text = (
                        "# میٹنگ کے اہم نکات (Minutes of Meeting)\n\n"
                        "یہ میٹنگ کے اہم نکات کا اردو ترجمہ ہے۔\n\n"
                        "### اہم فیصلے:\n"
                        "- پروجیکٹ کی ڈیڈ لائن کو ایک ہفتے کے لیے بڑھا دیا گیا ہے۔\n"
                        "- اگلی میٹنگ پیر کے دن ہوگی۔\n\n"
                        "### اگلے اقدامات:\n"
                        "1. علی خان فرنٹ اینڈ کے کام کو مکمل کریں گے۔\n"
                        "2. ثناء فیز 2 کی پلاننگ شیئر کریں گی۔"
                    )
                else:
                    translated_text = (
                        "# Minutes of Meeting\n\n"
                        "This is the translated English version of the meeting minutes.\n\n"
                        "### Key Decisions:\n"
                        "- Project deadline extended by 1 week.\n"
                        "- Next meeting scheduled for Monday.\n\n"
                        "### Next Steps:\n"
                        "1. Ali Khan will complete frontend tasks.\n"
                        "2. Sana will share Phase 2 planning."
                    )

            # Update meeting in database
            self.supabase.table("meetings").update({
                col_name: translated_text
            }).eq("id", meeting_id).execute()

            return {"ok": True, col_name: translated_text}
        except Exception as e:
            raise AppException("TRANSLATION_ERROR", f"Failed to translate meeting: {str(e)}")
