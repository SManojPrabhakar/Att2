 import { getclasses,puttimetable,getattendancesheets,getsubjectslist, gettimetablelist,postattend
  ,collegetype,classeslist,classestimelist,lecturerlist,postclasses,classesassignments,putsubjects,lectsubjects, 
  putassignments} from "./model.js";

async function collegetypes() {
    var collegecode = localStorage.getItem('code');

    // Simulate fetching college type
    const result = await collegetype(collegecode);
     // Your backend call
    const type = result.collegetype.College_Type;

    const courseList = Courses(type);
    populateCourses(courseList);

}




// Dynamically populate dropdown
function populateCourses(courseList) {
    const select = document.getElementById("course");

    // Clear existing options
    select.innerHTML = `<option selected disabled>Select Course</option>`;

    // Add new options
    courseList.forEach(course => {
        const option = document.createElement("option");
        option.value = course;
        option.textContent = course;
        select.appendChild(option);


    });
       const select2 = document.getElementById("coursead");

    // Clear existing options
    select2.innerHTML = `<option selected disabled>Select Course</option>`;

    // Add new options
    courseList.forEach(course => {
        const option = document.createElement("option");
        option.value = course;
        option.textContent = course;
        select2.appendChild(option);


    });

}


collegetypes();


document.addEventListener('DOMContentLoaded', () => {
  const classSelect = document.getElementById('classSelect');
  const classSelector = document.getElementById('classSelector');

  // For classSelect — trigger classeslist and populate
  classSelect.addEventListener('click', async () => {
    try {
      const response = await classeslist();
      
      if (response.success) {
        // Optional: repopulate the select
        updateSelectOptions(classSelect, response.classesWithoutSubjects);
      }
    } catch (error) {
      console.error("Error fetching class list:", error);
    }
  });

  // For classSelector — trigger timetableclass and populate
  classSelector.addEventListener('click', async () => {
    try {
      const response = await classestimelist(); // You must define this elsewhere
      console.log(response)
      if (response.success) {
        // Optional: repopulate the select
        updateSelectOptions(classSelector, response.classesWithoutTimetable); // Adjust based on response
      }
    } catch (error) {
      console.error("Error fetching timetable class data:", error);
    }
  });

    
});

// Helper to update select options
function updateSelectOptions(selectElement, items) {
  // Clear old options, keep placeholder
  selectElement.length = 1;
  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.Name;
    selectElement.appendChild(option);
  });
}

// Helper to update select options
function updateSubjectOptions(selectElement, items) {
  // Clear old options, keep placeholder
  selectElement.length = 1;
  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.class_id;
    option.textContent = item.subject_name;
    selectElement.appendChild(option);
  });
}



 const accordionHeaders = document.querySelectorAll('.accordion-header');
  const assselect = document.getElementById('assSelect');
    accordionHeaders.forEach(header => {
      
      header.addEventListener('click', async () => {
        const currentItem = header.parentElement;
        const content = currentItem.querySelector('.accordion-content');
        const icon = header.querySelector('.arrow-icon');

        const isOpen = content.classList.contains('show');
        if (isOpen) {
          content.style.display = 'none';
          content.classList.remove('show');
          icon.style.transform = 'rotate(0deg)';
        } else {
          const type = currentItem.getAttribute('data-type');
        
        
          const data = await fetchData(type);
       
         
      if (type === 'assignments') {
        updateSubjectOptions(assselect,data.message)
      }

       if (data.message.includes("Unauthorized")) {
      showSessionExpiredPopup(); // custom popup handler
    } else{

          content.innerHTML = renderList(type, data.message);
          content.style.display = 'block';
          content.classList.add('show');
          icon.style.transform = 'rotate(180deg)';
        }
      }
      });
    });

   async function fetchData(type) {
  switch (type) {
    case 'classes':
      return await getclasses();

    case 'timetables':
      return   await gettimetablelist()
    case 'assignments':
      return await lectsubjects()
    case 'attendancesheets':
    
      return await getattendancesheets();

    case 'subjects':
  
      return await getsubjectslist()
    default:
      return [];
  }
}


