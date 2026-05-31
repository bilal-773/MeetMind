"""
Claude API client — generates minutes, extracts action items, translates.

SOLID SRP: Only handles Claude API calls.
GRASP Information Expert: Owns all Claude configuration and prompt assembly.
"""
# Import Anthropic inside init to make it optional if using Gemini
from app.config import settings
from app.ai.prompts.minutes_prompt import build_minutes_prompt, SYSTEM_PROMPT as MINUTES_SYSTEM
from app.ai.prompts.action_items_prompt import build_action_items_prompt
from app.ai.prompts.translation_prompt import build_translation_prompt
import json
from loguru import logger


class ClaudeClient:
    """Wrapper for Anthropic Claude and Google Gemini API calls."""

    CLAUDE_MODEL = "claude-sonnet-4-20250514"
    GEMINI_MODEL = "gemini-2.5-flash"
    MAX_TOKENS = 4096


    def __init__(self):
        self.use_gemini = bool(
            settings.gemini_api_key
            and not settings.gemini_api_key.startswith("mock-")
            and not settings.gemini_api_key.startswith("your-")
        )
        if self.use_gemini:
            self.gemini_key = settings.gemini_api_key
            logger.info("LLM Client: Using Google Gemini API backend.")
        else:
            from anthropic import Anthropic
            self.client = Anthropic(api_key=settings.anthropic_api_key)
            logger.info("LLM Client: Using Anthropic Claude API backend.")

    def _call_gemini(self, prompt: str, system_instruction: str = None, json_mode: bool = False) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.GEMINI_MODEL}:generateContent?key={self.gemini_key}"
        
        contents = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ]
        }
        
        if system_instruction:
            contents["systemInstruction"] = {
                "parts": [
                    {
                        "text": system_instruction
                    }
                ]
            }
            
        if json_mode:
            contents["generationConfig"] = {
                "responseMimeType": "application/json"
            }
            
        import httpx
        with httpx.Client(timeout=120.0) as client:
            response = client.post(url, json=contents)
            response.raise_for_status()
            res_json = response.json()
            try:
                text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                # For JSON mode, clean potential markdown wrapping if Gemini still adds it
                if json_mode:
                    text_stripped = text.strip()
                    if text_stripped.startswith("```json"):
                        text_stripped = text_stripped.split("```json", 1)[1]
                        if text_stripped.endswith("```"):
                            text_stripped = text_stripped.rsplit("```", 1)[0]
                    elif text_stripped.startswith("```"):
                        text_stripped = text_stripped.split("```", 1)[1]
                        if text_stripped.endswith("```"):
                            text_stripped = text_stripped.rsplit("```", 1)[0]
                    return text_stripped.strip()
                return text
            except (KeyError, IndexError) as e:
                raise Exception(f"Failed to parse Gemini response: {res_json}. Error: {e}")

    def generate_minutes(self, transcript_text: str, output_language: str = "en") -> str:
        """
        Generate structured meeting minutes from transcript.
        Returns Markdown-formatted minutes.
        """
        prompt = build_minutes_prompt(transcript_text, output_language)
        if self.use_gemini:
            return self._call_gemini(prompt, system_instruction=MINUTES_SYSTEM)

        response = self.client.messages.create(
            model=self.CLAUDE_MODEL,
            max_tokens=self.MAX_TOKENS,
            system=MINUTES_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

    def extract_action_items(self, transcript_text: str) -> list[dict]:
        """
        Extract action items from transcript.
        Returns list of { task, owner, deadline, context, priority }.
        """
        prompt = build_action_items_prompt(transcript_text)
        if self.use_gemini:
            raw = self._call_gemini(prompt, json_mode=True).strip()
        else:
            response = self.client.messages.create(
                model=self.CLAUDE_MODEL,
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.content[0].text.strip()
            
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse action items JSON: {raw[:200]}")
            return []

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """
        Translate text between English and Urdu.
        Preserves document structure and formatting.
        """
        prompt = build_translation_prompt(text, source_lang, target_lang)
        if self.use_gemini:
            return self._call_gemini(prompt)

        response = self.client.messages.create(
            model=self.CLAUDE_MODEL,
            max_tokens=self.MAX_TOKENS,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

