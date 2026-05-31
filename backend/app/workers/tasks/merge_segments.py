"""
Segment merge algorithm — aligns Whisper transcript with PyAnnote diarization.

SOLID SRP: Only handles temporal alignment, nothing else.
GRASP Information Expert: Owns both transcript and diarization data.
"""


def merge_segments(
    transcript: list[dict],
    diarization: list[dict],
) -> list[dict]:
    """
    For each transcript segment, find the speaker with maximum temporal overlap.

    Args:
        transcript: [{ start, end, text, language, words }]
        diarization: [{ start, end, speaker }]

    Returns:
        [{ start, end, speaker, text, language }]
    """
    merged = []
    for t_seg in transcript:
        best_speaker = _find_best_speaker(t_seg, diarization)
        merged.append({
            "start": t_seg["start"],
            "end": t_seg["end"],
            "speaker": best_speaker or "SPEAKER_00",
            "text": t_seg["text"],
            "language": t_seg.get("language", "auto"),
        })
    return merged


def _find_best_speaker(t_seg: dict, diarization: list[dict]) -> str | None:
    """
    Find the diarization speaker label with maximum overlap with transcript segment.
    Uses intersection-over-union-style overlap calculation.
    """
    best_speaker = None
    best_overlap = 0.0

    for d_seg in diarization:
        overlap_start = max(t_seg["start"], d_seg["start"])
        overlap_end   = min(t_seg["end"],   d_seg["end"])
        overlap = max(0.0, overlap_end - overlap_start)

        if overlap > best_overlap:
            best_overlap = overlap
            best_speaker = d_seg["speaker"]

    return best_speaker


def transcript_to_text(segments: list[dict]) -> str:
    """
    Convert merged segments to a readable text string for Claude prompts.
    Format: [SPEAKER_00 @ 0:00] Text here
    """
    lines = []
    for seg in segments:
        mins = int(seg["start"] // 60)
        secs = int(seg["start"] % 60)
        lines.append(f"[{seg['speaker']} @ {mins}:{secs:02d}] {seg['text']}")
    return "\n".join(lines)