function renderList(type, data) {
  // If data is empty, show a message and a button


  if (!data || data.length === 0) {
    return `
      <div class="card-container" id="container-id">
        <p class="no-data">No ${type} available.</p>
      </div>
      <button class="add-button" data-type="${type}">+ Add ${type}</button>
    `;
  }

  let html = '<div class="card-container" id="container-id">';

  data.forEach(item => {
    switch (type) {
      case 'classes':
        html += `
          <div class="card clickable" data-id="${item.Id}">
            <h3>${item.Name}</h3>
            <p><strong>Course:</strong> ${item.Course}</p>
            <p><strong>Year:</strong> ${item.Year}, <strong>Sem:</strong> ${item.Sem}</p>
            <p><strong>Section:</strong> ${item.Section}</p>
            <p><strong>Role:</strong> ${item.Role}</p>
          </div>
        `;
        break;

      case 'timetables':
        if (!item || !item.Timetable || item.Timetable.length === 0) break;

        const hasPeriods = item.Timetable.some(day => day.periods && day.periods.length > 0);
        if (!hasPeriods) break;

        html += `<div class="cardt">`;
        html += `<h4>Class: ${item.name}</h4>`;
        html += renderTimetableGrid(item.Timetable);
        html += `</div>`;
        break;

      case 'assignments':
        html += `
          <div class="card">
            <h3>${item.subject_name}</h3>
            <p><strong>Course:</strong> ${item.course}, <strong>Section:</strong> ${item.section}</p>
            <p><strong>Year:</strong> ${item.year}, <strong>Sem:</strong> ${item.sem}</p>
          </div>
        `;
        break;

      case 'attendancesheets':
        html += `
          <div class="card clicker"
               data-year="${item.Year}"
               data-sem="${item.Sem}"
               data-section="${item.Section}"
               data-course="${item.Course}"
               data-id="${item.Id}"
                data-subject="${item.Subject}">
            <h3>${item.Name}</h3>
            <p><strong>Subject:</strong> ${item.Subject}</p>
            <p><strong>Course:</strong> ${item.Course },  <strong>Section:</strong> ${item.Section}</p>
            <p><strong>Year:</strong> ${item.Year}, <strong>Sem:</strong> ${item.Sem}</p>
          </div>
        `;
        break;

      case 'subjects':
        html += `
          <div class="card">
            <h3>${item.class_name}</h3>
            <p><strong>Subject:</strong> ${item.subject_name} (${item.subject_code})</p>
            <p><strong>Lecturer:</strong> ${item.lecturer_name}</p>
          </div>
        `;
        break;
    }
  });

  html += '</div>';
  html += `<button class="add-button" data-type="${type}">+ Add ${type}</button>`;

  return html;
}


document.addEventListener('click', function (e) {
  if (e.target.closest('.clickable')) {
    const card = e.target.closest('.clickable');
    const classId = card.dataset.id;

    // Redirect with classId in the URL
    window.location.href = `/students/page/${classId}`;
  }
});

document.addEventListener('click', function (e) {
  if (e.target.closest('.clicker')) {
    const card = e.target.closest('.clicker');
    const course = card.dataset.course;
 const year = card.dataset.year;
  const section = card.dataset.section;
   const sem = card.dataset.sem;
    const id = card.dataset.id;
   const subject=card.dataset.subject
   
    // Redirect with classId in the URL
    window.location.href = `/students/pageatt/${subject}/${id}/${course}/${sem}/${section}/${year}/`;
  }
});







