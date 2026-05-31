# MeetMind AI

MeetMind AI is an advanced, AI-powered meeting transcription and intelligence platform designed specifically for bilingual Urdu and English meetings. The application processes audio and video recordings to generate high-fidelity transcripts, detailed meeting minutes, structured action items, and subtitle files.

---

## Key Features

### Bilingual Transcription & Language Enforcement
* Fully supports mixed Urdu and English recordings.
* Implements automatic language probe and enforcement logic. Any non-English speech is forced to transcribe directly into Urdu script (Arabic/Persian cursive script), preventing incorrect Devanagari (Hindi script) conversions.
* Metadata language detection is strictly restricted to English and Urdu.

### Intelligent Speaker Diarization
* Segments transcription by speaker turns.
* Allows users to rename default speaker labels (e.g., Person 1, Person 2) to participant names (e.g., Ali, Sara), updating the names globally across transcripts and minutes.

### AI Meeting Minutes & Actions
* Generates comprehensive Markdown-formatted meeting minutes featuring an Executive Summary, Agenda, Detailed Discussion points, and Decisions Made.
* Automatically extracts action items, tracking tasks, assigned owners, context, priority levels, and due dates.

### Instant Dashboard Performance
* Features a high-performance in-memory token verification cache in the backend. 
* Reduces remote Supabase Auth latency from 24+ network queries per minute to just 1 query per 2 minutes, ensuring instant dashboard loading times.

### Diverse Exports
* Generates exportable documents including PDF reports, Word files (.docx), and SRT subtitles.

---

## Technical Stack

### Frontend
* **Core**: React 18, TypeScript, Vite
* **Styling**: Vanilla CSS with curated dark/light modes and custom transitions
* **State Management**: Zustand
* **Icons**: Lucide React

### Backend
* **Framework**: FastAPI (Python 3.10+)
* **Database & Storage**: Supabase (PostgreSQL, PostgREST, and Storage Buckets)
* **API Integrations**: OpenAI Whisper, GPT-4o, Google Gemini
* **Task Management**: Celery (with Redis) and asynchronous background tasks fallback

---

## Repository Structure

```text
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── ai/               # Whisper & LLM Clients
│   │   ├── api/              # API Routing & Controllers
│   │   ├── core/             # Security, Audio compression, Auth Caching
│   │   ├── models/           # Pydantic Schemas
│   │   ├── services/         # Database Operations & Exports Generator
│   │   └── workers/          # Celery Worker & Pipeline Tasks
│   ├── requirements.txt      # Python Dependencies
│   └── schema.sql            # Database Table Definitions
├── src/                      # React Frontend Source
│   ├── components/           # UI Components
│   ├── lib/                  # Axios & API client utilities
│   ├── pages/                # Pages (Dashboard, Upload, Processing, etc.)
│   ├── stores/               # Zustand Global Stores
│   └── types/                # TypeScript Interfaces
├── package.json              # Frontend Scripts & Dependencies
└── vite.config.ts            # Vite Server Configuration
```

---

## Installation & Quick Start

### Prerequisites
* Python 3.10+
* Node.js 18+
* FFmpeg installed and added to the system PATH

### 1. Setup Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate      # Windows
   source .venv/bin/activate    # Mac/Linux
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `.env`:
   ```ini
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   OPENAI_API_KEY=your-openai-key
   GEMINI_API_KEY=your-gemini-key
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 2. Setup Frontend
1. Navigate back to the root directory.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the development server (runs with hot reload):
   ```bash
   npm run dev
   ```
   *The dev server binds to `http://localhost:3000/`.*

4. Alternatively, run the optimized production preview (recommended for maximum speed):
   ```bash
   npm run build
   npm run preview
   ```
   *The preview server runs on `http://localhost:3001/` with pre-compiled bundles loading in 15ms.*

---

## Production Deployment

### Frontend (Netlify / Vercel)
* Deploy the root folder as a static site.
* Build Command: `npm run build`
* Publish Directory: `dist`
* Configure a redirect rule (e.g., in `public/_redirects`) to proxy `/api/*` to your hosted backend to prevent CORS problems.

### Backend (Railway / Render / VPS)
* Deploy the backend directory as a persistent containerized service.
* Ensure the hosting server contains the `ffmpeg` system binary.
* Add your environment variables (Supabase, OpenAI, Gemini keys) to the platform settings.
* Set the `CORS_ORIGINS` value to include your Netlify frontend URL.
