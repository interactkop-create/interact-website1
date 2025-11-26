// admin/admin.js
const API_UPLOAD = '/api/uploadImage';
const API_UPDATE = '/api/updateSite';

const PLACEHOLDER_IMAGE = '/interact.jpg'; // existing image in repo as placeholder

let siteData = {};

async function loadApiJson(path) {
  const r = await fetch(path + '?t=' + Date.now());
  if (!r.ok) return null;
  return r.json();
}

async function loadAllData() {
  const [site, board, events, gallery, members, collabs, service] = await Promise.all([
    loadApiJson('/api/site.json'),
    loadApiJson('/api/board.json'),
    loadApiJson('/api/events.json'),
    loadApiJson('/api/gallery.json'),
    loadApiJson('/api/members.json'),
    loadApiJson('/api/collaborations.json'),
    loadApiJson('/api/service-hours.json')
  ]);
  siteData = site || {};
  siteData.board = board || siteData.board || [];
  siteData.events = events || siteData.events || [];
  siteData.gallery = gallery || siteData.gallery || [];
  siteData.members = members || siteData.members || {};
  siteData.collaborations = collabs || siteData.collaborations || [];
  siteData.serviceHours = service || siteData.serviceHours || {};
  return siteData;
}

window.loadAdminSite = async function() {
  await loadAllData();
  populateUI();
};

function populateUI() {
  const c = siteData.contact || {};
  document.getElementById('contact_address').value = c.address || '';
  document.getElementById('contact_presidentName').value = c.presidentName || '';
  document.getElementById('contact_presidentEmail').value = c.presidentEmail || '';
  document.getElementById('contact_secretaryName').value = c.secretaryName || '';
  document.getElementById('contact_secretaryEmail').value = c.secretaryEmail || '';
  document.getElementById('contact_mainEmail').value = c.mainEmail || '';

  const s = siteData.stats || {};
  document.getElementById('stat_members').value = s.members || '';
  document.getElementById('stat_events').value = s.eventsThisYear || '';
  document.getElementById('stat_hours').value = s.serviceHours || '';
  document.getElementById('stat_collab').value = s.collaborations || '';

  renderMembersList();
  renderEventsList();
  renderGalleryList();
}

function renderMembersList() {
  const list = document.getElementById('membersList'); list.innerHTML = '';
  (siteData.board || []).forEach((m, idx) => {
    const el = document.createElement('div'); el.className='list-item';
    el.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
      <img src="${m.image || PLACEHOLDER_IMAGE}" class="upload-preview" onerror="this.style.display='none'">
      <div><div style="font-weight:600">${m.name}</div><div class="small">${m.role}</div></div>
      </div>
      <div style="display:flex;gap:8px"><button class="btn secondary" onclick="editMember(${idx})">Edit</button><button class="btn" onclick="removeMember(${idx})">Remove</button></div>`;
    list.appendChild(el);
  });
}

function renderEventsList() {
  const list = document.getElementById('eventsList'); list.innerHTML = '';
  (siteData.events || []).forEach((e, idx) => {
    const el = document.createElement('div'); el.className='list-item';
    el.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
      <img src="${e.img || PLACEHOLDER_IMAGE}" class="upload-preview" onerror="this.style.display='none'">
      <div><div style="font-weight:600">${e.title}</div><div class="small">${e.date} • ${e.location}</div></div>
      </div>
      <div style="display:flex;gap:8px"><button class="btn secondary" onclick="editEvent(${idx})">Edit</button><button class="btn" onclick="removeEvent(${idx})">Remove</button></div>`;
    list.appendChild(el);
  });
}

