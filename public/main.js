// Maps chart_id to its initializer. Each init receives (canvasId, data).
// To add a new chart: one entry here + the HTML panel + a script tag.
const CHARTS = {
  pie:           { init: (id, data) => initIndustryPie(id, data) },
  scatter:       { init: (id, data) => initFoundedValuationScatter(id, data) },
  investors:     { init: (id, data) => initInvestorBar(id, data) },
  'arr-scatter': { init: (id, data) => initArrValuationScatter(id, data) },
};

let appData = null;       // populated once by loadData()
let userApiKey = null;
let canvasCounter = 0;

// ── Data loading ──────────────────────────────────────────────────────────────

function withData(callback) {
  if (appData) return callback(appData);
  loadData(rows => { appData = rows; callback(appData); });
}

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
      if (document.getElementById('key-dot').classList.contains('connected')) {
        input.style.display = 'none';
        testBtn.style.display = 'none';
      }
    });
  }
}

// ── Company lookup ────────────────────────────────────────────────────────────

function resolveLookup(company, field, data) {
  const q = company.toLowerCase();
  const row = data.find(r => r['Company Name'].toLowerCase() === q)
           || data.find(r => r['Company Name'].toLowerCase().includes(q));

  if (!row) return `No company matching "${company}" found in the dataset.`;

  const name = row['Company Name'];

  function fmtB(b) {
    if (b == null) return null;
    if (b < 1)    return `$${(b * 1000).toFixed(0)}M`;
    if (b < 1000) return `$${b}B`;
    return `$${(b / 1000).toFixed(1)}T`;
  }

  switch (field) {
    case 'valuation': return fmtB(row.valuation_b)   ? `${name} valuation: ${fmtB(row.valuation_b)}`        : `${name}: valuation not available.`;
    case 'arr':       return fmtB(row.arr_b)          ? `${name} ARR: ${fmtB(row.arr_b)}`                    : `${name}: ARR not available.`;
    case 'investors': return `${name} top investors: ${row['Top Investors']  || 'not available'}`;
    case 'industry':  return `${name} industry: ${row['Industry']            || 'not available'}`;
    case 'hq':        return `${name} headquarters: ${row['HQ']              || 'not available'}`;
    case 'employees': return `${name} employees: ${row['Employees']          || 'not available'}`;
    case 'funding':   return `${name} total funding: ${row['Total Funding']  || 'not available'}`;
    case 'founded':   return `${name} founded: ${row.founded_year            || 'not available'}`;
    case 'product':   return `${name} product: ${row['Product']              || 'not available'}`;
    case 'g2_rating': return `${name} G2 rating: ${row['G2 Rating']         || 'not available'}`;
    default:          return `Unknown field "${field}".`;
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
  const feed     = document.getElementById('chat-messages');
  const canvasId = `chart-${++canvasCounter}`;
  const wrapper  = document.createElement('div');
  wrapper.className = 'msg assistant';
  wrapper.innerHTML = `
    <div class="msg-caption">${title}</div>
    <div class="chart-wrapper"><canvas id="${canvasId}"></canvas></div>
  `;
  feed.appendChild(wrapper);
  feed.scrollTop = feed.scrollHeight;

  // Canvas must be in the DOM before Chart.js init; data must be loaded first
  withData(data => CHARTS[chartId].init(canvasId, data));
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
    } else if (data.chart === 'lookup') {
      if (!data.company || !data.field) {
        appendMessage('assistant', "Sorry, I couldn't understand that lookup request.");
      } else {
        withData(rows => appendMessage('assistant', resolveLookup(data.company, data.field, rows)));
      }
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

  // Pre-load CSV data in the background so first chart render is instant
  withData(() => {});

  document.getElementById('chat-form').addEventListener('submit', e => {
    e.preventDefault();
    const input  = document.getElementById('chat-input');
    const prompt = input.value.trim();
    if (!prompt) return;
    input.value = '';
    sendMessage(prompt);
  });
});
