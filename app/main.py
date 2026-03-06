"""
PopChat Backend — FastAPI + FreeFlow LLM + Redis
Universal AI chat agent for any website.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat

app = FastAPI(title="PopChat", version="1.0.0")

# All origins allowed — PopChat is a public npm package
# used on any website
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(chat.router, prefix="/api")

@app.get("/")
def health():
    return {"status": "ok", "service": "PopChat"}