function renderTimetableGrid(data) {
  // data is an array like item.Timetable
  if (!data || data.length === 0) return '<p>No timetable data available.</p>';

  const daysToShow = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Filter timetable days to only daysToShow and map by day name
  const timetableByDay = {};
  daysToShow.forEach(day => {
    timetableByDay[day] = (data.find(d => d.day === day)?.periods) || [];
  });

  // Find max periods count to define rows
  const maxPeriods = Math.max(...Object.values(timetableByDay).map(p => p.length));

  // Build grid header with days
  let html = `<div class="timetable-card">`;
  html += `<div class="timetable-row timetable-header">`;
  daysToShow.forEach(day => {
    html += `<div class="timetable-cell header-cell">${day}</div>`;
  });
  html += `</div>`;

  // Build rows
  for (let i = 0; i < maxPeriods; i++) {
    html += `<div class="timetable-row">`;
    daysToShow.forEach(day => {
      const period = timetableByDay[day][i];
      if (period) {
        html += `
          <div class="timetable-cell">
            <div><strong>${period.name}</strong></div>
            <div>${period.startTime} - ${period.endTime}</div>
            
          </div>
        `;
      } else {
        html += `<div class="timetable-cell empty-cell"></div>`;
      }
    });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('add-button')) {
    const type = e.target.dataset.type;
    handleAdd(type);
  }
});



  function handleAdd(type) {
    
  const modal =document.getElementById("popupForm")
  const modal2 =document.getElementById("popupFormad")
  const subject =document.getElementById("subjectModal")
    const assignment =document.getElementById("popupFormass")
  const timetable =document.getElementById("popupOverlay")
  switch (type) {
    case 'classes':
      if (modal) {
  modal.style.display="flex";
      }
      break;

   case"attendancesheets":
  if (modal2) {
  modal2.style.display="flex";
      }
      
      break;
         case"timetables":
if (timetable) {
  timetable.style.display="flex";
      }
      break;
        case"subjects":
if (subject) {
  subject.style.display="flex";
      }
      break;
      case"assignments":
      if (subject) {
  assignment.style.display="flex";
      }

      break;
    default:
      console.warn(`No action defined for type: ${type}`);
      break;
  }


}


 const addBtn = document.getElementById('addSubjectRowBtn');
  const removeBtn = document.getElementById('removeSubjectRowBtn');
  const container = document.getElementById('subjectInputsContainer');

  // Attach focus listener to populate lecturer selects
  function attachLecturerSelectLogic(selectElement) {
    let loaded = false;

    selectElement.addEventListener('focus', async () => {
      if (loaded || selectElement.options.length > 1) return;

      const collegecode = localStorage.getItem('collegename');
      try {
        const lecturers = await lecturerlist(collegecode);
        lecturers.forEach(lect => {
          const option = document.createElement('option');
          option.value = lect.Id;
          option.textContent = lect.Fullname;
          selectElement.appendChild(option);
        });
        loaded = true;
      } catch (error) {
        console.error('Error fetching lecturers:', error);
      }
    });
  }

  // Attach to initial lecturer select
  const initialSelect = document.querySelector('select.lecturername');
  if (initialSelect) {
    attachLecturerSelectLogic(initialSelect);
  }

  // Add new subject group
  addBtn.addEventListener('click', () => {
    const group = document.createElement('div');
    group.classList.add('subject-group');

    group.innerHTML = `
      <div class="subject-input-row">
        <input type="text" name="code" placeholder="Subject Code" required />
        <input type="text" name="name" placeholder="Subject Name" required />
      </div>
      <select class="lecturername" required>
        <option value="" disabled selected>-- Select Lecturer --</option>
      </select>
    `;

    container.appendChild(group);

    const newSelect = group.querySelector('select.lecturername');
    attachLecturerSelectLogic(newSelect);
    updateRemoveButtonState();
  });

  // Remove last subject group
  removeBtn.addEventListener('click', () => {
    const groups = container.querySelectorAll('.subject-group');
    if (groups.length > 1) { // always keep at least one subject group
      container.removeChild(groups[groups.length - 1]);
      updateRemoveButtonState();
    }
  });

  function updateRemoveButtonState() {
    const groups = container.querySelectorAll('.subject-group');
    // Disable remove if only one group remains
    removeBtn.disabled = groups.length <= 1;
  }

  // Initial button state
  updateRemoveButtonState();
    
 const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const daySelector = document.getElementById('daySelector');
const dayFormContainer = document.getElementById('dayFormContainer');
const classesContainer = document.getElementById('classesContainer');
const breaksContainer = document.getElementById('breaksContainer');
const addClassBtn = document.getElementById('addClassBtn');
const addBreakBtn = document.getElementById('addBreakBtn');
const timetableData = {};

// Populate day selector options and initialize timetableData object
days.forEach(day => {
  const option = document.createElement('option');
  option.value = day;
  option.textContent = day;
  daySelector.appendChild(option);

  // Initialize each day with empty periods and breaks arrays
  timetableData[day] = { day: day, periods: [], breaks: [] };
});

