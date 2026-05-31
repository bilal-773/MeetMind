"""Celery app configuration."""
from celery import Celery
from app.config import settings
import redis

# Check if Redis is online, otherwise fall back to eager execution (local inline processing)
try:
    r = redis.Redis.from_url(settings.redis_url, socket_timeout=1.0)
    r.ping()
    task_always_eager = False
    print("Celery: Redis is online. Task queue enabled.")
except Exception:
    task_always_eager = True
    print("Celery: Redis is offline. Falling back to task_always_eager=True (synchronous execution).")

celery_app = Celery(
    "meetmind",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.workers.tasks.process_pipeline",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,  # Process one task at a time (GPU workload)
    task_always_eager=task_always_eager,
)
