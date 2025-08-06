import {studentslist,updateuse  } from "./model.js";

// Utility: get the last part of URL path as classId
function getClassIdFromUrl() {
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1] || null;
}


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
        
           conten.style.display='inline-block'// Hide progress bar
      } else {
          width++;
          progressBar.style.width = width + '%';
      }
  }, 10);
};
const classId = getClassIdFromUrl();

if (classId) {
  try {
    const result = await studentslist(classId);

    // If result is an array, students were returned successfully
    if (Array.isArray(result)) {
      if (result.length > 0) {
        displayStudents(result);
      } else {
        displayStudents([]); // no students
      }
    } else if (result && typeof result === 'object') {
      // If backend returned a failure response with message
      if (result.message.includes("Unauthorized")) {
        showSessionExpiredPopup();
      } else {
        displayStudents([]); // triggers "No students found"
      }
    } else {
      displayStudents([]); // unexpected response structure
    }
  } catch (err) {
    console.error("Error fetching students:", err);
    displayStudents([]); // network or unexpected error
  }
}


function displayStudents(students) {
  const contentDiv = document.getElementById('content');
  const header = contentDiv.querySelector('header');

  // Remove old container if exists
  const existingContainer = contentDiv.querySelector('.student-container');
  if (existingContainer) existingContainer.remove();

  if (!students.length) {
    const noDataMessage = document.createElement('p');
    noDataMessage.textContent = 'No students found for this class.';
    contentDiv.insertBefore(noDataMessage, header.nextSibling);
    return;
  }

  // Create main container
  const container = document.createElement('div');
  container.className = 'student-container';

  // Create student list grid
  const studentList = document.createElement('div');
  studentList.className = 'student-list';

  students.forEach(student => {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.innerHTML = `
      <div class="student-info">
        <img src="${student.profilepic}" alt="Profile Picture" class="profile-pic" />
        <div class="student-details">
          <p><strong>${student.Regno}</strong></p>
          <h5>${student.Fullname}</h5>
          <div class="student-row">
            <p><strong>Year:</strong> ${student.Year}</p>
            <p><strong>Sem:</strong> ${student.Sem}</p>
            <p><strong>Section:</strong> ${student.Section}</p>
            <p><strong>Course:</strong> ${student.Course}</p>
          </div>
        </div>
      </div>
        <i class="fa-solid fa-pen-to-square edit-icon" title="Edit"></i>
    `;
    studentList.appendChild(card);
  });

  container.appendChild(studentList);
  contentDiv.insertBefore(container, header.nextSibling);
  document.querySelectorAll('.edit-icon').forEach((icon, index) => {
  icon.addEventListener('click', () => {
    const student = students[index]; // access corresponding student data

    document.getElementById('editRegno').value = student.Regno;
    document.getElementById('editFullname').value = student.Fullname;
    document.getElementById('editYear').value = student.Year;
    document.getElementById('editSem').value = student.Sem;
    document.getElementById('editSection').value = student.Section;
    document.getElementById('editCourse').value = student.Course;

    document.getElementById('editModal').style.display = 'flex';
  });
});
}



document.getElementById('sub-edit').addEventListener('click', async () => {
  
   const aRegno= document.getElementById('editRegno').value.trim()
   const Fullname= document.getElementById('editFullname').value.trim()
   const Year= document.getElementById('editYear').value.trim()
  const  Sem=document.getElementById('editSem').value.trim()
  const  Section= document.getElementById('editSection').value.trim()
  const  Course=document.getElementById('editCourse').value.trim()
  

  
    const result = await updateuse(Fullname, Year,Section,Sem,aRegno,Course);

 if (result.success) {
  showSuccessPopup();
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('editErrorMsg').textContent = ''; // clear error
} else {
  if (result.message.includes("Unauthorized")) {
    showSessionExpiredPopup(); // custom popup handler
  } else {
    // Display the error in the form
    document.getElementById('editErrorMsg').textContent = result.message || "An unexpected error occurred.";
  }
}

});


function showSessionExpiredPopup() {
  const popup = document.getElementById('session-popup');
  popup.style.display = 'flex'; // or 'block' based on your CSS
}

document.getElementById('ton').addEventListener('click', () => {
  window.location.href = '/academics';
});


function showSuccessPopup(message = "Student updated successfully!") {
  const popup = document.getElementById('successPopup');
  popup.textContent = message;

  popup.style.display = 'none';
  popup.offsetHeight; // Force reflow to reset animation
  popup.style.display = 'block';
  popup.style.animation = 'fadeIn 0.5s forwards';

  setTimeout(() => {
    popup.style.display = 'none';
  }, 3000);
}


document.querySelector('.close').onclick = function () {
  document.getElementById('editModal').style.display = 'none';
};

