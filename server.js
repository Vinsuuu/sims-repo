const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Initialize express FIRST
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve static files from project root (index.html, style.css, script.js)
app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, 'students.json');
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  console.log('Created students.json');
}

const readStudents = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Read students error:', err);
    return [];
  }
};

const writeStudents = (students) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2));
  } catch (err) {
    console.error('Write students error:', err);
  }
};

// GET /students
app.get('/students', (req, res) => {
  const students = readStudents();
  // optional filtering (q, gender, program) from query params
  const { q, gender, program } = req.query;
  let result = students;
  if (q) {
    const qLower = q.toLowerCase();
    result = result.filter(s =>
      (s.studentId && s.studentId.toLowerCase().includes(qLower)) ||
      (s.fullName && s.fullName.toLowerCase().includes(qLower)) ||
      (s.program && s.program.toLowerCase().includes(qLower))
    );
  }
  if (gender) {
    result = result.filter(s => (s.gender || '').toLowerCase() === gender.toLowerCase());
  }
  if (program) {
    result = result.filter(s => (s.program || '').toLowerCase().includes(program.toLowerCase()));
  }
  res.json(result);
});

// POST /students
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
    ...body
  };
  students.unshift(newStudent); // add to front
  writeStudents(students);
  res.status(201).json(newStudent);
});

// DELETE /students/:id
app.delete('/students/:id', (req, res) => {
  const id = req.params.id;
  const students = readStudents();
  const updated = students.filter(s => s.id !== id);
  if (updated.length === students.length) {
    return res.status(404).json({ error: 'Student not found' });
  }
  writeStudents(updated);
  res.json({ message: 'Student deleted' });
});

// fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
