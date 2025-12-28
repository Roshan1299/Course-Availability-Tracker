from fastapi import APIRouter, Request, HTTPException
from api.schemas import MonitorCreate, MonitorStatus

router = APIRouter()


@router.post("/monitors", response_model=MonitorStatus)
async def create_monitor(payload: MonitorCreate, request: Request):
    manager = request.app.state.monitor_manager
    browser = request.app.state.browser

    monitor_id = await manager.start_monitor(
        browser=browser,
        url=payload.url,
        course_code=payload.course_code,
        section_label=payload.section_label,
        interval=payload.check_every_seconds,
    )

    monitor = manager.monitors[monitor_id]

    return MonitorStatus(
        id=monitor.id,
        course_code=monitor.course_code,
        section_label=monitor.section_label,
        last_seen=monitor.last_seen,
        running=True,
    )


@router.get("/monitors", response_model=list[MonitorStatus])
def list_monitors(request: Request):
    manager = request.app.state.monitor_manager

    return [
        MonitorStatus(
            id=m.id,
            course_code=m.course_code,
            section_label=m.section_label,
            last_seen=m.last_seen,
            running=True,
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
