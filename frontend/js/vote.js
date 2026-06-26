const alertBox = document.getElementById('alertBox');
const ballotContainer = document.getElementById('ballotContainer');
const statusBanner = document.getElementById('statusBanner');
const stampOverlay = document.getElementById('stampOverlay');
const logoutLink = document.getElementById('logoutLink');

const token = localStorage.getItem('voteToken');
if (!token) window.location.href = 'index.html';

let currentElection = null;
let clockOffsetMs = 0; // server_time minus our local time, so the countdown stays accurate

logoutLink.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('voteToken');
  window.location.href = 'index.html';
});

async function init() {
  try {
    const status = await apiRequest('/vote/status', { auth: true });
    if (status.has_voted) {
      window.location.href = 'results.html';
      return;
    }
  } catch (err) {
    localStorage.removeItem('voteToken');
    window.location.href = 'index.html';
    return;
  }

  await refreshElection();
  await loadCandidates();
  setInterval(tickCountdown, 1000);
  setInterval(refreshElection, 15000); // re-sync status periodically in case admin changes it
}

async function refreshElection() {
  try {
    currentElection = await apiRequest('/election');
    clockOffsetMs = new Date(currentElection.server_time) - new Date();
    tickCountdown();
    updateBallotInteractivity();
  } catch (err) {
    showAlert(alertBox, 'Could not load election status.');
  }
}

function tickCountdown() {
  if (!currentElection) return;
  const liveElection = { ...currentElection, server_time: new Date(Date.now() + clockOffsetMs).toISOString() };
  renderStatusBanner(statusBanner, liveElection);
}

function updateBallotInteractivity() {
  const isOpen = currentElection.status === 'open';
  document.querySelectorAll('.cast').forEach(btn => { btn.disabled = !isOpen; });
}

async function loadCandidates() {
  try {
    const candidates = await apiRequest('/candidates');
    if (candidates.length === 0) {
      ballotContainer.innerHTML = `
        <div class="empty">
          <div class="icon">🗳️</div>
          <p>No candidates have been added yet. Check back once the admin sets up the ballot.</p>
        </div>`;
      return;
    }
    ballotContainer.innerHTML = candidates.map(c => `
      <div class="stub" data-id="${c.id}">
        ${c.photo_path
          ? `<img class="photo" src="${c.photo_path}" alt="${escapeHtml(c.name)}">`
          : `<div class="photo-fallback">🗳️</div>`}
        <div class="info">
          <div class="name">${escapeHtml(c.name)}</div>
          ${c.department ? `<div class="department">${escapeHtml(c.department)}</div>` : ''}
          ${c.slogan ? `<div class="slogan">${escapeHtml(c.slogan)}</div>` : ''}
        </div>
        <button class="cast" data-id="${c.id}">Cast vote</button>
      </div>
    `).join('');

    document.querySelectorAll('.cast').forEach(btn => {
      btn.addEventListener('click', () => castVote(btn.dataset.id));
    });
    updateBallotInteractivity();
  } catch (err) {
    showAlert(alertBox, err.message);
  }
}

async function castVote(candidateId) {
  document.querySelectorAll('.cast').forEach(b => b.disabled = true);
  hideAlert(alertBox);
  try {
    await apiRequest('/vote', { method: 'POST', auth: true, body: { candidate_id: candidateId } });
    stampOverlay.classList.add('show');
    setTimeout(() => { window.location.href = 'results.html'; }, 1600);
  } catch (err) {
    showAlert(alertBox, err.message);
    updateBallotInteractivity();
    if (err.message.toLowerCase().includes('already voted')) {
      setTimeout(() => { window.location.href = 'results.html'; }, 1200);
    }
  }
}

init();
