from fastapi import FastAPI
from playwright.async_api import async_playwright
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pathlib import Path
from api.routes import router
from services.monitor_manager import MonitorManager

app = FastAPI(
    title="Course Availability Tracker API",
    version="0.2.0",
)

app.state.monitor_manager = MonitorManager()
app.state.playwright = None
app.state.browser = None


@app.on_event("startup")
async def startup():
    app.state.playwright = await async_playwright().start()
    app.state.browser = await app.state.playwright.chromium.launch(headless=True)


@app.on_event("shutdown")
async def shutdown():
    await app.state.browser.close()
    await app.state.playwright.stop()


app.include_router(router)

BASE_DIR = Path(__file__).resolve().parent.parent

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "ui" / "static"),
    name="static",
)

@app.get("/", response_class=HTMLResponse)
def serve_ui():
    html_path = BASE_DIR / "ui" / "templates" / "index.html"
    return html_path.read_text()