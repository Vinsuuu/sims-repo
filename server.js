const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware (order matters)
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(__dirname));

// ---------- Data handling ----------
const DATA_FILE = path.join(__dirname, 'students.json');

// Create file if missing
if (!fs.existsSync(DATA_FILE)) {
fs.writeFileSync(DATA_FILE, '[]', 'utf8');
console.log('Created students.json');
}

function readStudents() {
try {
const data = fs.readFileSync(DATA_FILE, 'utf8');
return JSON.parse(data || '[]');
} catch (err) {
console.error('Read students error:', err);
return [];
}
}

function writeStudents(students) {
try {
fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2));
} catch (err) {
console.error('Write students error:', err);
}
}

// ---------- Routes ----------

// GET /students — list students (with filters)
app.get('/students', (req, res) => {
const students = readStudents();
const { q, gender, program } = req.query;
let result = students;

if (q) {
const qLower = q.toLowerCase();
result = result.filter(
(s) =>
(s.studentId && s.studentId.toLowerCase().includes(qLower)) ||
(s.fullName && s.fullName.toLowerCase().includes(qLower)) ||
(s.program && s.program.toLowerCase().includes(qLower))
);
}

if (gender) {
result = result.filter(
(s) => (s.gender || '').toLowerCase() === gender.toLowerCase()
);
}

if (program) {
result = result.filter((s) =>
(s.program || '').toLowerCase().includes(program.toLowerCase())
);
}

res.json(result);
});

// POST /students — add new student
app.post('/students', (req, res) => {
const body = req.body || {};
const { studentId, fullName, gmail } = body;
if (!studentId || !fullName || !gmail) {
return res.status(400).json({ error: 'Missing required fields' });
}

const students = readStudents();
const newStudent = {
id: Date.now().toString(),
createdAt: new Date().toISOString(),
...body,
};

students.unshift(newStudent);
writeStudents(students);
res.status(201).json(newStudent);
});

// DELETE /students/:id — delete student
app.delete('/students/:id', (req, res) => {
const id = req.params.id;
const students = readStudents();
const updated = students.filter((s) => s.id !== id);

if (updated.length === students.length) {
return res.status(404).json({ error: 'Student not found' });
}

writeStudents(updated);
res.json({ message: 'Student deleted' });
});

// ---------- Serve frontend ----------
app.get('*', (req, res) => {
res.sendFile(path.join(__dirname, 'index.html'));
});

// ---------- Start server ----------
app.listen(PORT, '0.0.0.0', () => {
console.log(Server running on port ${PORT});
});
