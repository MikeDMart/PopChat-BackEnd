/* ════════════════════════════════════════════════════════
   PopChat v1.0.0
   AI chat agent for any website.
   npm install popchat  /  <script src="popchat.js"></script>
   Usage: PopChat.init()
   ════════════════════════════════════════════════════════ */

const PopChat = (() => {

  // ── CONFIG ──────────────────────────────────────────────
  const BACKEND  = 'https://popchat-backend-2abp.onrender.com';
  const MAX_TEXT = 20;
  const MAX_H    = 8;

  // ── SESSION ID — persists across tabs ───────────────────
  function getSessionId() {
    let id = localStorage.getItem('popchat_session');
    if (!id) {
      id = 'pc_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('popchat_session', id);
    }
    return id;
  }

  // ── DOM READER — extracts page context automatically ────
  function readPage() {
    const metaEl = document.querySelector('meta[name="description"]');
    const SKIP   = 'script,style,nav,footer,header,noscript';

    const headings = [...document.querySelectorAll('h1,h2,h3')]
      .map(el => el.innerText.trim()).filter(Boolean).slice(0, MAX_H);

    const text = [...document.querySelectorAll('p,li,td,[class*="desc"],[class*="content"]')]
      .filter(el => !el.closest(SKIP))
      .map(el => el.innerText.trim())
      .filter(t => t.length > 30)
      .slice(0, MAX_TEXT);

    return {
      url:              window.location.href,
      title:            document.title || '',
      meta_description: metaEl?.content || '',
      headings,
      text,
    };
  }

  // ── API CALL ─────────────────────────────────────────────
  async function sendMessage(message) {
    const res = await fetch(`${BACKEND}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id:   getSessionId(),
        message,
        page_context: readPage(),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).content;
  }

  // ── STATE ────────────────────────────────────────────────
  let _open = false;

  // ── STYLES ───────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('popchat-styles')) return;
    const s = document.createElement('style');
    s.id = 'popchat-styles';
    s.textContent = `
      #popchat-wrap * { box-sizing: border-box; margin: 0; padding: 0; }
      #popchat-wrap {
        position: fixed; bottom: 1.5rem; right: 1.5rem;
        z-index: 99999;
        font-family: system-ui, -apple-system, sans-serif;
      }
      #popchat-fab {
        display: flex; align-items: center; gap: .5rem;
        padding: .65rem 1.2rem; border-radius: 999px;
        background: #6c47ff; color: #fff; border: none; cursor: pointer;
        font-size: .82rem; font-weight: 600;
        box-shadow: 0 4px 24px rgba(108,71,255,.45);
        transition: transform .2s, box-shadow .2s;
        white-space: nowrap;
      }
      #popchat-fab:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 28px rgba(108,71,255,.55);
      }
      .pc-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: #4eff91; flex-shrink: 0;
        animation: pc-pulse 2s ease-in-out infinite;
      }
      @keyframes pc-pulse {
        0%,100% { opacity:1; transform:scale(1); }
        50%      { opacity:.5; transform:scale(.8); }
      }
      #popchat-panel {
        position: absolute; bottom: 3.8rem; right: 0;
        width: 340px; background: #fff; border-radius: 18px;
        box-shadow: 0 16px 60px rgba(0,0,0,.18);
        overflow: hidden; display: flex; flex-direction: column;
        border: 1px solid rgba(0,0,0,.08);
        transition: opacity .22s, transform .22s;
      }
      #popchat-panel.pc-hidden {
        opacity: 0; pointer-events: none;
        transform: translateY(10px) scale(.98);
      }
      #popchat-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: .85rem 1rem; background: #6c47ff; color: #fff;
      }
      #popchat-header-left { display: flex; align-items: center; gap: .5rem; }
      #popchat-header-info { display: flex; flex-direction: column; }
      #popchat-header-title { font-size: .82rem; font-weight: 700; }
      #popchat-header-sub   { font-size: .62rem; opacity: .7; margin-top: 1px; }
      #popchat-close {
        background: rgba(255,255,255,.15); border: none; color: #fff;
        width: 26px; height: 26px; border-radius: 50%; cursor: pointer;
        font-size: .75rem; display: flex; align-items: center; justify-content: center;
        transition: background .15s; flex-shrink: 0;
      }
      #popchat-close:hover { background: rgba(255,255,255,.3); }
      #popchat-messages {
        flex: 1; max-height: 300px; overflow-y: auto;
        padding: .85rem; display: flex; flex-direction: column;
        gap: .55rem; background: #fafafa;
        scrollbar-width: thin; scrollbar-color: #e0e0e0 transparent;
      }
      .pc-msg {
        max-width: 88%; padding: .55rem .8rem; border-radius: 12px;
        font-size: .8rem; line-height: 1.55;
        animation: pc-in .18s ease;
      }
      @keyframes pc-in {
        from { opacity:0; transform:translateY(4px); }
        to   { opacity:1; transform:translateY(0); }
      }
      .pc-user {
        align-self: flex-end; background: #6c47ff; color: #fff;
        border-bottom-right-radius: 3px;
      }
      .pc-ai {
        align-self: flex-start; background: #fff; color: #1a1a1a;
        border: 1px solid #ebebeb; border-bottom-left-radius: 3px;
        box-shadow: 0 1px 4px rgba(0,0,0,.06);
      }
      .pc-ai.pc-loading { opacity: .6; font-style: italic; }
      #popchat-input-row {
        display: flex; gap: .4rem; padding: .65rem;
        border-top: 1px solid #f0f0f0; background: #fff;
      }
      #popchat-input {
        flex: 1; height: 36px; padding: 0 .7rem;
        border-radius: 10px; border: 1.5px solid #e8e8e8;
        font-size: .8rem; color: #1a1a1a; outline: none;
        transition: border-color .2s;
      }
      #popchat-input:focus { border-color: #6c47ff; }
      #popchat-input::placeholder { color: #aaa; }
      #popchat-send {
        width: 36px; height: 36px; border-radius: 10px;
        background: #6c47ff; color: #fff; border: none;
        cursor: pointer; font-size: 1rem;
        display: flex; align-items: center; justify-content: center;
        transition: opacity .2s; flex-shrink: 0;
      }
      #popchat-send:hover   { opacity: .85; }
      #popchat-send:disabled { opacity: .35; cursor: not-allowed; }
      #popchat-branding {
        text-align: center; padding: .35rem;
        font-size: .58rem; color: #ccc; background: #fff;
        letter-spacing: .04em;
      }
      #popchat-branding a { color: #6c47ff; text-decoration: none; }
      @media (max-width: 480px) {
        #popchat-panel { width: calc(100vw - 2rem); right: -.5rem; }
      }
    `;
    document.head.appendChild(s);
  }

  // ── BUILD WIDGET ─────────────────────────────────────────
  function buildWidget() {
    if (document.getElementById('popchat-wrap')) return;
    const wrap = document.createElement('div');
    wrap.id = 'popchat-wrap';
    wrap.innerHTML = `
      <button id="popchat-fab">
        <span class="pc-dot"></span>
        Ask AI
      </button>
      <div id="popchat-panel" class="pc-hidden">
        <div id="popchat-header">
          <div id="popchat-header-left">
            <span class="pc-dot"></span>
            <div id="popchat-header-info">
              <span id="popchat-header-title">PopChat</span>
              <span id="popchat-header-sub">AI assistant · knows this page</span>
            </div>
          </div>
          <button id="popchat-close">✕</button>
        </div>
        <div id="popchat-messages"></div>
        <div id="popchat-input-row">
          <input id="popchat-input" type="text" placeholder="Ask anything about this page…" autocomplete="off" />
          <button id="popchat-send">→</button>
        </div>
        <div id="popchat-branding">Powered by <a href="https://github.com/MikeDMart" target="_blank">PopChat</a></div>
      </div>
    `;
    document.body.appendChild(wrap);
  }

  // ── ADD MESSAGE ───────────────────────────────────────────
  function addMsg(text, role, loading = false) {
    const box = document.getElementById('popchat-messages');
    const d   = document.createElement('div');
    d.className = `pc-msg pc-${role}${loading ? ' pc-loading' : ''}`;
    d.textContent = text;
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
    return d;
  }

  // ── SEND ─────────────────────────────────────────────────
  async function handleSend() {
    const input = document.getElementById('popchat-input');
    const btn   = document.getElementById('popchat-send');
    const text  = input.value.trim();
    if (!text) return;

    input.value  = '';
    btn.disabled = true;
    addMsg(text, 'user');

    const loader = addMsg('Thinking…', 'ai', true);

    try {
      const reply = await sendMessage(text);
      loader.textContent = reply;
      loader.classList.remove('pc-loading');
    } catch {
      loader.textContent = 'Sorry, something went wrong. Try again.';
      loader.classList.remove('pc-loading');
    } finally {
      btn.disabled = false;
      input.focus();
    }
  }

  // ── TOGGLE ────────────────────────────────────────────────
  function toggle() {
    _open = !_open;
    document.getElementById('popchat-panel').classList.toggle('pc-hidden', !_open);
    if (_open) {
      const box = document.getElementById('popchat-messages');
      if (!box.children.length) {
        addMsg("Hi! I've read this page and I'm ready to help. What would you like to know?", 'ai');
      }
      document.getElementById('popchat-input').focus();
    }
  }

  // ── INIT — public method ──────────────────────────────────
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _boot);
    } else {
      _boot();
    }
  }

  function _boot() {
    injectStyles();
    buildWidget();
    document.getElementById('popchat-fab').addEventListener('click', toggle);
    document.getElementById('popchat-close').addEventListener('click', toggle);
    document.getElementById('popchat-send').addEventListener('click', handleSend);
    document.getElementById('popchat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSend();
    });
  }

  return { init };

})();

// Support both ESM and script tag
if (typeof module !== 'undefined') module.exports = PopChat;
