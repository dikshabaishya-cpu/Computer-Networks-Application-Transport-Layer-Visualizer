"""
Pydantic data models for Application Layer Protocol Visualizer.
Defines schemas for protocol steps, simulation responses, and activity requests.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ProtocolField(BaseModel):
    name: str
    value: str
    description: Optional[str] = None
    highlight: bool = False

class ProtocolStep(BaseModel):
    id: str
    step_number: int
    protocol: str = Field(description="Protocol family: DNS, HTTP, SMTP")
    stage: str = Field(description="Protocol stage: dns, http, smtp, manifest, segment")
    from_endpoint: str
    to_endpoint: str
    direction: str = Field(description="client-to-server, server-to-client, client-to-dns, dns-to-client")
    message_type: str = Field(description="Short opcode/verb, e.g. QUERY, 200 OK, GET, EHLO")
    summary: str
    raw_message: str
    explanation: str
    important_fields: List[ProtocolField] = []
    metadata: Dict[str, Any] = {}

class SimulationResponse(BaseModel):
    activity: str
    protocol_title: str
    description: str
    endpoints: List[str]
    steps: List[ProtocolStep]
    total_steps: int
    status: str = "READY"
    activity_metadata: Dict[str, Any] = {}

class BrowsingRequest(BaseModel):
    url: str = Field(..., json_schema_extra={"example": "https://example.com"})

class MailRequest(BaseModel):
    to: str = Field(..., json_schema_extra={"example": "student@example.com"})
    from_addr: Optional[str] = Field("student@example.com", json_schema_extra={"example": "student@example.com"})
    subject: str = Field(..., json_schema_extra={"example": "Computer Networks Demo"})
    body: str = Field(..., json_schema_extra={"example": "Testing SMTP protocol visualization."})

class StreamingRequest(BaseModel):
    stream_url: str = Field("https://video.networklab.org/live/lecture.m3u8", json_schema_extra={"example": "https://video.networklab.org/live/lecture.m3u8"})
    quality: str = Field("720p", json_schema_extra={"example": "720p"})
