import os
import subprocess
import json
import tempfile
from loguru import logger

def get_audio_duration(audio_path: str) -> float:
    """Get audio duration in seconds using ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "quiet",
            "-print_format", "json",
            "-show_format", audio_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        return float(data["format"]["duration"])
    except Exception as e:
        logger.error(f"Failed to get audio duration via ffprobe: {e}")
        raise

def compress_audio(input_path: str) -> str:
    """
    Extracts and compresses audio from any audio/video file to mono MP3 at 16kHz, 32kbps.
    This reduces file size dramatically (approx 14.4MB per hour of audio).
    """
    temp_dir = tempfile.gettempdir()
    output_path = os.path.join(temp_dir, f"compressed_{os.urandom(4).hex()}.mp3")
    
    logger.info(f"Compressing audio from {input_path} to {output_path}...")
    cmd = [
        "ffmpeg", "-i", input_path,
        "-vn",                   # Disable video
        "-acodec", "libmp3lame", # MP3 codec
        "-ar", "16000",          # 16kHz sampling rate
        "-ac", "1",              # Mono channel
        "-ab", "32k",            # 32kbps bitrate
        "-y",                    # Overwrite output
        output_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    logger.info(f"Compressed file size: {os.path.getsize(output_path) / (1024*1024):.2f} MB")
    return output_path

def chunk_audio(audio_path: str, chunk_minutes: float = 15.0) -> list[tuple[str, float]]:
    """
    Split audio into chunks.
    Returns list of tuples: (chunk_path, start_offset_seconds)
    """
    duration = get_audio_duration(audio_path)
    chunk_secs = chunk_minutes * 60.0
    chunks = []
    temp_dir = tempfile.gettempdir()

    start = 0.0
    i = 0
    while start < duration:
        out_path = os.path.join(temp_dir, f"chunk_{i}_{os.urandom(4).hex()}.mp3")
        logger.info(f"Creating chunk {i} from {start:.2f}s to {min(start + chunk_secs, duration):.2f}s: {out_path}")
        cmd = [
            "ffmpeg", "-i", audio_path,
            "-ss", f"{start:.3f}",
            "-t", f"{chunk_secs:.3f}",
            "-acodec", "libmp3lame",
            "-ar", "16000",
            "-ac", "1",
            "-ab", "32k",
            "-y", out_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        chunks.append((out_path, float(start)))
        start += chunk_secs
        i += 1

    return chunks