// Create a single entry row with inputs for name/start/end and remove button
function createEntryRow(type, entryData = {name:'', start:'', end:''}) {
  const row = document.createElement('div');
  row.className = 'entry';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = type === 'class' ? 'Subject name' : 'Break name';
  nameInput.value = entryData.name || '';
  nameInput.required = true;

  const startInput = document.createElement('input');
  startInput.type = 'time';
  startInput.value = entryData.start || '';
  startInput.required = true;

  const endInput = document.createElement('input');
  endInput.type = 'time';
  endInput.value = entryData.end || '';
  endInput.required = true;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = 'Remove';
  removeBtn.onclick = () => row.remove();

  row.appendChild(nameInput);
  row.appendChild(startInput);
  row.appendChild(endInput);
  row.appendChild(removeBtn);

  return row;
}

// Load data from timetableData to the form for the selected day
function loadDayData(day) {
  classesContainer.innerHTML = '';
  breaksContainer.innerHTML = '';

  const dayData = timetableData[day];

  // Load classes (periods of type "subject")
  const classEntries = dayData.periods.filter(p => p.type === 'subject');
  if (classEntries.length === 0) {
    const noClassMsg = document.createElement('div');
    noClassMsg.className = 'no-entries';
    noClassMsg.textContent = 'No classes added yet.';
    classesContainer.appendChild(noClassMsg);
  } else {
    classEntries.forEach(entry => {
      const row = createEntryRow('class', {name: entry.name, start: entry.startTime, end: entry.endTime});
      classesContainer.appendChild(row);
    });
  }

  // Load breaks (periods of type "break")
  const breakEntries = dayData.breaks;
  if (breakEntries.length === 0) {
    const noBreakMsg = document.createElement('div');
    noBreakMsg.className = 'no-entries';
    noBreakMsg.textContent = 'No breaks added yet.';
    breaksContainer.appendChild(noBreakMsg);
  } else {
    breakEntries.forEach(entry => {
      const row = createEntryRow('break', {name: entry.name, start: entry.startTime, end: entry.endTime});
      breaksContainer.appendChild(row);
    });
  }
}

// Save current form entries into timetableData object for the given day
function saveDayData(day) {
  if (!day) return;

  const periods = [];
  const breaks = [];

  // Collect classes
  Array.from(classesContainer.children).forEach(child => {
    if (child.classList.contains('entry')) {
      const inputs = child.getElementsByTagName('input');
      if (inputs.length === 3) {
        periods.push({
          name: inputs[0].value,
          type: "subject",
          startTime: inputs[1].value,
          endTime: inputs[2].value
        });
      }
    }
  });

  // Collect breaks
  Array.from(breaksContainer.children).forEach(child => {
    if (child.classList.contains('entry')) {
      const inputs = child.getElementsByTagName('input');
      if (inputs.length === 3) {
        breaks.push({
          name: inputs[0].value,
          type: "break",
          startTime: inputs[1].value,
          endTime: inputs[2].value
        });
      }
    }
  });

  timetableData[day] = { day, periods, breaks };
}

// On day change, save previous day's data and load new day's data
let currentDay = null;
daySelector.addEventListener('change', () => {
  if (currentDay) {
    saveDayData(currentDay);
  }
  currentDay = daySelector.value;
  loadDayData(currentDay);
  dayFormContainer.style.display = 'block';
});

// Helper: Convert timetableData object to array of day objects with combined and sorted periods
function getTimetableArray(timetableData) {
  const result = [];

  for (const day in timetableData) {
    if (timetableData.hasOwnProperty(day)) {
      const dayData = timetableData[day];

      // Combine periods and breaks into one array
      const combinedPeriods = [
        ...(dayData.periods || []),
        ...(dayData.breaks || [])
      ];

      // Sort by startTime
      combinedPeriods.sort((a, b) => {
        if (a.startTime < b.startTime) return -1;
        if (a.startTime > b.startTime) return 1;
        return 0;
      });

      result.push({
        day: dayData.day,
        periods: combinedPeriods
      });
    }
  }

  return result;
}

  // Add a new class entry row
  addClassBtn.addEventListener('click', () => {
    // Remove no-entry message if present
    const noClassMsg = classesContainer.querySelector('.no-entries');
    if (noClassMsg) noClassMsg.remove();

    classesContainer.appendChild(createEntryRow('class'));
  });

  // Add a new break entry row
  addBreakBtn.addEventListener('click', () => {
    const noBreakMsg = breaksContainer.querySelector('.no-entries');
    if (noBreakMsg) noBreakMsg.remove();

    breaksContainer.appendChild(createEntryRow('break'));
  });
