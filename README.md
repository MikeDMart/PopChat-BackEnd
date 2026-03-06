# PopChat

AI chat agent for any website. One line to install.

```html
<script src="https://cdn.jsdelivr.net/npm/popchat/popchat.js"></script>
<script>PopChat.init()</script>
```

That's it. PopChat reads the page automatically and answers questions about it.

---

## How it works

```
User opens any page
    ↓
popchat.js reads DOM (title, headings, text, meta)
    ↓
User asks a question
    ↓
Backend (Render) builds RAG prompt from page + session history
    ↓
FreeFlow LLM (Groq → Gemini fallback)
    ↓
Answer grounded in the actual page content
```

Session memory persists across tabs via Redis — if a user visits multiple pages, the AI remembers the journey.

---

## Setup (backend)

### 1. Push to GitHub
```bash
git remote add origin https://github.com/MikeDMart/popchat-backend
git push -u origin main
```

### 2. Deploy to Render
- render.com → New Web Service → connect repo
- Render reads `render.yaml` automatically

### 3. Set environment variables in Render
```
GROQ_API_KEY   = your_groq_key
GEMINI_API_KEY = your_gemini_key
REDIS_URL      = redis://default:PASSWORD@HOST:PORT
```

### 4. Update BACKEND url in popchat.js
```javascript
const BACKEND = 'https://YOUR-APP.onrender.com';
```

---

## npm publish (when ready)
```bash
npm login
npm publish
```

Then anyone can use:
```bash
npm install popchat
```
