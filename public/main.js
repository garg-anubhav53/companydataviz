// Maps chart_id returned by the LLM to the matching init function and canvas label.
const CHARTS = {
  pie:       { init: (id) => initIndustryPie(id) },
  scatter:   { init: (id) => initFoundedValuationScatter(id) },
  investors: { init: (id) => initInvestorBar(id) },
};

let userApiKey = null;   // set if user pastes a key manually
let canvasCounter = 0;   // ensures each canvas has a unique id

// ── API key status ────────────────────────────────────────────────────────────

async function testKey(apiKey) {
  const dot   = document.getElementById('key-dot');
  const label = document.getElementById('key-label');

  label.textContent = 'Testing key…';
  dot.className = '';

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;

  try {
    const { ok, error } = await fetch('/api/test-key', { headers }).then(r => r.json());
    if (ok) {
      dot.classList.add('connected');
      label.textContent = 'API key verified';
    } else {
      dot.classList.add('error');
      label.textContent = `Key invalid: ${error}`;
    }
  } catch {
    dot.classList.add('error');
    label.textContent = 'Could not reach server.';
  }
}

async function checkKeyStatus() {
  const dot     = document.getElementById('key-dot');
  const label   = document.getElementById('key-label');
  const input   = document.getElementById('key-input');
  const testBtn = document.getElementById('test-key-btn');

  const { hasKey } = await fetch('/api/key-status').then(r => r.json());

  if (hasKey) {
    // Key is in .env — test it automatically
    await testKey(null);
  } else {
    dot.className = '';
    label.textContent = 'No API key —';
    input.style.display = 'inline';
    testBtn.style.display = 'inline';

    testBtn.addEventListener('click', async () => {
      userApiKey = input.value.trim();
      if (!userApiKey) return;
      await testKey(userApiKey);
      const dot = document.getElementById('key-dot');
      if (dot.classList.contains('connected')) {
        input.style.display = 'none';
        testBtn.style.display = 'none';
      }
    });
  }
}

// ── Chat rendering ────────────────────────────────────────────────────────────

function appendMessage(role, text) {
  const feed = document.getElementById('chat-messages');
  const msg  = document.createElement('div');
  msg.className = `msg ${role}`;
  msg.innerHTML = `<div class="msg-bubble">${text}</div>`;
  feed.appendChild(msg);
  feed.scrollTop = feed.scrollHeight;
}

function appendChart(chartId, title) {
  const feed    = document.getElementById('chat-messages');
  const wrapper = document.createElement('div');
  wrapper.className = 'msg assistant';

  const canvasId = `chart-${++canvasCounter}`;
  wrapper.innerHTML = `
    <div class="msg-caption">${title}</div>
    <div class="chart-wrapper"><canvas id="${canvasId}"></canvas></div>
  `;

  feed.appendChild(wrapper);
  feed.scrollTop = feed.scrollHeight;

  // Chart.js needs the canvas to be in the DOM before init
  CHARTS[chartId].init(canvasId);
}

// ── Send ──────────────────────────────────────────────────────────────────────

async function sendMessage(prompt) {
  appendMessage('user', prompt);

  const btn = document.getElementById('send-btn');
  btn.disabled = true;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (userApiKey) headers['x-api-key'] = userApiKey;

    const res  = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: prompt }),
    });

    const data = await res.json();

    if (data.error) {
      appendMessage('assistant', `Error: ${data.error}`);
    } else if (data.chart === 'none' || !CHARTS[data.chart]) {
      appendMessage('assistant', data.title);
    } else {
      appendChart(data.chart, data.title);
    }
  } catch {
    appendMessage('assistant', 'Something went wrong. Please try again.');
  } finally {
    btn.disabled = false;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  checkKeyStatus();

  document.getElementById('chat-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const prompt = input.value.trim();
    if (!prompt) return;
    input.value = '';
    sendMessage(prompt);
  });
});
