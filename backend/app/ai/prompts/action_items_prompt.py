"""Action items extraction prompt."""


def build_action_items_prompt(transcript: str) -> str:
    return f"""
Analyze this meeting transcript and extract ALL action items, tasks,
and commitments mentioned by participants.

<transcript>
{transcript}
</transcript>

Return a JSON array ONLY. No explanation, no markdown fences.
Each object must have:
{{
  "task": "clear description of what needs to be done",
  "owner": "person responsible (or null if not specified)",
  "deadline": "deadline mentioned (or null if not mentioned)",
  "context": "brief sentence explaining why this task came up",
  "priority": "high | medium | low (your assessment)"
}}

If no action items exist, return: []
"""
