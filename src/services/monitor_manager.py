import asyncio
from dataclasses import dataclass
from typing import Dict, Optional
from uuid import uuid4

from seat_monitor.scraper import fetch_seat_value
from seat_monitor.notifier import send_email


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


class MonitorManager:
    def __init__(self):
        self.monitors: Dict[str, Monitor] = {}

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

                if value:
                    if monitor.last_seen is None:
                        monitor.last_seen = value
                    elif value != monitor.last_seen:
                        print(
                            f"[monitor {monitor_id}] CHANGE {monitor.last_seen} → {value}"
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
                                    f"URL: {url}"
                                ),
                            )

                        monitor.last_seen = value
                    else:
                        print(
                            f"[monitor {monitor_id}] {course_code} {section_label} = {value}"
                        )

            except Exception as e:
                print(f"[monitor {monitor_id}] error: {e}")

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

        self.monitors[monitor_id] = Monitor(
            id=monitor_id,
            url=url,
            course_code=course_code,
            section_label=section_label,
            interval=interval,
            last_seen=None,
            notify=notify,
            task=task,
        )

        return monitor_id

    async def stop_monitor(self, monitor_id: str) -> bool:
        monitor = self.monitors.get(monitor_id)
        if not monitor:
            return False

        monitor.task.cancel()
        del self.monitors[monitor_id]
        return True

    def list_monitors(self):
        return list(self.monitors.values())
