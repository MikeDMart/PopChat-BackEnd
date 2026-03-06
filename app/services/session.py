"""
Session management via Redis.
Stores chat history + pages seen per session_id.
"""

import json
import os
import redis

REDIS_URL = os.getenv("REDIS_URL")
SESSION_TTL = 60 * 60 * 24  # 24 hours

_client = None

def get_redis():
    global _client
    if _client is None:
        _client = redis.from_url(REDIS_URL, decode_responses=True)
    return _client

def get_session(session_id: str) -> dict:
    try:
        r = get_redis()
        raw = r.get(f"popchat:{session_id}")
        if raw:
            return json.loads(raw)
    except Exception:
        pass
    return {"history": [], "pages_seen": []}

def save_session(session_id: str, session: dict):
    try:
        r = get_redis()
        r.setex(
            f"popchat:{session_id}",
            SESSION_TTL,
            json.dumps(session)
        )
    except Exception:
        pass  # degrade gracefully if Redis is down

def update_session(session_id: str, user_msg: str, ai_msg: str, page_context: dict):
    session = get_session(session_id)

    # Add messages to history (keep last 20)
    session["history"].append({"role": "user",      "content": user_msg})
    session["history"].append({"role": "assistant", "content": ai_msg})
    session["history"] = session["history"][-20:]

    # Track pages seen (keep last 10, avoid duplicates)
    url = page_context.get("url", "")
    if url and not any(p.get("url") == url for p in session["pages_seen"]):
        session["pages_seen"].append(page_context)
        session["pages_seen"] = session["pages_seen"][-10:]

    save_session(session_id, session)
