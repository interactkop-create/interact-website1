// api/uploadImage.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  // This function expects { password, filename, content } where content is base64 image
  const { password, filename, content } = req.body || {};
  if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_TOKEN || !process.env.REPO_OWNER || !process.env.REPO_NAME) {
    return res.status(500).json({ message: 'Server misconfigured (missing env vars).' });
  }
  if (!password || password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ message: 'Unauthorized' });
  if (!filename || !content) return res.status(400).json({ message: 'filename and content required' });
  try {
    const path = `api/members/${filename}`; // we will store images under api/members/
    const url = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/contents/${encodeURIComponent(path)}`;
    const payload = { message: `Admin: upload ${filename}`, content: content, branch: process.env.REPO_BRANCH || 'main' };
    const githubRes = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await githubRes.json();
    if (!githubRes.ok) return res.status(500).json({ message: 'GitHub error', details: json });
    const publicUrl = `/api/members/${filename}`;
    return res.json({ ok: true, url: publicUrl, commit: json.commit && json.commit.sha ? json.commit.sha : null });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
