from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_chat_route_exists():
    routes = [r.path for r in app.routes]
    assert "/api/chat" in routes

@patch("app.routes.chat.FreeFlowClient")
@patch("app.routes.chat.get_session", return_value={"history": [], "pages_seen": []})
@patch("app.routes.chat.update_session")
def test_chat_returns_content(mock_update, mock_session, mock_ff):
    mock_response = MagicMock()
    mock_response.content  = "Hello!"
    mock_response.provider = "groq"
    mock_ff.return_value.__enter__.return_value.chat.return_value = mock_response

    r = client.post("/api/chat", json={
        "session_id": "test_123",
        "message": "Hello",
        "page_context": {
            "url": "https://example.com",
            "title": "Test",
            "meta_description": "",
            "headings": [],
            "text": []
        }
    })
    assert r.status_code == 200
    assert r.json()["content"] == "Hello!"
