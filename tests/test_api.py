import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "browsing" in data["supported_activities"]

def test_api_protocols():
    resp = client.get("/api/protocols")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["protocols"]) == 3

def test_api_browsing_simulation():
    resp = client.post("/api/simulate/browsing", json={"url": "https://example.com"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["activity"] == "browsing"
    assert len(data["steps"]) >= 4

def test_api_browsing_empty_url_error():
    resp = client.post("/api/simulate/browsing", json={"url": ""})
    assert resp.status_code == 400

def test_api_mail_simulation():
    resp = client.post("/api/simulate/mail", json={
        "to": "student@example.com",
        "subject": "Testing API",
        "body": "Hello Networks"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["activity"] == "mail"
    assert len(data["steps"]) == 15

def test_api_mail_invalid_recipient_error():
    resp = client.post("/api/simulate/mail", json={
        "to": "invalid-address",
        "subject": "Test",
        "body": "Body"
    })
    assert resp.status_code == 400

def test_api_streaming_simulation():
    resp = client.post("/api/simulate/streaming", json={
        "stream_url": "https://video.networklab.org/live/lecture.m3u8",
        "quality": "1080p"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["activity"] == "streaming"
    assert data["activity_metadata"]["quality"] == "1080p"

def test_transport_endpoint_browsing():
    response = client.get('/api/transport/browsing')
    assert response.status_code == 200
    data=response.json()
    assert data['activity']=='browsing'
    assert data['steps'][0]['message_type']=='SYN'
    assert data['steps'][1]['metadata']['ack']==1001
