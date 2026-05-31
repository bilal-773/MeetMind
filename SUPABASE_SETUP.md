# MeetMind AI — Supabase Setup

## Project Details
- **Project URL**: `https://vleiigdzvvyqszhiqwci.supabase.co`
- **SQL Editor**: https://supabase.com/dashboard/project/vleiigdzvvyqszhiqwci/sql/new

## ✅ Already Done (by Antigravity IDE)
1. Created `meeting-files` storage bucket (private)
2. Created `exports` storage bucket (private)
3. Fixed URL typo in `.env` and `backend/.env`

## 📋 Apply Database Schema

### Option A: SQL Editor (Easiest)
1. Go to: https://supabase.com/dashboard/project/vleiigdzvvyqszhiqwci/sql/new
2. Copy and paste the contents of `backend/schema.sql`
3. Click **Run**

### Option B: Supabase CLI (with DB password)
```bash
# Get your DB password from:
# https://supabase.com/dashboard/project/vleiigdzvvyqszhiqwci/settings/database

npx supabase db query \
  --db-url "postgresql://postgres.vleiigdzvvyqszhiqwci:YOUR_DB_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" \
  -f backend/schema.sql
```

### Option C: Python Script (with DB password)
```bash
cd backend
# Edit apply_schema_direct.py and set DB_PASSWORD
python apply_schema_direct.py
```

## Storage Bucket Policies
After applying the schema, also add storage policies in the Supabase dashboard:
- **meeting-files**: Allow authenticated users to upload/download their own files
- **exports**: Allow authenticated users to access their own exports

Run this SQL in the SQL Editor:
```sql
-- meeting-files bucket policy
CREATE POLICY "Users can upload to meeting-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meeting-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own meeting-files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'meeting-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- exports bucket policy
CREATE POLICY "Users can read own exports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Service role can manage exports"
ON storage.objects
TO service_role
USING (bucket_id = 'exports');
```
