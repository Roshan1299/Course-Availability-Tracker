import asyncio
from dataclasses import dataclass
from typing import Dict, Optional
from uuid import uuid4
from datetime import datetime

from seat_monitor.scraper import fetch_seat_value
from seat_monitor.notifier import send_email
from services.persistence import load_state, save_state


@dataclass
class Monitor:
    id: str
    url: str
    course_code: str
    section_label: str
    interval: int
    last_seen: Optional[str]
    notify: bool
    task: asyncio.Task
    last_checked_at: Optional[str] = None
    last_changed_at: Optional[str] = None


class MonitorManager:
    def __init__(self):
        self.monitors: Dict[str, Monitor] = {}
        self._load_persisted_monitors()

    async def _monitor_loop(
        self,
        monitor_id: str,
        page,
        url: str,
        course_code: str,
        section_label: str,
        interval: int,
    ):
        """Background loop for a single monitor."""
        while True:
            try:
                value = await fetch_seat_value(
                    page,
                    url=url,
                    course_code=course_code,
                    section_label=section_label,
                )

                monitor = self.monitors[monitor_id]

                # Update last checked timestamp
                current_time = datetime.now().isoformat()
                monitor.last_checked_at = current_time

                if value is None:
                    print(f"[monitor {monitor_id}] WARNING: Could not find seat value for {course_code} {section_label}")
                else:
                    if monitor.last_seen is None:
                        monitor.last_seen = value
                        monitor.last_changed_at = current_time
                        print(
                            f"[monitor {monitor_id}] INITIAL {course_code} {section_label} = {value} at {current_time}"
                        )
                        # Update persistence with new last_seen and timestamps
                        self._persist_state()
                    elif value != monitor.last_seen:
                        print(
                            f"[monitor {monitor_id}] CHANGE {monitor.last_seen} → {value} at {current_time}"
                        )

                        if monitor.notify:
                            send_email(
                                subject=f"Seat change: {course_code} {section_label}",
                                body=(
                                    f"Seat count changed!\n\n"
                                    f"Course: {course_code}\n"
                                    f"Section: {section_label}\n"
                                    f"Previous: {monitor.last_seen}\n"
                                    f"Current: {value}\n"
                                    f"Time: {current_time}\n"
                                    f"URL: {url}"
                                ),
                            )

                        monitor.last_seen = value
                        monitor.last_changed_at = current_time
                        # Update persistence with new last_seen and timestamps
                        self._persist_state()
                    else:
                        print(
                            f"[monitor {monitor_id}] {course_code} {section_label} = {value} at {current_time}"
                        )

            except Exception as e:
                print(f"[monitor {monitor_id}] error: {e}")

            finally:
                self._persist_state()
                await asyncio.sleep(interval)

            await asyncio.sleep(interval)

    async def start_monitor(
        self,
        browser,
        url: str,
        course_code: str,
        section_label: str,
        interval: int,
        notify: bool,
    ) -> str:
        monitor_id = str(uuid4())

        context = await browser.new_context()
        page = await context.new_page()

        task = asyncio.create_task(
            self._monitor_loop(
                monitor_id,
                page,
                url,
                course_code,
                section_label,
                interval,
            )
        )

        # Initialize timestamps when creating a new monitor
        current_time = datetime.now().isoformat()

        self.monitors[monitor_id] = Monitor(
            id=monitor_id,
            url=url,
            course_code=course_code,
            section_label=section_label,
            interval=interval,
            last_seen=None,
            notify=notify,
            task=task,
            last_checked_at=current_time,  # Initialize with current time
            last_changed_at=None,  # Will be set when a change occurs
        )

        self._persist_state()
        return monitor_id

    async def stop_monitor(self, monitor_id: str) -> bool:
        monitor = self.monitors.get(monitor_id)
        if not monitor:
            return False

        monitor.task.cancel()
        del self.monitors[monitor_id]
        self._persist_state()
        return True

    def list_monitors(self):
        return list(self.monitors.values())
    
    def _load_persisted_monitors(self):
        persisted = load_state()

        for monitor_id, data in persisted.items():
            self.monitors[monitor_id] = Monitor(
                id=monitor_id,
                url=data["url"],
                course_code=data["course_code"],
                section_label=data["section_label"],
                interval=data["interval"],
                last_seen=data.get("last_seen"),
                notify=data.get("notify", True),
                task=None,  # task will be created later when resumed
                last_checked_at=data.get("last_checked_at"),  # Could be None for old monitors
                last_changed_at=data.get("last_changed_at"),  # Could be None for old monitors
            )

    def _persist_state(self):
        save_state(
            {
                m.id: {
                    "url": m.url,
                    "course_code": m.course_code,
                    "section_label": m.section_label,
                    "interval": m.interval,
                    "last_seen": m.last_seen,
                    "notify": m.notify,
                    "last_checked_at": m.last_checked_at,
                    "last_changed_at": m.last_changed_at,
                }
                for m in self.monitors.values()
            }
        )

