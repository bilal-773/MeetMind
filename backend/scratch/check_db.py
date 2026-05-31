import asyncio
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.auth import get_supabase_admin

async def check():
    supabase = get_supabase_admin()
    
    # Check meetings
    meetings_res = supabase.table("meetings").select("id, title, created_at").execute()
    print(f"Total Meetings in DB: {len(meetings_res.data)}")
    for m in meetings_res.data[:5]:
        print(f" - Meeting: {m['title']} (ID: {m['id']}), Created at: {m['created_at']}")
        
    # Check jobs
    jobs_res = supabase.table("jobs").select("id, status, step, file_name, error_message, created_at").order("created_at", desc=True).execute()
    print(f"\nTotal Jobs in DB: {len(jobs_res.data)}")
    for j in jobs_res.data[:10]:
        print(f" - Job: {j['file_name']} (ID: {j['id']}), Status: {j['status']}, Step: {j['step']}, Error: {j['error_message']}")

if __name__ == "__main__":
    asyncio.run(check())
