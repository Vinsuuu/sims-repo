// Frontend script for SIMS
const API_BASE = window.location.hostname.includes('onrender.com') ? 'https://simsmidterm.onrender.com' : 'http://localhost:3000';

// Elements
const studentForm = document.getElementById('studentForm');
const studentsTbody = document.getElementById('studentsTbody');
const studentCount = document.getElementById('studentCount');
const searchQuery = document.getElementById('searchQuery');
const filterGender = document.getElementById('filterGender');
const filterProgram = document.getElementById('filterProgram');
const clearFilter = document.getElementById('clearFilter');
const searchBtn = document.getElementById('searchBtn');

async function fetchStudents(params = {}) {
  const url = new URL(API_BASE + '/students');
  Object.keys(params).forEach(k => { if (params[k]) url.searchParams.set(k, params[k]); });
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

async function addStudent(payload) {
  const res = await fetch(API_BASE + '/students', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Add failed');
  return data;
}

async function deleteStudent(id) {
  const res = await fetch(API_BASE + '/students/' + id, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Delete failed');
  return data;
}

function renderStudents(list) {
  studentsTbody.innerHTML = '';
  const count = list.length;
  studentCount.textContent = `${count} Record${count !== 1 ? 's' : ''}`;
  if (!count) {
    studentsTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No student records found.</td></tr>';
    return;
  }
  list.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><button class="btn btn-sm btn-danger btn-delete" data-id="${s.id}">🗑 Delete</button></td>
      <td>${escapeHtml(s.studentId)}</td>
      <td>${escapeHtml(s.fullName)}</td>
      <td>${escapeHtml(s.gender || 'N/A')}</td>
      <td>${escapeHtml(s.program || 'N/A')}</td>
      <td>${escapeHtml(s.yearLevel || 'N/A')}</td>
      <td>${escapeHtml(s.university || 'N/A')}</td>
    `;
    studentsTbody.appendChild(tr);
  });
  document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.id;
    if (!confirm('Confirm deletion?')) return;
    try { await deleteStudent(id); loadAndRender(); alert('Deleted'); } catch (err) { alert(err.message || 'Delete failed'); }
  }));
}

function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

async function loadAndRender() {
  const q = searchQuery?.value?.trim();
  const gender = filterGender?.value;
  const program = filterProgram?.value?.trim();
  try {
    const students = await fetchStudents({ q, gender, program });
    renderStudents(students);
  } catch (err) {
    console.error(err);
    studentsTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No student records found.</td></tr>';
    studentCount.textContent = '0 Records (API Error)';
  }
}

studentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    studentId: document.getElementById('studentId').value.trim(),
    fullName: document.getElementById('fullName').value.trim(),
    gender: document.getElementById('gender').value,
    gmail: document.getElementById('gmail').value.trim(),
    program: document.getElementById('program').value.trim(),
    yearLevel: Number(document.getElementById('yearLevel').value) || null,
    university: document.getElementById('university').value.trim()
  };
  try {
    await addStudent(payload);
    studentForm.reset();
    loadAndRender();
    alert('Student added');
  } catch (err) {
    alert(err.message || 'Add failed');
  }
});

searchBtn?.addEventListener('click', (e) => { e.preventDefault(); loadAndRender(); });
clearFilter?.addEventListener('click', () => { searchQuery.value=''; filterGender.value=''; filterProgram.value=''; loadAndRender(); });

// initial load
loadAndRender();