function renderGalleryList(){
  const list = document.getElementById('galleryList'); list.innerHTML = '';
  (siteData.gallery || []).forEach((g, idx) => {
    const el = document.createElement('div'); el.className='list-item';
    el.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
      <img src="${g}" class="upload-preview" onerror="this.style.display='none'">
      <div><div class="small">Gallery image</div><div style="font-size:0.9rem">${g}</div></div>
      </div>
      <div style="display:flex;gap:8px"><button class="btn secondary" onclick="removeGallery(${idx})">Remove</button></div>`;
    list.appendChild(el);
  });
}

document.getElementById('member_add').addEventListener('click', async () => {
  const name = document.getElementById('member_name').value.trim();
  const role = document.getElementById('member_role').value.trim();
  const email = document.getElementById('member_email').value.trim();
  const f = document.getElementById('member_image').files[0];
  if (!name || !role) return alert('Name & role required');
  let img = PLACEHOLDER_IMAGE;
  if (f) {
    const up = await uploadFile(f);
    if (!up.ok) return alert('Upload failed: ' + (up.message || ''));
    img = up.url;
  }
  siteData.board = siteData.board || [];
  siteData.board.push({ name, role, email, vision: '', image: img });
  document.getElementById('member_name').value='';document.getElementById('member_role').value='';document.getElementById('member_email').value='';document.getElementById('member_image').value='';
  renderMembersList();
});

document.getElementById('event_add').addEventListener('click', async () => {
  const title = document.getElementById('event_title').value.trim();
  const date = document.getElementById('event_date').value.trim();
  const loc = document.getElementById('event_location').value.trim();
  const desc = document.getElementById('event_desc').value.trim();
  const f = document.getElementById('event_image').files[0];
  if (!title) return alert('Title required');
  let img = PLACEHOLDER_IMAGE;
  if (f) { const up = await uploadFile(f); if (!up.ok) return alert('Upload failed'); img = up.url; }
  siteData.events = siteData.events || [];
  siteData.events.push({ id: 'evt-'+Date.now(), title, date, location: loc, desc, img });
  document.getElementById('event_title').value='';document.getElementById('event_date').value='';document.getElementById('event_location').value='';document.getElementById('event_desc').value='';document.getElementById('event_image').value='';
  renderEventsList();
});

document.getElementById('gallery_upload').addEventListener('click', async () => {
  const files = document.getElementById('gallery_image').files;
  if (!files || files.length===0) return alert('Select files');
  for (const f of files) {
    const up = await uploadFile(f);
    if (!up.ok) return alert('Upload failed for ' + f.name);
    siteData.gallery = siteData.gallery || [];
    siteData.gallery.push(up.url);
  }
  document.getElementById('gallery_image').value='';
  renderGalleryList();
});

function removeMember(i){ if(!confirm('Remove member?')) return; siteData.board.splice(i,1); renderMembersList(); }
function editMember(i){ const m=siteData.board[i]; const name=prompt('Name',m.name); if (name===null) return; m.name=name; m.role=prompt('Role',m.role)||m.role; m.email=prompt('Email',m.email||'')||m.email; m.vision=prompt('Vision',m.vision||'')||m.vision; renderMembersList(); }
function removeEvent(i){ if(!confirm('Remove event?')) return; siteData.events.splice(i,1); renderEventsList(); }
function editEvent(i){ const e=siteData.events[i]; const title=prompt('Title',e.title); if (title===null) return; e.title=title; e.date=prompt('Date',e.date)||e.date; e.location=prompt('Location',e.location)||e.location; e.desc=prompt('Desc',e.desc)||e.desc; renderEventsList(); }
function removeGallery(i){ if(!confirm('Remove image?')) return; siteData.gallery.splice(i,1); renderGalleryList(); }

async function uploadFile(file) {
  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = async () => {
      const b64 = reader.result.split(',')[1];
      const filename = `${Date.now()}-${file.name.replace(/\s+/g,'-')}`;
      const res = await fetch(API_UPLOAD, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ password: window.ADMIN_CREDENTIALS.password, filename, content: b64 })
      });
      const j = await res.json();
      resolve(res.ok ? { ok:true, url: j.url } : { ok:false, message: j.message||'upload failed' });
    };
    reader.onerror = () => resolve({ ok:false, message:'read error' });
    reader.readAsDataURL(file);
  });
}

document.getElementById('saveAll').addEventListener('click', async () => {
  siteData.contact = {
    address: document.getElementById('contact_address').value,
    presidentName: document.getElementById('contact_presidentName').value,
    presidentEmail: document.getElementById('contact_presidentEmail').value,
    secretaryName: document.getElementById('contact_secretaryName').value,
    secretaryEmail: document.getElementById('contact_secretaryEmail').value,
    mainEmail: document.getElementById('contact_mainEmail').value
  };
  siteData.stats = {
    members: Number(document.getElementById('stat_members').value) || 0,
    eventsThisYear: Number(document.getElementById('stat_events').value) || 0,
    serviceHours: Number(document.getElementById('stat_hours').value) || 0,
    collaborations: Number(document.getElementById('stat_collab').value) || 0
  };

  const payload = { password: window.ADMIN_CREDENTIALS.password, content: {
    contact: siteData.contact,
    stats: siteData.stats,
    board: siteData.board,
    events: siteData.events,
    gallery: siteData.gallery
  }};

  document.getElementById('actionStatus').textContent = 'Publishing...';
  const r = await fetch(API_UPDATE, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  const j = await r.json();
  if (r.ok) {
    document.getElementById('actionStatus').textContent = 'Published. Commit: ' + (j.commit || '');
    alert('Published successfully.');
  } else {
    document.getElementById('actionStatus').textContent = 'Publish failed: ' + (j.message || r.status);
    alert('Publish failed: ' + (j.message || r.status));
  }
});
