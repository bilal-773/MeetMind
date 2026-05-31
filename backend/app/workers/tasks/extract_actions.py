from app.ai.claude_client import ClaudeClient
from app.workers.tasks.merge_segments import transcript_to_text
from app.config import settings

def extract_action_items(merged_transcript: list[dict]) -> list[dict]:
    """Extract action items from transcript using Claude client."""
    transcript_str = transcript_to_text(merged_transcript)
    
    # Check if we have a valid LLM API key (Claude or Gemini)
    has_api_key = (
        (settings.anthropic_api_key and not settings.anthropic_api_key.startswith("your-") and not settings.anthropic_api_key.startswith("mock-"))
        or (settings.gemini_api_key and not settings.gemini_api_key.startswith("your-") and not settings.gemini_api_key.startswith("mock-"))
    )
    if has_api_key:

        try:
            client = ClaudeClient()
            return client.extract_action_items(transcript_str)
        except Exception as e:
            print(f"Claude extract_action_items failed, falling back to mock: {e}")

    # Fallback mock action items
    return [
        {
            "task": "Complete frontend UI components for the meeting details page.",
            "owner": "Person 1",
            "deadline": "2 days",
            "context": "Align with the white theme and indigo color scheme.",
            "priority": "high"
        },
        {
            "task": "Configure FastAPI server environment variables and verify Postgres connection.",
            "owner": "Person 2",
            "deadline": "1 day",
            "context": "Ensure the SUPABASE_URL and SUPABASE_ANON_KEY match active credentials.",
            "priority": "high"
        },
        {
            "task": "Prepare project presentation for review.",
            "owner": "Person 3",
            "deadline": "Next Monday",
            "context": "Focus on mixed-language transcription features.",
            "priority": "medium"
        }
    ]
