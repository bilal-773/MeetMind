import os
import sys
import math
import struct
import wave
import time

sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app.ai.whisper_client import WhisperClient
from app.workers.tasks.diarize import diarize_audio

def make_dummy_wav(path, duration=1.0, freq=440.0, rate=16000):
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
    print(f"Generated dummy WAV file at {path}")

def run_tests():
    temp_wav = "dummy_test.wav"
    make_dummy_wav(temp_wav, duration=2.0) # 2 seconds of audio

    try:
        # 1. Test Whisper API Client
        print("\n--- 1. Testing OpenAI Whisper API ---")
        client = WhisperClient()
        start = time.time()
        whisper_result = client.transcribe(temp_wav)
        print(f"Whisper API response time: {time.time() - start:.2f} seconds")
        print(f"Result segments: {whisper_result}")

        # 2. Test GPT-4o Transcribe-Diarize Task
        print("\n--- 2. Testing OpenAI GPT-4o Transcribe-Diarize API ---")
        start = time.time()
        diarize_result = diarize_audio.run(temp_wav)
        print(f"GPT-4o Diarize API response time: {time.time() - start:.2f} seconds")
        print(f"Result segments: {diarize_result}")

        print("\nAll tests passed successfully!")
    except Exception as e:
        print(f"\nTEST FAILURE: {e}")
    finally:
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
            print("\nCleaned up dummy WAV file.")

if __name__ == "__main__":
    run_tests()
