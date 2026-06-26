// Shared fetch helper. All pages are served by the same Express
// server, so API calls are same-origin — no need to hardcode a host.
const API_BASE = '/api';

async function apiRequest(path, { method = 'GET', body, auth = false, isFormData = false } = {}) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = localStorage.getItem('voteToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

async function adminRequest(path, { method = 'GET', body, isFormData = false } = {}) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  headers['Authorization'] = `Bearer ${localStorage.getItem('adminToken')}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

function showAlert(el, message, type = 'error') {
  el.textContent = message;
  el.className = `alert show ${type}`;
}

function hideAlert(el) {
  el.className = 'alert';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Formats the time remaining until (or since) a target ISO date
function formatCountdown(targetIso, nowDate) {
  const diffMs = new Date(targetIso) - nowDate;
  const past = diffMs < 0;
  const abs = Math.abs(diffMs);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const mins = Math.floor((abs % 3600000) / 60000);
  const secs = Math.floor((abs % 60000) / 1000);
  let parts = [];
  if (days) parts.push(`${days}d`);
  parts.push(`${hours}h`, `${mins}m`, `${secs}s`);
  return (past ? '-' : '') + parts.join(' ');
}

// Renders the status banner shared by vote.html and results.html
function renderStatusBanner(el, election, opts = {}) {
  const { status, start_time, end_time, title, server_time } = election;
  const now = new Date(server_time);
  el.className = `status-banner ${status}`;

  const labels = {
    not_configured: 'Voting has not been set up yet',
    not_started: `Voting opens soon — ${title}`,
    open: `Voting is open — ${title}`,
    closed: `Voting has closed — ${title}`
  };

  let countdownHtml = '';
  if (status === 'not_started') {
    countdownHtml = `<span class="countdown">starts in ${formatCountdown(start_time, now)}</span>`;
  } else if (status === 'open') {
    countdownHtml = `<span class="countdown">closes in ${formatCountdown(end_time, now)}</span>`;
  } else if (status === 'closed') {
    countdownHtml = `<span class="countdown">ended ${formatCountdown(end_time, now)} ago</span>`;
  }

  el.innerHTML = `<span class="label">${labels[status]}</span>${countdownHtml}`;
}