// Example usage: log the timetable array on Submit Timetable button click
document.getElementById('timetableForm').addEventListener('submit', async (event) => {
  event.preventDefault(); // 🛑 Prevent form submission (refresh), only if validation passed

  const classSelect = document.getElementById('classSelector');
  const className = classSelect.options[classSelect.selectedIndex].text;
 const timetable =document.getElementById("popupOverlay")
 const popup = document.getElementById('popupForm'); 
  if (!event.target.checkValidity()) {
    // Optional: manually report invalid fields (if needed)
    return;
  }

  if (currentDay) {
    saveDayData(currentDay);
  }

  const timetableArray = getTimetableArray(timetableData);
  console.log(timetableArray,className)
const result=await puttimetable(className,timetableArray)

 if (result.success) {
        timetable.style.display='none'
        showPopup(result.message);
          daySelector.selectedIndex = 0;
        classesContainer.innerHTML = '';
        breaksContainer.innerHTML = '';
        dayFormContainer.style.display = 'none';
        currentDay = null;

        // Reset timetableData
        for (const day of days) {
            timetableData[day] = { day: day, periods: [], breaks: [] };
        }
         const currentItem = document.querySelector('[data-type="timetables"]');
  const content = currentItem.querySelector('.accordion-content');

  const data = await gettimetablelist(); // Fetch updated timetable list
  content.innerHTML = renderList('timetables', data.message); // Re-render
  content.style.display = 'block';
  content.classList.add('show');
  currentItem.querySelector('.arrow-icon').style.transform = 'rotate(180deg)';
    } else {
         popup.style.display = 'none';
    }
});


