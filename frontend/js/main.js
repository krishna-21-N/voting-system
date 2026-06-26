const alertBox = document.getElementById('alertBox');
const loginForm = document.getElementById('loginForm');

// If already signed in, skip straight ahead
if (localStorage.getItem('voteToken')) {
  window.location.href = 'vote.html';
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert(alertBox);
  const company_id = document.getElementById('companyId').value.trim();
  const company_email = document.getElementById('companyEmail').value.trim();

  try {
    const data = await apiRequest('/auth/login', { method: 'POST', body: { company_id, company_email } });
    localStorage.setItem('voteToken', data.token);
    window.location.href = data.has_voted ? 'results.html' : 'vote.html';
  } catch (err) {
    showAlert(alertBox, err.message);
  }
});
