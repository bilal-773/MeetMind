"""Translation prompt builder."""


def build_translation_prompt(text: str, source_lang: str, target_lang: str) -> str:
    lang_names = {"en": "English", "ur": "Urdu"}
    return f"""
Translate the following meeting minutes from {lang_names[source_lang]} to {lang_names[target_lang]}.

Rules:
- If translating to Urdu, use Urdu script (not Roman Urdu)
- Preserve all proper nouns, technical terms, and brand names as-is
- Maintain the exact same document structure and formatting
- Keep timestamps and speaker labels unchanged
- Translate naturally — do not translate word-for-word awkwardly

<source_text>
{text}
</source_text>

Return only the translated text. No explanation.
"""
