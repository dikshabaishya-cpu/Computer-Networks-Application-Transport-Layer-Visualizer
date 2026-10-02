"""
FastAPI application for Computer Networks Application Layer Visualizer.
Serves static UI files and handles simulation REST endpoints.
"""
from pathlib import Path
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .models import (
    BrowsingRequest,
    MailRequest,
    StreamingRequest,
    SimulationResponse,
)
from .simulator import (
    simulate_browsing,
    simulate_mail,
    simulate_streaming,
)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="Application Layer Protocol Visualizer API",
    description="Simulated educational protocol engine for DNS, HTTP, and SMTP",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """Health check endpoint for automated verification and monitoring."""
    return {
        "status": "healthy",
        "service": "Application Layer Protocol Visualizer",
        "version": "1.0.0",
        "supported_activities": ["browsing", "mail", "streaming"]
    }

@app.get("/api/protocols")
async def list_protocols():
    """Returns technical catalog of supported application layer protocols."""
    return {
        "protocols": [
            {
                "id": "browsing",
                "name": "Web Browsing",
                "flow": "DNS (RFC 1035) -> HTTP/1.1 (RFC 7230/7231)",
                "transport": "UDP/53 (DNS) then TCP/80 or TCP/443 (HTTP)",
                "endpoints": ["Client", "DNS Server", "Web Server"]
            },
            {
                "id": "mail",
                "name": "Electronic Mail",
                "flow": "DNS MX (RFC 1035) -> SMTP (RFC 5321)",
                "transport": "UDP/53 (DNS) then TCP/25 or TCP/587 (SMTP)",
                "endpoints": ["Client", "DNS Server", "Mail Server"]
            },
            {
                "id": "streaming",
                "name": "HTTP Live Streaming (HLS)",
                "flow": "DNS -> HTTP Master/Media Playlist -> HTTP Chunks (RFC 8216)",
                "transport": "UDP/53 (DNS) then TCP/80 or TCP/443 (HTTP/1.1)",
                "endpoints": ["Client", "DNS Server", "Media Server"]
            }
        ]
    }

@app.post("/api/simulate/browsing", response_model=SimulationResponse)
async def api_simulate_browsing(req: BrowsingRequest):
    """Simulate DNS resolution and HTTP/1.1 page & asset fetch for given URL."""
    try:
        return simulate_browsing(req.url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.post("/api/simulate/mail", response_model=SimulationResponse)
async def api_simulate_mail(req: MailRequest):
    """Simulate DNS MX resolution and complete RFC 5321 SMTP email delivery dialog."""
    try:
        return simulate_mail(
            to_addr=req.to,
            from_addr=req.from_addr or "student@example.com",
            subject=req.subject,
            body=req.body
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.post("/api/simulate/streaming", response_model=SimulationResponse)
async def api_simulate_streaming(req: StreamingRequest):
    """Simulate DNS resolution, HLS master/media playlists, and transport stream chunk delivery."""
    try:
        return simulate_streaming(
            stream_url=req.stream_url,
            quality=req.quality
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    async def serve_index():
        index_path = FRONTEND_DIR / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        return {"message": "Frontend index.html is being initialized."}

from .transport_simulator import simulate_transport_browsing, simulate_transport_mail, simulate_transport_streaming

@app.get("/api/transport/{activity}", response_model=SimulationResponse)
async def api_transport(activity: str):
    generators={"browsing":simulate_transport_browsing,"mail":simulate_transport_mail,"streaming":simulate_transport_streaming}
    if activity not in generators:
        raise HTTPException(status_code=404, detail="Unknown activity")
    return generators[activity]()
