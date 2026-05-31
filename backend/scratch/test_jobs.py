import asyncio
import sys
import os
import uuid

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.auth import get_supabase_admin, get_supabase
from app.services.job_service import JobService
from app.services.meeting_service import MeetingService

async def test():
    # 1. Generate test credentials
    email = f"test_{uuid.uuid4().hex[:8]}@gmail.com"
    password = "SuperPassword123!"

    
    admin = get_supabase_admin()
    
    print(f"Creating user: {email}...")
    try:
        auth_res = admin.auth.sign_up({"email": email, "password": password})
        user = auth_res.user
        if not user:
            print("Failed to sign up: user is null")
            return
        user_id = user.id
        print(f"User created: {user_id}")
    except Exception as e:
        print(f"Sign up failed: {e}")
        return
        
    # 2. Sign in to get user token
    try:
        login_res = admin.auth.sign_in_with_password({"email": email, "password": password})
        token = login_res.session.access_token
        print(f"User signed in successfully. Token acquired.")
    except Exception as e:
        print(f"Sign in failed: {e}")
        return

    # 3. Create a Job
    job_svc = JobService(token=token)
    meeting_svc = MeetingService(token=token)
    
    try:
        job = await job_svc.create(
            user_id=user_id,
            file_url="https://example.com/audio.mp3",
            file_name="test_audio.mp3",
            file_size_bytes=1024
        )
        job_id = str(job.id)
        print(f"Job created: {job_id}")
    except Exception as e:
        print(f"Failed to create job: {e}")
        return

    # 4. Fetch job before completion
    try:
        job_fetched = await job_svc.get(job_id, user_id=user_id)
        print(f"Fetch before completion: Status={job_fetched.status}, meeting_id={job_fetched.meeting_id}")
    except Exception as e:
        print(f"Failed to fetch job before completion: {e}")
        return

    # 5. Mark job completed
    try:
        # Create a mock meeting first because job_id is UNIQUE NOT NULL in meetings table
        meeting_data = {
            "job_id": job_id,
            "user_id": user_id,
            "title": "Test Meeting",
            "duration_seconds": 60,
            "languages_detected": ["en"],
            "speaker_count": 1,
            "transcript_raw": [{"start": 0, "end": 10, "speaker": "SPEAKER_00", "text": "Hello"}],
            "minutes_en": "Mock minutes"
        }
        print("Inserting mock meeting...")
        m_res = admin.table("meetings").insert(meeting_data).execute()
        meeting_id = m_res.data[0]["id"]
        print(f"Mock meeting inserted: {meeting_id}")
        
        print("Marking job as completed...")
        await job_svc.mark_completed(job_id, meeting_id=meeting_id)
        print("Job marked completed successfully.")
    except Exception as e:
        print(f"Failed to mark job completed: {e}")
        return

    # 6. Fetch job after completion
    try:
        job_fetched_after = await job_svc.get(job_id, user_id=user_id)
        if job_fetched_after:
            print(f"Fetch after completion: SUCCESS! Status={job_fetched_after.status}, meeting_id={job_fetched_after.meeting_id}")
        else:
            print("Fetch after completion: FAILED (returned None / 404)!")
    except Exception as e:
        print(f"Fetch after completion raised exception: {e}")

    # Cleanup
    try:
        print("Cleaning up...")
        admin.table("meetings").delete().eq("job_id", job_id).execute()
        admin.table("jobs").delete().eq("id", job_id).execute()
        admin.auth.admin.delete_user(user_id)
        print("Cleanup complete.")
    except Exception as e:
        print(f"Cleanup failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())
