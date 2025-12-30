from fastapi import APIRouter, Request, HTTPException
from api.schemas import MonitorCreate, MonitorStatus
from services.notification_store import load_notifications

router = APIRouter()


@router.post("/monitors", response_model=MonitorStatus, response_model_exclude_none=False)
async def create_monitor(payload: MonitorCreate, request: Request):
    manager = request.app.state.monitor_manager
    browser = request.app.state.browser

    monitor_id = await manager.start_monitor(
        browser=browser,
        url=payload.url,
        course_code=payload.course_code,
        section_label=payload.section_label,
        interval=payload.check_every_seconds,
        notify=payload.notify,
    )

    monitor = manager.monitors[monitor_id]

    return MonitorStatus(
        id=monitor.id,
        course_code=monitor.course_code,
        section_label=monitor.section_label,
        last_seen=monitor.last_seen,
        running=True,
        last_checked_at=monitor.last_checked_at,
        last_changed_at=monitor.last_changed_at,
        mode=monitor.mode,
        health=monitor.health,
    )


@router.get("/monitors", response_model=list[MonitorStatus], response_model_exclude_none=False)
def list_monitors(request: Request):
    manager = request.app.state.monitor_manager

    return [
        MonitorStatus(
            id=m.id,
            course_code=m.course_code,
            section_label=m.section_label,
            last_seen=m.last_seen,
            running=True,
            last_checked_at=m.last_checked_at,
            last_changed_at=m.last_changed_at,
            mode=m.mode,
            health=m.health,
        )
        for m in manager.list_monitors()
    ]


@router.delete("/monitors/{monitor_id}")
async def delete_monitor(monitor_id: str, request: Request):
    manager = request.app.state.monitor_manager

    stopped = await manager.stop_monitor(monitor_id)
    if not stopped:
        raise HTTPException(status_code=404, detail="Monitor not found")

    return {"status": "stopped"}


@router.post("/monitors/{monitor_id}/pause")
async def pause_monitor(monitor_id: str, request: Request):
    manager = request.app.state.monitor_manager

    paused = await manager.pause_monitor(monitor_id)
    if not paused:
        raise HTTPException(status_code=404, detail="Monitor not found")

    return {"status": "paused"}


@router.post("/monitors/{monitor_id}/resume")
async def resume_monitor(monitor_id: str, request: Request):
    manager = request.app.state.monitor_manager
    browser = request.app.state.browser

    resumed = await manager.resume_monitor(monitor_id, browser)
    if not resumed:
        raise HTTPException(status_code=404, detail="Monitor not found")

    return {"status": "resumed"}

@router.get("/notifications")
def list_notifications():
    return load_notifications()