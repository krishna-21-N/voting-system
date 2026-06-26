const resultsContainer = document.getElementById('resultsContainer');
const summaryRow = document.getElementById('summaryRow');
const statusBanner = document.getElementById('statusBanner');

let currentElection = null;
let clockOffsetMs = 0;

async function refreshElection() {
  try {
    currentElection = await apiRequest('/election');
    clockOffsetMs = new Date(currentElection.server_time) - new Date();
    tickCountdown();
  } catch (err) {
    statusBanner.textContent = '';
  }
}

function tickCountdown() {
  if (!currentElection) return;
  const liveElection = { ...currentElection, server_time: new Date(Date.now() + clockOffsetMs).toISOString() };
  renderStatusBanner(statusBanner, liveElection);
}

async function loadResults() {
  try {
    const { candidates, total_votes, total_voters } = await apiRequest('/candidates/results');

    if (candidates.length === 0) {
      resultsContainer.innerHTML = `
        <div class="empty">
          <div class="icon">📊</div>
          <p>No candidates yet — results will appear once the ballot is set up.</p>
        </div>`;
      summaryRow.textContent = '';
      return;
    }

    const maxVotes = Math.max(...candidates.map(c => c.vote_count), 1);
    const leaderVotes = candidates[0].vote_count;

    resultsContainer.innerHTML = candidates.map(c => {
      const pct = (c.vote_count / maxVotes) * 100;
      const isLeader = c.vote_count === leaderVotes && leaderVotes > 0;
      return `
        <div class="result-row ${isLeader ? 'leader' : ''}">
          <div class="meta">
            ${c.photo_path ? `<img class="thumb" src="${c.photo_path}" alt="">` : ''}
            <span class="who">${escapeHtml(c.name)}${c.department ? ` <span style="color:var(--muted); font-weight:400;">(${escapeHtml(c.department)})</span>` : ''}</span>
            <span class="count">${c.vote_count}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('');

    const turnoutPct = total_voters > 0 ? Math.round((total_votes / total_voters) * 100) : 0;
    summaryRow.innerHTML = `
      <span>${total_votes} vote${total_votes === 1 ? '' : 's'} cast</span>
      <span>${turnoutPct}% turnout (${total_votes} / ${total_voters} eligible)</span>`;
  } catch (err) {
    resultsContainer.innerHTML = `<div class="empty"><p>Could not load results. Is the server running?</p></div>`;
  }
}

refreshElection();
loadResults();
setInterval(tickCountdown, 1000);
setInterval(refreshElection, 15000);
setInterval(loadResults, 4000);
