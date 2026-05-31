"""Meeting minutes prompt builder."""

SYSTEM_PROMPT = """
You are a professional meeting secretary specializing in bilingual
Pakistani corporate and academic meetings. You generate clear,
structured, detailed meeting minutes from transcripts that may contain
a mixture of Urdu and English (code-switching).

Rules:
- Always produce output in the requested output_language
- If output_language is "ur", write in Urdu script (not Roman Urdu)
- If output_language is "en", write in formal English
- Preserve technical terms in their original language
- Do not fabricate information not present in the transcript
- Use the speakers' names if provided, otherwise use Person 1, Person 2, etc.
- Be thorough and detailed — each section should be substantive, not just a one-liner
- Use precise, professional language appropriate for corporate or academic records
"""


def build_minutes_prompt(transcript: str, output_language: str = "en") -> str:
    lang_name = "English" if output_language == "en" else "Urdu (اردو script)"
    return f"""
Here is the meeting transcript with speaker labels and timestamps:

<transcript>
{transcript}
</transcript>

Generate comprehensive, professional meeting minutes in {lang_name}.
Follow this exact structure — be detailed, accurate, and formal:

---

# Meeting Minutes

**Date:** [extract from transcript or write "Not specified"]
**Time:** [start time — end time, from timestamps]
**Duration:** [total meeting duration, calculated from timestamps]
**Location / Platform:** [extract if mentioned, otherwise "Not specified"]
**Prepared By:** MeetMind AI
**Attendees:**
- [Speaker name — role if mentioned]
- [repeat for each speaker]

---

## 1. Executive Summary

Write 3–5 sentences summarising the purpose of the meeting, the main outcomes, and the overall tone or conclusion. This section should give a reader who missed the meeting full context without reading the entire document.

---

## 2. Agenda / Topics Covered

1. [First major topic]
2. [Second major topic]
3. [Continue for all topics]

---

## 3. Detailed Discussion

For each agenda topic, create a numbered sub-section and provide a thorough account:

### 3.1 [Topic Name]

**Summary:** [2–4 sentence summary of what was discussed]

**Key Points Raised:**
- [Speaker Name]: [Their key point or contribution]
- [Speaker Name]: [Their key point or contribution]
- [Continue for all relevant contributions]

**Outcome:** [Decision reached / Deferred to later / Needs further research / Action assigned]

### 3.2 [Next Topic Name]
[Repeat structure above]

---

## 4. Decisions Made

1. **[Decision]** — Approved by [Name]. [Any conditions or caveats.]
2. [Repeat for each decision]

> If no formal decisions were made, write: *No formal decisions recorded in this session.*

---

## 5. Action Items

| # | Task Description | Assigned To | Deadline | Priority | Status |
|---|-----------------|-------------|----------|----------|--------|
| 1 | [Task] | [Owner] | [Date or "TBD"] | High / Medium / Low | Open |

---

## 6. Open Issues & Risks

- ⚠️ **[Issue/Risk]** — Raised by [Name]. [Brief description of the concern and potential impact.]
- [Repeat for each open issue]

> If none, write: *No open issues or risks flagged.*

---

## 7. Next Steps

1. [Concrete next step — who, what, when]
2. [Next meeting or follow-up communication]
3. [Any deliverables expected]

---

*Minutes generated automatically by MeetMind AI · Please review for accuracy before distribution.*
"""
