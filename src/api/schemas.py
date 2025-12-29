from pydantic import BaseModel
from typing import Optional


class MonitorCreate(BaseModel):
    url: str
    course_code: str
    section_label: str
    check_every_seconds: int = 90
    notify: bool = True


class MonitorStatus(BaseModel):
    id: str
    course_code: str
    section_label: str
    last_seen: Optional[str]
    running: bool
    last_checked_at: Optional[str]
    last_changed_at: Optional[str]
