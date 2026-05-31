# MeetMind AI Backend — FastAPI

## Quick Start

```bash
# 1. Create virtualenv
python -m venv .venv
.venv\Scripts\activate     # Windows
# source .venv/bin/activate  # Mac/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env file and fill in your keys
cp .env.example .env

# 4. Run with Docker (recommended)
docker-compose up --build

# 5. Or run locally
uvicorn app.main:app --reload --port 8000
# In another terminal:
celery -A app.workers.celery_app worker --loglevel=info
```

## Environment Variables

See `.env.example` for all required variables.

## API Docs

After starting, visit: http://localhost:8000/docs
