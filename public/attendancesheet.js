// Sample student data
  import {attstudentslist ,postattendancesheet } from "./model.js";

let students = [];
const studentsListEl = document.getElementById('studentsList');
const submitBtn = document.getElementById('submitAttendance');

// Utility: get the last part of URL path as classId
function getUrlValues() {
  const pathParts = window.location.pathname.split('/');
  const subject=pathParts[3]
  const id = pathParts[4];
  const course = pathParts[5];
  const sem = pathParts[6];
  const section = pathParts[7];
  const year = pathParts[8];
  return {subject, id, course, sem, section, year };
}

const values = getUrlValues();
const collegename = localStorage.getItem('collegename')?.trim();

if (values) {
  (async () => {
    const result = await attstudentslist(
      collegename,
      values.course,
      values.section,
      values.year,
      values.sem
    );

    if (!Array.isArray(result)) {
      if (result.message?.includes("Unauthorized")) {
        showSessionExpiredPopup();
        return;
      }
      studentsListEl.innerHTML = `
        <div style="width: 100%; text-align: center; padding: 50px; font-size: 1.2rem; color: red;">
          ${result.message || 'No students found.'}
        </div>`;
      submitBtn.style.display = 'none';
      return;
    }

    renderStudents(result);
    submitBtn.style.display = 'block';
  })();
}

// ✅ Render each student card
function createStudentCard(student, index) {
  const card = document.createElement('div');
  card.className = 'student-card';

  const img = document.createElement('img');
  img.className = 'student-img';
  img.src = student.profilepic;
  img.alt = `${student.name} photo`;
  card.appendChild(img);

  const details = document.createElement('div');
  details.className = 'student-details';

  const topRow = document.createElement('div');
  topRow.className = 'top-row';
  topRow.innerHTML = `
    <div class="name">${student.Fullname}</div>
    <div class="regno">Reg No: ${student.Regno}</div>
  `;

  const bottomRow = document.createElement('div');
  bottomRow.className = 'bottom-row';
  bottomRow.innerHTML = `
    <div>Year: ${student.Year}</div>
    <div>Sem: ${student.Sem}</div>
    <div>Course: ${student.Course}</div>
    <div>Section: ${student.Section}</div>
  `;

  details.appendChild(topRow);
  details.appendChild(bottomRow);
  card.appendChild(details);

  const attendanceToggle = document.createElement('div');
  attendanceToggle.className = 'attendance-toggle';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = `attendance-${index}`;
  checkbox.checked = false;
  attendanceToggle.appendChild(checkbox);

  const label = document.createElement('label');
  label.htmlFor = `attendance-${index}`;
  label.textContent = 'Present';
  attendanceToggle.appendChild(label);

  card.appendChild(attendanceToggle);

  // ✅ Toggle checkbox on card click unless checkbox or label is clicked
  card.addEventListener('click', (e) => {
    if (e.target === checkbox || e.target === label) return;
    checkbox.checked = !checkbox.checked;
  });

  return card;
}

// ✅ Update global `students` when rendering
function renderStudents(studentList) {
  students = studentList; // ✅ Save to global array
  studentsListEl.innerHTML = '';
  studentList.forEach((student, index) => {
    const studentCard = createStudentCard(student, index);
    studentsListEl.appendChild(studentCard);
  });
}

// ✅ Submit attendance handler
submitBtn.addEventListener('click', async () => {

  const period = 1;
  const date = new Date().toISOString().split('T')[0];

  const studentCards = studentsListEl.querySelectorAll('.student-card');
  const attendance = [];
  let presentCount = 0;

  studentCards.forEach((card, index) => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    const student = students[index]; // ✅ now defined

    const isPresent = checkbox.checked ? 1 : 0;
    if (isPresent) presentCount++;

    attendance.push({
      student_id: student.Id,
      is_present: isPresent
    });
  });

  const payload = await postattendancesheet(
    values.subject,
    date,
    period,
    attendance,
    values.id,
    presentCount
  );

  console.log(values.subject);

  if (payload.success) {
    // ✅ Show success popup
    document.getElementById('successPopup').style.display = 'flex';

    // ✅ Reset all checkboxes
    studentCards.forEach((card) => {
      const checkbox = card.querySelector('input[type="checkbox"]');
      checkbox.checked = false;
    });
  } else {
    if (payload.message?.includes("Unauthorized")) {
      showSessionExpiredPopup();
    } else {
      showError(payload.message);
    }
  }
});

// ✅ Show error message
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// ✅ Show session expired popup
function showSessionExpiredPopup() {
  const popup = document.getElementById('session-popup');
  popup.style.display = 'flex';
}
document.getElementById('ton').addEventListener('click', () => {
  window.location.href = '/academics';
});


// ✅ Close popup handler
document.getElementById('closePopup').addEventListener('click', () => {
  document.getElementById('successPopup').style.display = 'none';
});



 window.onload = function() {
  var progressBar = document.querySelector('#loading .loader');
  
  var conten = document.getElementById('content');

  // Increment progress bar width every 10 milliseconds
  var online = navigator.onLine;
  var width = 0;
  var interval = setInterval(function() {
      if (width >= 100 && online) {
          clearInterval(interval);
          document.getElementById('loading').style.display = 'none';
        
           conten.style.display='block'// Hide progress bar
      } else {
          width++;
          progressBar.style.width = width + '%';
      }
  }, 10);
};
