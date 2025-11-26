// admin/auth.js
// Simple unlock: validate server-side via /api/updateSite (action: 'ping')
// Credentials (username/password) are checked server-side (ADMIN_USER and ADMIN_PASSWORD env vars)

document.getElementById('authBtn').addEventListener('click', async () => {
  const user = document.getElementById('adminUser').value.trim();
  const pw = document.getElementById('adminPassword').value.trim();
  if (!user || !pw) return alert('Enter username & password');

  const res = await fetch('/api/updateSite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ping', username: user, password: pw })
  });

  if (res.ok) {
    window.ADMIN_CREDENTIALS = { username: user, password: pw };
    document.getElementById('authCard').style.display = 'none';
    document.getElementById('editorUI').style.display = 'block';
    document.getElementById('authStatus').textContent = 'Unlocked';
    await window.loadAdminSite();
  } else {
    const txt = await res.text();
    alert('Invalid credentials or server error: ' + txt);
  }
});
