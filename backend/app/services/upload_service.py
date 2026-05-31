import uuid
from fastapi import UploadFile
from app.core.auth import get_supabase_admin
from app.core.exceptions import UploadException

BUCKET_NAME = "meeting-files"


class UploadService:
    def __init__(self, token: str = None):
        # Use admin client for storage uploads — bypasses RLS issues on bucket.
        # The user_id is embedded in the file path for logical ownership.
        self.supabase = get_supabase_admin()
        self.token = token

    async def save(self, file: UploadFile, user_id: str) -> str:
        """
        Uploads file to Supabase storage bucket 'meeting-files'.
        Path format: {user_id}/{uuid}.{ext}
        Returns the public URL of the uploaded file.
        """
        try:
            # Read file content into memory
            content = await file.read()

            # Generate a unique storage path
            unique_id = str(uuid.uuid4())
            original_name = file.filename or "recording"
            file_extension = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else "tmp"
            storage_path = f"{user_id}/{unique_id}.{file_extension}"

            content_type = file.content_type or "application/octet-stream"

            print(f"DEBUG: Uploading {len(content)} bytes to bucket='{BUCKET_NAME}' path='{storage_path}'")

            # Upload to Supabase Storage using admin client
            bucket = self.supabase.storage.from_(BUCKET_NAME)
            response = bucket.upload(
                path=storage_path,
                file=content,
                file_options={"content-type": content_type},
            )

            print(f"DEBUG: Storage upload response: {response}")

            # Build the storage URL (using create_signed_url since bucket is private)
            try:
                res_signed = self.supabase.storage.from_(BUCKET_NAME).create_signed_url(storage_path, 604800)
                file_url = res_signed.get("signedURL") or res_signed.get("signedUrl")
            except Exception as se:
                print(f"DEBUG: create_signed_url failed: {se}. Falling back to public URL.")
                file_url = None

            if not file_url:
                file_url = self.supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)
                
            print(f"DEBUG: File URL: {file_url}")

            return file_url

        except UploadException:
            raise
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise UploadException(f"Failed to upload to storage: {str(e)}")
