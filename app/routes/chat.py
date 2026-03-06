from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from freeflow_llm import FreeFlowClient, NoProvidersAvailableError
from app.services.session import get_session, update_session
from app.services.context import build_system_prompt

router = APIRouter()

class PageContext(BaseModel):
    url:              str  = ""
    title:            str  = ""
    meta_description: str  = ""
    headings:         list = []
    text:             list = []

class ChatRequest(BaseModel):
    session_id:   str
    message:      str
    page_context: PageContext

@router.post("/chat")
async def chat(body: ChatRequest):
    try:
        # 1. Load session from Redis
        session = get_session(body.session_id)

        # 2. Build RAG system prompt from page + session history
        system_prompt = build_system_prompt(
            body.page_context.model_dump(),
            session["pages_seen"]
        )

        # 3. Compose messages: system + history + new message
        messages = [
            {"role": "system", "content": system_prompt},
            *session["history"][-10:],  # last 10 messages for context
            {"role": "user", "content": body.message},
        ]

        # 4. Call FreeFlow (Groq → Gemini fallback)
        with FreeFlowClient() as ai:
            response = ai.chat(messages=messages, max_tokens=600)

        ai_reply = response.content

        # 5. Persist updated session
        update_session(
            body.session_id,
            body.message,
            ai_reply,
            body.page_context.model_dump()
        )

        return {
            "content":  ai_reply,
            "provider": response.provider,
        }

    except NoProvidersAvailableError:
        raise HTTPException(status_code=503, detail="AI providers unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
