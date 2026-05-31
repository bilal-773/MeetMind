import os
import sys
import math
import struct
import wave
import time

sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app.workers.tasks.transcribe import transcribe_audio
from app.workers.tasks.diarize import diarize_audio
from app.core.audio import get_audio_duration, compress_audio, chunk_audio

def make_dummy_wav(path, duration=35.0, freq=440.0, rate=16000):
    """Generate a dummy WAV file containing a simple 440Hz sine wave."""
    n_samples = int(duration * rate)
    data = [
        int(32767.0 * math.sin(2.0 * math.pi * freq * i / rate))
        for i in range(n_samples)
    ]
    with wave.open(path, "w") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        for val in data:
            wav.writeframesraw(struct.pack("<h", val))
    print(f"Generated dummy WAV file at {path} ({duration}s)")

def run_tests():
    temp_wav = "dummy_chunk_test.wav"
    make_dummy_wav(temp_wav, duration=35.0)

    try:
        # Verify duration
        dur = get_audio_duration(temp_wav)
        print(f"Verified WAV duration: {dur:.2f} seconds")
        assert abs(dur - 35.0) < 0.5, "Duration mismatch"

        # Verify compression
        print("\n--- Testing Compression ---")
        compressed = compress_audio(temp_wav)
        assert os.path.exists(compressed), "Compressed file not created"
        print(f"Compression successful. Output size: {os.path.getsize(compressed)} bytes")

        # Verify chunking (chunk size = 10s)
        print("\n--- Testing Chunking (10s chunks) ---")
        chunks = chunk_audio(compressed, chunk_minutes=0.1667) # ~10s
        print(f"Created {len(chunks)} chunks:")
        for cp, offset in chunks:
            print(f" - Chunk {cp} at offset {offset}s")
            assert os.path.exists(cp), f"Chunk file {cp} does not exist"
            os.remove(cp) # cleanup verify chunks
        os.remove(compressed)

        # Force chunking in transcribe task (by setting limit_bytes to 10 bytes)
        print("\n--- Testing Transcribe Task Chunking ---")
        transcribe_audio.limit_bytes = 10 # Force chunking
        # Override chunk_minutes inside run to verify chunking on short file
        import app.workers.tasks.transcribe as transcribe_mod
        original_chunk_audio = transcribe_mod.chunk_audio
        transcribe_mod.chunk_audio = lambda path, chunk_minutes=15: original_chunk_audio(path, chunk_minutes=0.1667)

        start = time.time()
        transcribe_result = transcribe_audio.run(temp_wav)
        print(f"Transcribe task returned {len(transcribe_result)} segments.")
        print(f"Segments: {transcribe_result}")

        # Restore original function
        transcribe_mod.chunk_audio = original_chunk_audio

        # Force chunking in diarize task
        print("\n--- Testing Diarize Task Chunking ---")
        diarize_audio.limit_bytes = 10 # Force chunking
        import app.workers.tasks.diarize as diarize_mod
        original_diarize_chunk_audio = diarize_mod.chunk_audio
        diarize_mod.chunk_audio = lambda path, chunk_minutes=15: original_diarize_chunk_audio(path, chunk_minutes=0.1667)

        diarize_result = diarize_audio.run(temp_wav)
        print(f"Diarize task returned {len(diarize_result)} segments.")
        print(f"Segments: {diarize_result}")

        diarize_mod.chunk_audio = original_diarize_chunk_audio

        print("\nAll chunking tests passed successfully!")
    except Exception as e:
        print(f"\nTEST FAILURE: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
            print("\nCleaned up dummy WAV file.")

if __name__ == "__main__":
    run_tests()
