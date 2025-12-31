import asyncio
from dataclasses import dataclass
from typing import Dict, Optional
from uuid import uuid4
from datetime import datetime

from seat_monitor.scraper import fetch_seat_value
from seat_monitor.notifier import send_email
from services.persistence import load_state, save_state
from services.notification_store import log_notification


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
    mode: str = "active"  # "active", "paused", "stopped"
    health: str = "healthy"  # "healthy", "stale", "error", "stopped"
    email: str = ""


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
            # Get monitor reference outside the try block to ensure it's available in exception handler
            monitor = self.monitors[monitor_id]

            try:
                value = await fetch_seat_value(
                    page,
                    url=url,
                    course_code=course_code,
                    section_label=section_label,
                )

                # Update last checked timestamp
                current_time = datetime.now().isoformat()
                monitor.last_checked_at = current_time
                # Update health to healthy since we successfully checked
                monitor.health = "healthy"

                if value is None:
                    print(f"[monitor {monitor_id}] WARNING: Could not find seat value for {course_code} {section_label}")
                    # Consider this as potentially stale if consistently failing
                    monitor.health = "stale"
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
                        log_notification(
                                monitor_id=monitor.id,
                                course_code=course_code,
                                section_label=section_label,
                                old_value=monitor.last_seen,
                                new_value=value,
                            )

                        print(
                            f"[monitor {monitor_id}] CHANGE {monitor.last_seen} → {value} at {current_time}"
                        )

                        if monitor.notify and monitor.email:
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
                                recipient_email=monitor.email,
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
                # Update health to error since we encountered an exception
                monitor.health = "error"
                self._persist_state()

            await asyncio.sleep(interval)

    async def start_monitor(
        self,
        browser,
        url: str,
        course_code: str,
        section_label: str,
        interval: int,
        notify: bool,
        email: str = "",
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
            mode="active",  # New monitors start in active mode
            health="healthy",  # New monitors start in healthy state
            email=email,  # Store the user's email
        )

        self._persist_state()
        return monitor_id

    async def stop_monitor(self, monitor_id: str) -> bool:
        monitor = self.monitors.get(monitor_id)
        if not monitor:
            return False

        monitor.task.cancel()
        monitor.mode = "stopped"
        monitor.health = "stopped"
        del self.monitors[monitor_id]
        self._persist_state()
        return True

    def list_monitors(self):
        return list(self.monitors.values())

    async def pause_monitor(self, monitor_id: str) -> bool:
        """Pause a monitor (stop the task but keep the monitor in memory)"""
        monitor = self.monitors.get(monitor_id)
        if not monitor:
            return False

        if monitor.task:
            monitor.task.cancel()
            monitor.mode = "paused"
            monitor.health = "stopped"  # Task is not running
            self._persist_state()
        return True

    async def resume_monitor(self, monitor_id: str, browser) -> bool:
        """Resume a paused monitor (restart the task)"""
        monitor = self.monitors.get(monitor_id)
        if not monitor or monitor.mode != "paused":
            return False

        # Create new context and page
        context = await browser.new_context()
        page = await context.new_page()

        # Create new task
        monitor.task = asyncio.create_task(
            self._monitor_loop(
                monitor.id,
                page,
                monitor.url,
                monitor.course_code,
                monitor.section_label,
                monitor.interval,
            )
        )

        monitor.mode = "active"
        monitor.health = "healthy"
        self._persist_state()
        return True
    
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
                mode=data.get("mode", "active"),  # Default to active for old monitors
                health=data.get("health", "healthy"),  # Default to healthy for old monitors
                email=data.get("email", ""),  # Default to empty string for old monitors
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
                    "mode": m.mode,
                    "health": m.health,
                    "email": m.email,
                }
                for m in self.monitors.values()
            }
        )

