from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()

templates = Jinja2Templates(directory="templates")


@router.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):

    menu = [
       {
           "title": "TV",
           "icon": "📺",
           "active": True,
           "action": "/tv",
       },
       {
           "title": "Recordings",
           "icon": "🎬",
           "active": False,
           "action": "/recordings",
       },
       {
           "title": "Settings",
           "icon": "⚙",
           "active": False,
           "action": "/settings",
       },
       {
           "title": "Help",
           "icon": "❓",
           "active": False,
           "action": "/help",
       },
       {
           "title": "Contact",
           "icon": "✉",
           "active": False,
           "action": "/contact",
       },
    ]
    return templates.TemplateResponse(
       request=request,
       name="dashboard.html",
       context={
           "menu": menu
       }
    )
