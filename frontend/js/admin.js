const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginAlert = document.getElementById('loginAlert');

const tabSchedule = document.getElementById('tabSchedule');
const tabCandidates = document.getElementById('tabCandidates');
const tabRoster = document.getElementById('tabRoster');
const paneSchedule = document.getElementById('paneSchedule');
const paneCandidates = document.getElementById('paneCandidates');
const paneRoster = document.getElementById('paneRoster');

const adminLoginForm = document.getElementById('adminLoginForm');
const scheduleForm = document.getElementById('scheduleForm');
const addCandidateForm = document.getElementById('addCandidateForm');
const addVoterForm = document.getElementById('addVoterForm');

if (localStorage.getItem('adminToken')) showDashboard();

adminLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert(loginAlert);
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;

  try {
    const data = await apiRequest('/auth/admin/login', { method: 'POST', body: { username, password } });
    localStorage.setItem('adminToken', data.token);
    showDashboard();
  } catch (err) {
    showAlert(loginAlert, err.message);
  }
});

function showDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  loadSchedule();
  loadCandidates();
  loadRoster();
}

// ---------- Tabs ----------
function setActiveTab(which) {
  [tabSchedule, tabCandidates, tabRoster].forEach(t => t.classList.remove('active'));
  [paneSchedule, paneCandidates, paneRoster].forEach(p => p.style.display = 'none');
  if (which === 'schedule') { tabSchedule.classList.add('active'); paneSchedule.style.display = 'block'; }
  if (which === 'candidates') { tabCandidates.classList.add('active'); paneCandidates.style.display = 'block'; }
  if (which === 'roster') { tabRoster.classList.add('active'); paneRoster.style.display = 'block'; }
}
tabSchedule.addEventListener('click', () => setActiveTab('schedule'));
tabCandidates.addEventListener('click', () => setActiveTab('candidates'));
tabRoster.addEventListener('click', () => setActiveTab('roster'));

// ---------- Schedule ----------
function toLocalInputValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function loadSchedule() {
  try {
    const election = await apiRequest('/election');
    document.getElementById('electionTitle').value = election.title || '';
    document.getElementById('startTime').value = toLocalInputValue(election.start_time);
    document.getElementById('endTime').value = toLocalInputValue(election.end_time);
  } catch (err) {
    showAlert(document.getElementById('scheduleAlert'), err.message);
  }
}

scheduleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertEl = document.getElementById('scheduleAlert');
  hideAlert(alertEl);
  const title = document.getElementById('electionTitle').value.trim();
  const start_time = document.getElementById('startTime').value;
  const end_time = document.getElementById('endTime').value;

  try {
    await adminRequest('/election', { method: 'PUT', body: { title, start_time, end_time } });
    showAlert(alertEl, 'Schedule saved.', 'success');
  } catch (err) {
    showAlert(alertEl, err.message);
  }
});

// ---------- Candidates ----------
addCandidateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertEl = document.getElementById('addCandAlert');
  hideAlert(alertEl);

  const formData = new FormData();
  formData.append('name', document.getElementById('candName').value.trim());
  formData.append('department', document.getElementById('candDept').value.trim());
  formData.append('slogan', document.getElementById('candSlogan').value.trim());
  const fileInput = document.getElementById('candPhoto');
  if (fileInput.files[0]) formData.append('photo', fileInput.files[0]);

  try {
    await adminRequest('/candidates', { method: 'POST', body: formData, isFormData: true });
    addCandidateForm.reset();
    showAlert(alertEl, 'Candidate added.', 'success');
    loadCandidates();
  } catch (err) {
    showAlert(alertEl, err.message);
  }
});

async function loadCandidates() {
  const tbody = document.getElementById('candidateTableBody');
  try {
    const { candidates } = await apiRequest('/candidates/results');
    if (candidates.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="color:var(--muted);">No candidates yet — add one above.</td></tr>`;
      return;
    }
    tbody.innerHTML = candidates.map(c => `
      <tr>
        <td>${c.photo_path ? `<img class="table-thumb" src="${c.photo_path}" alt="">` : ''}${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.department || '—')}</td>
        <td class="mono">${c.vote_count}</td>
        <td class="row-actions"><button data-id="${c.id}">Remove</button></td>
      </tr>
    `).join('');
    tbody.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => removeCandidate(btn.dataset.id));
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4">Could not load candidates.</td></tr>`;
  }
}

async function removeCandidate(id) {
  if (!confirm('Remove this candidate? This cannot be undone.')) return;
  try {
    await adminRequest(`/candidates/${id}`, { method: 'DELETE' });
    loadCandidates();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- Voter roster ----------
addVoterForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertEl = document.getElementById('addVoterAlert');
  hideAlert(alertEl);
  const full_name = document.getElementById('voterName').value.trim();
  const company_id = document.getElementById('voterCompanyId').value.trim();
  const company_email = document.getElementById('voterEmail').value.trim();

  try {
    await adminRequest('/voters', { method: 'POST', body: { full_name, company_id, company_email } });
    addVoterForm.reset();
    showAlert(alertEl, 'Added to roster.', 'success');
    loadRoster();
  } catch (err) {
    showAlert(alertEl, err.message);
  }
});

async function loadRoster() {
  const tbody = document.getElementById('voterTableBody');
  try {
    const voters = await adminRequest('/voters');
    if (voters.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:var(--muted);">No voters on the roster yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = voters.map(v => `
      <tr>
        <td>${escapeHtml(v.full_name)}</td>
        <td class="mono">${escapeHtml(v.company_id)}</td>
        <td>${escapeHtml(v.company_email)}</td>
        <td><span class="pill ${v.has_voted ? 'yes' : 'no'}">${v.has_voted ? 'Voted' : 'Not yet'}</span></td>
        <td class="row-actions"><button data-id="${v.id}">Remove</button></td>
      </tr>
    `).join('');
    tbody.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => removeVoter(btn.dataset.id));
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">Could not load roster.</td></tr>`;
  }
}

async function removeVoter(id) {
  if (!confirm('Remove this person from the roster?')) return;
  try {
    await adminRequest(`/voters/${id}`, { method: 'DELETE' });
    loadRoster();
  } catch (err) {
    alert(err.message);
  }
}

// Keep tallies and turnout fresh while the dashboard is open
setInterval(() => {
  if (localStorage.getItem('adminToken')) {
    loadCandidates();
    loadRoster();
  }
}, 6000);
