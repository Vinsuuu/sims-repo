// Frontend script for SIMS
const API_BASE = window.location.origin;

// ---------- DOM Elements ----------
const studentForm = document.getElementById("studentForm");
const studentsTbody = document.getElementById("studentsTbody");
const studentCount = document.getElementById("studentCount");
const searchQuery = document.getElementById("searchQuery");
const filterGender = document.getElementById("filterGender");
const filterProgram = document.getElementById("filterProgram");
const clearFilter = document.getElementById("clearFilter");
const searchBtn = document.getElementById("searchBtn");

// ---------- API helpers ----------
async function fetchStudents(params = {}) {
  const url = new URL(API_BASE + "/students");
  Object.keys(params).forEach((k) => {
    if (params[k]) url.searchParams.set(k, params[k]);
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
}

async function addStudent(payload) {
  try {
    const res = await fetch(API_BASE + "/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Server error");
    }

    const data = await res.json().catch(() => ({}));
    return data;
  } catch (err) {
    console.error("Add Student Error:", err);
    throw new Error("Network or server error");
  }
}

async function deleteStudent(id) {
  try {
    const res = await fetch(API_BASE + "/students/" + id, { method: "DELETE" });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Delete failed");
    }
    const data = await res.json().catch(() => ({}));
    return data;
  } catch (err) {
    console.error("Delete Student Error:", err);
    throw new Error("Network or server error");
  }
}

// ---------- Rendering ----------
function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m];
  });
}

function renderStudents(list) {
  studentsTbody.innerHTML = "";
  const count = list.length;
  studentCount.textContent = count + " Record" + (count !== 1 ? "s" : "");
  if (!count) {
    studentsTbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted py-4">No student records found.</td></tr>';
    return;
  }

  list.forEach(function (s) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td><button class="btn btn-sm btn-danger btn-delete" data-id="' +
      s.id +
      '">🗑 Delete</button></td>' +
      "<td>" +
      escapeHtml(s.studentId) +
      "</td>" +
      "<td>" +
      escapeHtml(s.fullName) +
      "</td>" +
      "<td>" +
      escapeHtml(s.gender || "N/A") +
      "</td>" +
      "<td>" +
      escapeHtml(s.program || "N/A") +
      "</td>" +
      "<td>" +
      escapeHtml(s.yearLevel || "N/A") +
      "</td>" +
      "<td>" +
      escapeHtml(s.university || "N/A") +
      "</td>";
    studentsTbody.appendChild(tr);
  });

  const delBtns = document.querySelectorAll(".btn-delete");
  delBtns.forEach(function (btn) {
    btn.addEventListener("click", async function (e) {
      const id = e.currentTarget.getAttribute("data-id");
      if (!confirm("Confirm deletion?")) return;
      try {
        await deleteStudent(id);
        await loadAndRender();
        alert("Deleted");
      } catch (err) {
        alert(err.message || "Delete failed");
      }
    });
  });
}

// ---------- Load ----------
async function loadAndRender() {
  const q = searchQuery ? searchQuery.value.trim() : "";
  const gender = filterGender ? filterGender.value : "";
  const program = filterProgram ? filterProgram.value.trim() : "";
  try {
    const students = await fetchStudents({ q: q, gender: gender, program: program });
    renderStudents(students);
  } catch (err) {
    console.error(err);
    studentsTbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted py-4">No student records found.</td></tr>';
    studentCount.textContent = "0 Records (API Error)";
  }
}

// ---------- Form ----------
if (studentForm) {
  studentForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const payload = {
      studentId: document.getElementById("studentId").value.trim(),
      fullName: document.getElementById("fullName").value.trim(),
      gender: document.getElementById("gender").value,
      gmail: document.getElementById("gmail").value.trim(),
      program: document.getElementById("program").value.trim(),
      yearLevel: Number(document.getElementById("yearLevel").value) || null,
      university: document.getElementById("university").value.trim(),
    };
    try {
      await addStudent(payload);
      studentForm.reset();
      await loadAndRender();
      alert("Student added successfully");
    } catch (err) {
      alert(err.message || "Add failed");
    }
  });
}

if (searchBtn) {
  searchBtn.addEventListener("click", function (e) {
    e.preventDefault();
    loadAndRender();
  });
}

if (clearFilter) {
  clearFilter.addEventListener("click", function () {
    if (searchQuery) searchQuery.value = "";
    if (filterGender) filterGender.value = "";
    if (filterProgram) filterProgram.value = "";
    loadAndRender();
  });
}

// ---------- Initial load ----------
loadAndRender();
