/* import {postclasses,postattendancesheet,putsubjects } from "./model.js";

document.getElementById("classsub").addEventListener('click', async function() {
    const collegename = localStorage.getItem('collegename');

    // Use correct IDs from your HTML
    const popup = document.getElementById('popupForm');
    const modal =document.getElementById("popupForm")
    const classname = document.getElementById("className").value.trim();
    const administration = document.getElementById("role").value;
    const course = document.getElementById("course").value;
    const year = document.getElementById("year").value;
    const section = document.getElementById("section").value;
    const sem = document.getElementById("semester").value;
   console.log(administration)
    let hasError = false;

    // Helper function to set error text inside the <small class="error"> element
    function setError(id, message) {
        const container = document.getElementById(id).closest('.form-group');
        const errorElem = container.querySelector('small.error');
        if (errorElem) {
            errorElem.innerText = message;
        }
    }

    // Validate each field
    if (!classname) {
        setError("className", "Class name is required");
        hasError = true;
    } else {
        setError("className", "");
    }

    if (!administration) {
        setError("role", "Please select a role");
        hasError = true;
    } else {
        setError("role", "");
    }


if (!course || course === "Select Course") {
    setError("course", "Please select a course");
    hasError = true;
} else {
    setError("course", "");
}


    if (!year) {
        setError("year", "Please select a year");
        hasError = true;
    } else {
        setError("year", "");
    }

    if (!section) {
        setError("section", "Please select a section");
        hasError = true;
    } else {
        setError("section", "");
    }

    if (!sem) {
        setError("semester", "Please select a semester");
        hasError = true;
    } else {
        setError("semester", "");
    }

    if (hasError) return; // Stop if validation fails

    // Call your async function to post the class data
    var result = await postclasses(course, year, section, sem, classname, administration, collegename);

  if (result.success) {
  
    modal.style.display = 'none';
  showPopup(result.message);


  // Clear semester error if any
  document.querySelector('#semester + .error').textContent = '';
} else {
  

  // Show the error message under semester select
const semesterError = document.querySelector('#semester + .error');
  semesterError.textContent = result.message;
}

});

document.getElementById("asssub").addEventListener('click', async function() {


    // Use correct IDs from your HTML
     const modal2 =document.getElementById("popupFormad")
    const classname = document.getElementById("classNamead").value.trim();
    const subject = document.getElementById("subjectNamead").value;
    const course = document.getElementById("coursead").value;
    const year = document.getElementById("yearad").value;
    const section = document.getElementById("sectionad").value;
    const sem = document.getElementById("semesterad").value;

    let hasError = false;

    // Helper function to set error text inside the <small class="error"> element
    function setError(id, message) {
        const container = document.getElementById(id).closest('.form-group');
        const errorElem = container.querySelector('small.error');
        if (errorElem) {
            errorElem.innerText = message;
        }
    }

    // Validate each field
    if (!classname) {
        setError("classNamead", "Class name is required");
        hasError = true;
    } else {
        setError("classNamead", "");
    }

    if (!subject) {
        setError("subjectNamead", "Subject name is required");
        hasError = true;
    } else {
        setError("subjectNamead", "");
    }

    if (!course || course === "Select Course") {
    setError("coursead", "Please select a course");
    hasError = true;
} else {
    setError("coursead", "");
}

    if (!year) {
        setError("yearad", "Please select a year");
        hasError = true;
    } else {
        setError("yearad", "");
    }

    if (!section) {
        setError("sectionad", "Please select a section");
        hasError = true;
    } else {
        setError("sectionad", "");
    }

    if (!sem) {
        setError("semesterad", "Please select a semester");
        hasError = true;
    } else {
        setError("semesterad", "");
    }

    if (hasError) return; // Stop if validation fails

    // Call your async function to post the class data
    var result = await postattendancesheet(subject,course,year,section,sem,classname)

   if (result.success) {
  const popup = document.getElementById('popupForm');
    modal2.style.display = 'none';
  showPopup(result.message);


  // Clear semester error if any
  document.querySelector('#semesterad + .error').textContent = '';
} else {
  
const semesterError = document.querySelector('#semesterad + .error');
  semesterError.textContent = result.message;
}
});

document.getElementById("asub").addEventListener('click', async function () {
    const subjectname = document.getElementById("subjectNameass").value.trim();
    const duedate = document.getElementById("dueDateass").value;
    const pdfInput = document.getElementById("pdfFile");
    const pdf = pdfInput.files[0]; // ✅ correct way to get file

    let hasError = false;

    function setError(id, message) {
        const container = document.getElementById(id).closest('.form-group');
        const errorElem = container.querySelector('small.error');
        if (errorElem) {
            errorElem.innerText = message;
        }
    }

    if (!subjectname) {
        setError("subjectNameass", "Subject name is required");
        hasError = true;
    } else {
        setError("subjectNameass", "");
    }

    if (!duedate) {
        setError("dueDateass", "Due-date is required");
        hasError = true;
    } else {
        setError("dueDateass", "");
    }

    if (!pdf) {
        setError("pdfFile", "File is required");
        hasError = true;
    } else if (pdf.type !== "application/pdf") {
        setError("pdfFile", "Only PDF files are allowed");
        hasError = true;
    } else {
        setError("pdfFile", "");
    }

    if (hasError) return;

    const result = await postattendancesheet(subjectname, duedate, pdf);
  if (result.success) {
  const popup = document.getElementById('popupForm');
    modal2.style.display = 'none';
  showPopup(result.message);
}
   
});


document.getElementById('subjectForm').addEventListener('submit', async (event) => { 
  event.preventDefault();

  const form = event.target;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const classSelect = document.getElementById('classSelect');
  const id = classSelect.value;  // classId here
  const className = classSelect.options[classSelect.selectedIndex].text; // if you want class name

  const groups = form.querySelectorAll('.subject-group');

  const subjects = Array.from(groups).map(group => {
    const code = group.querySelector('input[name="code"]').value.trim();
    const name = group.querySelector('input[name="name"]').value.trim();

    const lecturerSelect = group.querySelector('select.lecturername');
    const lecturerId = lecturerSelect.value;
    const lecturer = lecturerSelect.options[lecturerSelect.selectedIndex].text;

    return { code, name, lecturerId, lecturer };
  });

  // Optional validation
  const allLecturersSelected = subjects.every(subj => subj.lecturerId);
  if (!allLecturersSelected) {
    alert('Please select a lecturer for all subjects.');
    return;
  }

 var result=await putsubjects(id,subjects)
 if (result.success) {
  const popup = document.getElementById('popupForm');
    modal2.style.display = 'none';
  showPopup(result.message);
}
});


function showPopup(message) {
  const popup = document.getElementById("successPopup");
  const msg = document.getElementById("popupMessage");

  msg.textContent = message;
  popup.style.display = "block";

  // Hide after 3 seconds
  setTimeout(() => {
    popup.style.display = "none";
  }, 3000);
}




document.getElementById("closeFormBtn").addEventListener("click", function () {
    const popupContainer = document.getElementById("popupForm");
    if (popupContainer) {
        popupContainer.style.display = "none";
    }
});

document.getElementById("closeFormBtnad").addEventListener("click", function () {
    const popupContainer = document.getElementById("popupFormad");
    if (popupContainer) {
        popupContainer.style.display = "none";
    }
});

document.getElementById("closeSubjectModal").addEventListener("click", function () {
    const popupContainer = document.getElementById("subjectModal");
    if (popupContainer) {
        popupContainer.style.display = "none";
    }
});

document.getElementById("closePopupBtn").addEventListener("click", function () {
    const popupContainer = document.getElementById("popupOverlay");
    if (popupContainer) {
        popupContainer.style.display = "none";
    }
});

document.getElementById("closeFormBtnass").addEventListener("click", function () {
    const popupContainer = document.getElementById("popupFormass");
    if (popupContainer) {
        popupContainer.style.display = "none";
    }
});

*/
