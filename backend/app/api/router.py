"""API router — aggregates all v1 routes."""
from fastapi import APIRouter
from app.api.v1 import upload, jobs, meetings, export, translate, share

api_router = APIRouter()

api_router.include_router(upload.router,   prefix="/upload",   tags=["Upload"])
api_router.include_router(jobs.router,     prefix="/jobs",     tags=["Jobs"])
api_router.include_router(meetings.router, prefix="/meetings", tags=["Meetings"])
api_router.include_router(export.router,   prefix="/export",   tags=["Export"])
api_router.include_router(translate.router,prefix="/translate",tags=["Translate"])
api_router.include_router(share.router,    prefix="/share",    tags=["Share"])
