"""
Builds the system prompt by combining:
- Current page context (DOM extracted by popchat.js)
- Session history (pages previously seen)
"""

def build_system_prompt(page_context: dict, pages_seen: list) -> str:
    current_url   = page_context.get("url", "unknown")
    current_title = page_context.get("title", "")
    headings      = page_context.get("headings", [])
    text_snippets = page_context.get("text", [])
    meta_desc     = page_context.get("meta_description", "")

    # Current page context
    current_section = f"""
You are PopChat, a helpful AI assistant embedded on a website.

CURRENT PAGE:
- URL: {current_url}
- Title: {current_title}
- Description: {meta_desc}
- Headings: {', '.join(headings[:8])}
- Content: {' '.join(text_snippets[:15])}
""".strip()

    # Pages previously seen this session
    history_section = ""
    if pages_seen:
        history_section = "\n\nPAGES THIS USER VISITED EARLIER THIS SESSION:"
        for i, page in enumerate(pages_seen[-5:], 1):
            history_section += f"\n{i}. {page.get('title', '')} — {page.get('url', '')}"

    rules = """

RULES:
- Answer based on the page content above
- Be concise, friendly, and helpful
- If asked something unrelated to the page, answer briefly but bring focus back
- Detect the user's language and respond in the same language
- Never make up information not present in the page context
"""

    return current_section + history_section + rules
