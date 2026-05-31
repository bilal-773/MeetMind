import os
import tempfile
import httpx
from app.ai.whisper_client import WhisperClient
from app.core.audio import compress_audio, chunk_audio

class TranscribeAudioTask:
    limit_bytes = 24 * 1024 * 1024

    def prepare_audio(self, file_url: str, token: str = None) -> str:
        """Download file from URL to a local temporary path."""
        # Standard HTTP client to download the file
        print(f"Downloading audio from {file_url}")
        
        # Create temp file
        temp_dir = tempfile.gettempdir()
        file_extension = file_url.split("?")[0].split(".")[-1] if "." in file_url else "wav"
        # Sanitize extension
        if len(file_extension) > 5 or "/" in file_extension:
            file_extension = "wav"
            
        local_path = os.path.join(temp_dir, f"meetmind_upload_{os.urandom(4).hex()}.{file_extension}")
        
        # Try downloading using Supabase Storage client (robust for private buckets)
        supabase_marker = "/storage/v1/object/"
        if supabase_marker in file_url:
            try:
                from app.core.auth import get_supabase_admin
                url_path = file_url.split(supabase_marker)[1]
                parts = url_path.split("/", 2)
                if len(parts) >= 3:
                    bucket_name = parts[1]
                    storage_path = parts[2].split("?")[0]
                    print(f"Downloading via Supabase client: bucket={bucket_name}, path={storage_path}")
                    supabase = get_supabase_admin()
                    content = supabase.storage.from_(bucket_name).download(storage_path)
                    with open(local_path, "wb") as f:
                        f.write(content)
                    print(f"Downloaded audio to {local_path} using Supabase client")
                    return local_path
            except Exception as e:
                print(f"Failed downloading via Supabase client, falling back to HTTP: {e}")

        # Download bytes fallback
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        with httpx.Client(timeout=60.0, headers=headers) as client:
            response = client.get(file_url)
            response.raise_for_status()
            with open(local_path, "wb") as f:
                f.write(response.content)
                
        print(f"Downloaded audio to {local_path} via HTTP")
        return local_path


    def run(self, audio_path: str) -> list[dict]:
        """Run Whisper transcription on the local audio file."""
        
        # 1. Extract and compress audio (converts video if video, and downsizes audio)
        compressed_path = compress_audio(audio_path)
        
        # 2. Check size of the compressed audio file
        file_size = os.path.getsize(compressed_path)
        limit = getattr(self, "limit_bytes", 24 * 1024 * 1024)
        
        try:
            if file_size <= limit:
                print(f"Transcribing single compressed audio file of size {file_size / (1024*1024):.2f} MB")
                client = WhisperClient()
                return client.transcribe(compressed_path)
                
            # If still > 24MB, chunk the audio
            print(f"Compressed file size {file_size / (1024*1024):.2f} MB exceeds 24MB limit. Chunking...")
            chunks = chunk_audio(compressed_path, chunk_minutes=15)
            
            all_segments = []
            client = WhisperClient()
            for chunk_path, offset in chunks:
                try:
                    print(f"Transcribing chunk {chunk_path} with offset {offset}s...")
                    segments = client.transcribe(chunk_path)
                    
                    # Adjust timestamps
                    for seg in segments:
                        seg["start"] += offset
                        seg["end"] += offset
                        if "words" in seg:
                            for w in seg["words"]:
                                w["start"] += offset
                                w["end"] += offset
                                
                    all_segments.extend(segments)
                finally:
                    if os.path.exists(chunk_path):
                        os.remove(chunk_path)
                        
            return all_segments
        finally:
            if os.path.exists(compressed_path):
                os.remove(compressed_path)

transcribe_audio = TranscribeAudioTask()
