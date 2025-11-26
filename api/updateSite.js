// api/updateSite.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { password, content, action, force } = req.body || {};
  if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_TOKEN || !process.env.REPO_OWNER || !process.env.REPO_NAME) {
    return res.status(500).json({ message: 'Server misconfigured (missing env vars).' });
  }
  if (!password || password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ message: 'Unauthorized' });
  if (action === 'ping') return res.json({ ok: true });
  if (!content) return res.status(400).json({ message: 'content required' });
  try {
    const path = 'api/site.json';
    const url = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/contents/${encodeURIComponent(path)}`;
    const getFile = await fetch(url, { headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } });
    let sha = null;
    if (getFile.ok) {
      const fileJson = await getFile.json();
      sha = fileJson.sha;
    }
    const payload = { message: force ? 'Admin: force update site.json' : 'Admin: update site.json', content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'), branch: process.env.REPO_BRANCH || 'main' };
    if (sha) payload.sha = sha;
    const put = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const putJson = await put.json();
    if (!put.ok) return res.status(500).json({ message: 'GitHub error', details: putJson });
    return res.json({ ok: true, commit: putJson.commit && putJson.commit.sha ? putJson.commit.sha : null });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
