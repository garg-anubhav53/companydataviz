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

// ── Query resolver ────────────────────────────────────────────────────────────

function resolveQuery(params, data) {
  const { sort_by, order = 'desc', limit = 3, filter } = params;

  function fmtB(b) {
    if (b >= 1000) return `$${(b / 1000).toFixed(1)}T`;
    if (b >= 1)    return `$${b.toFixed(0)}B`;
    return `$${(b * 1000).toFixed(0)}M`;
  }

  function getValue(row, field) {
    switch (field) {
      case 'valuation':    return row.valuation_b;
      case 'arr':          return row.arr_b;
      case 'arr_multiple': return (row.arr_b > 0 && row.valuation_b > 0) ? row.valuation_b / row.arr_b : null;
      case 'founded':      return row.founded_year;
      case 'employees':    return parseInt((row['Employees'] || '').replace(/,/g, ''), 10) || null;
      case 'g2_rating':    return parseFloat(row['G2 Rating']) || null;
      default:             return null;
    }
  }

  function fmtValue(field, val) {
    switch (field) {
      case 'valuation':
      case 'arr':          return fmtB(val);
      case 'arr_multiple': return `${val.toFixed(1)}x`;
      case 'founded':      return String(val);
      case 'employees':    return val.toLocaleString();
      case 'g2_rating':    return val.toFixed(1);
      default:             return String(val);
    }
  }

  // Normalise filter field (LLM may use underscores instead of spaces)
  let rows = data;
  if (filter) {
    const col = filter.field.replace(/_/g, ' ');
    const q   = filter.contains.toLowerCase();
    rows = data.filter(r => (r[col] || '').toLowerCase().includes(q));
  }

  rows = rows.filter(r => getValue(r, sort_by) != null);
  rows.sort((a, b) => {
    const va = getValue(a, sort_by), vb = getValue(b, sort_by);
    return order === 'asc' ? va - vb : vb - va;
  });
  rows = rows.slice(0, limit);

  if (!rows.length) return 'No matching companies found.';

  return rows
    .map((r, i) => `${i + 1}. ${r['Company Name']} — ${fmtValue(sort_by, getValue(r, sort_by))}`)
    .join('<br>');
}

// ── Chat rendering ────────────────────────────────────────────────────────────

function appendTyping() {
  const feed = document.getElementById('chat-messages');
  const el   = document.createElement('div');
  el.className = 'msg assistant';
  el.id = '_typing';
  el.innerHTML = '<div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
  return el;
}

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
  const typing = appendTyping();

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
    typing.remove();

    if (data.error) {
      appendMessage('assistant', `Error: ${data.error}`);
    } else if (data.chart === 'lookup') {
      if (!data.company || !data.field) {
        appendMessage('assistant', "Sorry, I couldn't understand that lookup request.");
      } else {
        withData(rows => appendMessage('assistant', resolveLookup(data.company, data.field, rows)));
      }
    } else if (data.chart === 'query') {
      if (!data.sort_by) {
        appendMessage('assistant', "Sorry, I couldn't understand that query.");
      } else {
        withData(rows => appendMessage('assistant', resolveQuery(data, rows)));
      }
    } else if (data.chart === 'none' || !CHARTS[data.chart]) {
      appendMessage('assistant', data.title);
    } else {
      appendChart(data.chart, data.title);
    }
  } catch {
    typing.remove();
    appendMessage('assistant', 'Something went wrong. Please try again.');
  } finally {
    btn.disabled = false;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Align Chart.js font with the app's system font stack
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  Chart.defaults.font.size   = 12;
  Chart.defaults.color       = '#64748B';

  checkKeyStatus();

  // Welcome message — orients the user to available capabilities
  appendMessage('assistant',
    'Ask me anything about the top 100 SaaS companies.<br><br>' +
    '<em>"Show industry breakdown"</em> &nbsp;·&nbsp; <em>"ARR vs valuation"</em> &nbsp;·&nbsp; ' +
    '<em>"Top investors"</em> &nbsp;·&nbsp; <em>"What is Stripe\'s valuation?"</em>'
  );

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
