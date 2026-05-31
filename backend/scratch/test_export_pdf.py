import sys
import os
from datetime import datetime

# Adjust path to find app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.export_generator import generate_pdf

def test():
    meeting_data = {
        "title": "Project Kickoff Meeting",
        "duration_seconds": 1800,
        "speaker_count": 3,
        "created_at": datetime.now(),
        "languages_detected": ["en", "ur"],
        "minutes_en": "## Summary\nWe discussed the project timeline and milestones.\n- Phase 1: Planning and design\n- Phase 2: Core development\n- Phase 3: Testing and deployment\n\n## Discussion Points\n* Timeline is tight but achievable.\n* Need resources for testing.",
        "action_items": [
            {"task": "Prepare wireframes", "owner": "John Doe", "deadline": "2026-06-05", "priority": "high"},
            {"task": "Setup CI/CD pipeline", "owner": "Jane Smith", "deadline": "2026-06-08", "priority": "medium"}
        ],
        "transcript": [
            {"start": 0.0, "end": 5.2, "speaker": "spk_0", "text": "Hello everyone, welcome to the kickoff meeting."},
            {"start": 5.5, "end": 10.0, "speaker": "spk_1", "text": "Hi, glad to be here. Let's get started."}
        ]
    }
    
    pdf_bytes = generate_pdf(meeting_data)
    with open("sample_export.pdf", "wb") as f:
        f.write(pdf_bytes)
    print("PDF generated successfully and saved as sample_export.pdf")

if __name__ == "__main__":
    test()
