"""Custom exception hierarchy for MeetMind AI."""
from fastapi import Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    """Base application exception."""
    def __init__(self, code: str, message: str, status_code: int = 400, details=None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class UploadException(AppException):
    def __init__(self, message: str, details=None):
        super().__init__("UPLOAD_ERROR", message, 400, details)


class ProcessingException(AppException):
    def __init__(self, message: str, details=None):
        super().__init__("PROCESSING_ERROR", message, 500, details)


class TranscriptionException(ProcessingException):
    def __init__(self, message: str, details=None):
        self.code = "TRANSCRIPTION_ERROR"
        self.message = message
        self.status_code = 500
        self.details = details


class DiarizationException(ProcessingException):
    def __init__(self, message: str, details=None):
        self.code = "DIARIZATION_ERROR"
        self.message = message
        self.status_code = 500
        self.details = details


class AIGenerationException(ProcessingException):
    def __init__(self, message: str, details=None):
        self.code = "AI_GENERATION_ERROR"
        self.message = message
        self.status_code = 500
        self.details = details


class ExportException(AppException):
    def __init__(self, message: str, details=None):
        super().__init__("EXPORT_ERROR", message, 500, details)


class AuthException(AppException):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__("AUTH_ERROR", message, 401)


async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}},
    )