document.getElementById("classsub").addEventListener('click', async function() {
    const collegename = localStorage.getItem('collegename');

    // Use correct IDs from your HTML
    const popup = document.getElementById('popupForm');
    const modal =document.getElementById("popupForm")
    const classname = document.getElementById("className").value.trim();
    const administration = document.getElementById("role").value;
    const regulation = document.getElementById("Regulation").value;
    const course = document.getElementById("course").value;
    const year = document.getElementById("year").value;
    const section = document.getElementById("section").value;
    const sem = document.getElementById("semester").value;
  
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

     if (!regulation) {
        setError("Regulation", "Syllabus regulation is required");
        hasError = true;
    } else {
        setError("Regulation", "");
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
    var result = await postclasses(course, year, section, sem, classname, administration, collegename, regulation);

  if (result.success) {
  
    modal.style.display = 'none';
  showPopup(result.message);
  document.getElementById("className").value = '';
document.getElementById("role").value = '';
document.getElementById("Regulation").value = '';
document.getElementById("course").selectedIndex = 0;
document.getElementById("year").selectedIndex = 0;
document.getElementById("section").selectedIndex = 0;
document.getElementById("semester").selectedIndex = 0;

  document.querySelector('#semester + .error').textContent = '';

   const currentItem = document.querySelector('[data-type="classes"]'); // the accordion item
  const content = currentItem.querySelector('.accordion-content');
  const data = await getclasses(); // refetch class list
  
  content.innerHTML = renderList('classes', data.message); // update UI
  content.style.display = 'block';
  content.classList.add('show');
  currentItem.querySelector('.arrow-icon').style.transform = 'rotate(180deg)';
  // Reset form fields for class form

} else {
   if (result.message.includes("Unauthorized")) {
      showSessionExpiredPopup(); // custom popup handler
    } 
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
    var result = await postattend(subject,course,year,section,sem,classname)

   if (result.success) {
  const popup = document.getElementById('popupForm');
    modal2.style.display = 'none';
  showPopup(result.message);
    // Reset form fields for attendance sheet
document.getElementById("classNamead").value = '';
document.getElementById("subjectNamead").value = '';
document.getElementById("coursead").selectedIndex = 0;
document.getElementById("yearad").selectedIndex = 0;
document.getElementById("sectionad").selectedIndex = 0;
document.getElementById("semesterad").selectedIndex = 0;
 document.querySelector('#semesterad + .error').textContent = '';
   const currentItem = document.querySelector('[data-type="attendancesheets"]'); // the accordion item for attendance sheets
  const content = currentItem.querySelector('.accordion-content');

  const data = await getattendancesheets(); // fetch updated attendance sheets
  content.innerHTML = renderList('attendancesheets', data.message); // render updated list
  content.style.display = 'block'; // make sure it is visible
  content.classList.add('show');

  // Rotate the arrow icon to open position
  currentItem.querySelector('.arrow-icon').style.transform = 'rotate(180deg)';


} else {

    if (result.message.includes("Unauthorized")) {
      showSessionExpiredPopup(); // custom popup handler
    } 
const semesterError = document.querySelector('#semesterad + .error');
  semesterError.textContent = result.message;
 
  
}
});

document.getElementById("asub").addEventListener('click', async function () {
     const assignment =document.getElementById("popupFormass")
  const classSelect = document.getElementById('assSelect');
  const id = classSelect.value; 
 
    const subjectname = classSelect.options[classSelect.selectedIndex].text; 
    const duedate = document.getElementById("dueDateass").value;
    const pdfInput = document.getElementById("pdfFile");
   const originalPdf = pdfInput.files[0];
const timestamp = Date.now();
const renamedPdf = new File([originalPdf], `${timestamp}.pdf`, { type: originalPdf.type });


    let hasError = false;

    function setError(id, message) {
        const container = document.getElementById(id).closest('.form-group');
        const errorElem = container.querySelector('small.error');
        if (errorElem) {
            errorElem.innerText = message;
        }
    }

    if (!duedate) {
        setError("dueDateass", "Due-date is required");
        hasError = true;
    } else {
        setError("dueDateass", "");
    }

    if (!renamedPdf) {
        setError("pdfFile", "File is required");
        hasError = true;
    } else if (renamedPdf.type !== "application/pdf") {
        setError("pdfFile", "Only PDF files are allowed");
        hasError = true;
    } else {
        setError("pdfFile", "");
    }

    if (hasError) return;

    const result = await putassignments(id,subjectname, duedate, renamedPdf);
  if (result.success) {
  const popup = document.getElementById('popupForm');
    assignment.style.display = 'none';
  showPopup(result.message);
}
   else{
     if (result.message.includes("Unauthorized")) {
      showSessionExpiredPopup(); // custom popup handler
    } 
  
   }
});


document.getElementById('subjectForm').addEventListener('submit', async (event) => { 
  event.preventDefault();

  const form = event.target;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
 const subject =document.getElementById("subjectModal")
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
  subject.style.display = 'none';
  showPopup(result.message);

  const container = document.getElementById('subjectInputsContainer');
        container.innerHTML = '';
        const group = document.createElement('div');
        group.classList.add('subject-group');
        group.innerHTML = `
          <div class="subject-input-row">
            <input type="text" name="code" placeholder="Subject Code" required />
            <input type="text" name="name" placeholder="Subject Name" required />
          </div>
          <select class="lecturername" required>
            <option value="" disabled selected>-- Select Lecturer --</option>
          </select>
        `;
        container.appendChild(group);
        attachLecturerSelectLogic(group.querySelector('select.lecturername'));
        updateRemoveButtonState();
        document.getElementById('classSelect').selectedIndex = 0;

  const currentItem = document.querySelector('[data-type="subjects"]');
  const content = currentItem.querySelector('.accordion-content');

  const data = await getsubjectslist();
  content.innerHTML = renderList('subjects', data.message);
  content.style.display = 'block';
  content.classList.add('show');
  currentItem.querySelector('.arrow-icon').style.transform = 'rotate(180deg)';

}else {
    // If token expired or unauthorized
    if (result.message.includes("Unauthorized")) {
      showSessionExpiredPopup(); // custom popup handler
    } 
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


function showSessionExpiredPopup() {
  const popup = document.getElementById('session-popup');
  popup.style.display = 'flex'; // or 'block' based on your CSS
}

document.getElementById('ton').addEventListener('click', () => {
  location.reload(); // This reloads the current page
});





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







function Courses(type) {
    const courseMap = {
        "Engineering": [
            "EEE", "ECE", "CSE", "CE", "ME", "CHE", "AE", "AUTO", "BME", "BT",
            "ENE", "IPE", "MTE", "MRE", "MIE", "PE", "TE", "AIML", "RE", "DSE",
            "CYSE", "IOTE", "NTE", "REE", "SE", "AGE", "ICE", "MME", "AEG",
            "IE", "STE", "GTE", "CEM", "TCE", "PWE", "FSE", "RWE", "GIE", "CEG", "PTE",
            "DCE", "DME", "DEE", "DECE", "DCSE", "DIT", "DAE", "DMECH", "DASE", "DMinE",
            "DMtE", "DChE", "DTE", "DAgE", "DBtE", "DPE", "DMarE", "DIE", "DBME", "DEnvE",
            "DPT", "DFT", "DDT", "DArchE"
        ],
        "Medical": ["MBBS", "BDS", "BAMS", "BHMS", "BUMS", "BSMS", "BNYS", "BVSc & AH", "B.Sc Nursing", "BPT", "BMLT", "B.Pharm", "MD", "MS", "MDS"],
        "Arts & Science": ["BA", "B.Sc", "B.Com", "BBA", "MA", "M.Sc", "M.Com", "MBA"],
        "Law": ["LLB", "BA LLB", "BBA LLB", "B.Com LLB", "LLM"],
        "Management": ["BBA", "MBA", "PGDM"],
        "Polytechnic": [
            "DCE", "DME", "DEE", "DECE", "DCSE", "DIT", "DAE", "DMECH", "DASE", "DMinE",
            "DMtE", "DChE", "DTE", "DAgE", "DBtE", "DPE", "DMarE", "DIE", "DBME", "DEnvE",
            "DPT", "DFT", "DDT", "DArchE"
        ],
        "Agricultural": [
            "B.Sc Agri", "B.Tech Agri", "B.Sc Hort", "B.Sc Forestry", "B.Sc Fisheries",
            "B.Sc Sericulture", "B.Sc Dairy Tech", "B.Sc Agronomy", "B.Sc Plant Path",
            "B.Sc Agri Biotech", "B.Sc AH", "B.Sc Seed Tech", "B.Sc Soil Sci",
            "M.Sc Agri", "M.Tech Agri", "M.Sc Hort", "M.Sc Forestry", "M.Sc Fisheries",
            "M.Sc Sericulture", "M.Sc Dairy Tech", "M.Sc Agronomy", "M.Sc Plant Path",
            "M.Sc Agri Biotech", "M.Sc AH", "M.Sc Seed Tech", "M.Sc Soil Sci",
            "Ph.D Agri", "Ph.D Hort", "Ph.D Fisheries", "Ph.D Dairy Tech"
        ],
        "Hotel Management": ["BHM", "B.Sc HM", "BBA HM", "BTTM", "DHM", "DHTM", "DTTM", "MHM", "MBA HM", "MTTM", "PGDHM"],
        "Fashion & Design": ["B.Des", "B.Sc FD", "B.A FD", "B.Voc FD", "BFTech", "BFA FD", "Diploma FD", "Diploma TD", "M.Des", "M.Sc FD", "M.A FD", "M.Voc FD", "MFTech", "PGDFD"],
        "Fine Arts": ["BFA", "BVA", "BPA", "MFA", "MVA", "MPA", "Diploma FA", "Diploma VA", "Diploma PA", "PGDFA"],
        "Aviation": ["B.Sc Aviation", "BBA AM", "B.Tech AE", "B.Tech AAE", "B.Tech AOE", "Diploma AME", "Diploma GA", "Diploma CA", "MBA AM", "M.Sc Aviation", "PGDAM"],
        "Teacher Training": ["B.Ed", "B.P.Ed", "D.Ed", "D.El.Ed", "M.Ed", "M.P.Ed", "NTT", "PGDTE", "PGDHE", "TTC"]
    };

    return courseMap[type] || [];
}

  window.onload = function() {
  var progressBar = document.querySelector('#loading .loader');
  
  var conten = document.getElementById('dashboard');

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