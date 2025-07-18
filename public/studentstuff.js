 import { Login,user, userdata,
   logout,studentattend,studentssublist,studentstimelist,studentsassignmentslist} from "./model.js";



 const accordionHeaders = document.querySelectorAll('.accordion-header');

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

    function showSessionExpiredPopup() {
  const popup = document.getElementById('session-popup');
  popup.style.display = 'flex'; // or 'block' based on your CSS
}

document.getElementById('ton').addEventListener('click', () => {
  location.reload(); // This reloads the current page
});



   async function fetchData(type) {
     var classid = localStorage.getItem('classid');
  switch (type) {
   
 case 'timetables':
      return   await studentstimelist(classid)
    case 'assignments':
            return   await studentsassignmentslist(classid)
    case 'attendance':
      return await studentattend();

    case 'subjects':
      return studentssublist(classid)
    default:
      return [];
  }
}


function renderList(type, data) {
  let html = '<div class="card-container" id="container-id">'; // Corrected the opening tag
  data.forEach(item => {
    switch (type) {
    

      case 'timetables':
        if (!item || !item.Timetable || item.Timetable.length === 0) break;

        const hasPeriods = item.Timetable.some(day => day.periods && day.periods.length > 0);
        if (!hasPeriods) break;

        html += `<div class="cardt">`;
        html += renderTimetableGrid(item.Timetable);
        html += `</div>`;
        break;

     case 'assignments':
  html += `
    <div class="card">
      <h3>${item.subjectname}</h3>
      <p><strong>Deadline:</strong> ${new Date(item.deadline).toLocaleDateString()}</p>
      
      <iframe src="${item.assimages}" width="100%" height="150px" style="border:1px solid #ccc;"></iframe>
      
      <a href="${item.assimages}" target="_blank" download class="download-button">📥 Download PDF</a>
    </div>
  `;
  break;


case 'attendance':
  const attended = item.attended_classes;
  const total = item.total_classes;

  if (attended == null || total == null) {
    html += `
      <div class="card">
        <h3>Attendance</h3>
        <p>No attendance data available</p>
      </div>
    `;
    break;
  }

  const percentage = total === 0 ? 0 : Math.round((attended / total) * 100);
  const radius = 40;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const progressColor = percentage < 70 ? "#f44336" : "#00bcd4";

  html += `
    <div class="card">
      <h3>Attendance</h3>
      <svg
        height="${radius * 2}"
        width="${radius * 2}"
        class="circular-progress"
      >
        <circle
          stroke="#d3d3d3"
          fill="transparent"
          stroke-width="${stroke}"
          r="${normalizedRadius}"
          cx="${radius}"
          cy="${radius}"
        />
        <circle
          stroke="${progressColor}"
          fill="transparent"
          stroke-width="${stroke}"
          stroke-dasharray="${circumference} ${circumference}"
          style="stroke-dashoffset:${strokeDashoffset}; transition: stroke-dashoffset 0.35s;"
          stroke-linecap="round"
          r="${normalizedRadius}"
          cx="${radius}"
          cy="${radius}"
        />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14px" fill="#000">
          ${percentage}%
        </text>
      </svg>
      <p><strong>Attended:</strong> ${attended}</p>
      <p><strong>Total:</strong> ${total}</p>
    </div>
  `;
  break;


  
case 'subjects':
  html += `
    <div class="card">
      <p><strong>Subject:</strong> ${item.subject_name} (${item.subject_code})</p>
      <p><strong>Lecturer:</strong> ${item.lecturer_name}</p>
    </div>
  `;
  break;
    }
  });
  html += '</div>';


  

  return html; // Return the generated HTML if needed
}










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

  }
});


document.getElementById('logout').addEventListener('click', async function () {
  const result = await logout();
  if (result.message === "logged out") {
    updateUIOnLogout();
  }
});

document.getElementById('userame').addEventListener('click', function () {
  var dropdownContent = document.querySelector('.dropdown-contentr');
  dropdownContent.style.display = (dropdownContent.style.display === 'none' || dropdownContent.style.display === '') ? 'block' : 'none';
});

document.getElementById('loged').addEventListener('click', async function () {
  var username = document.getElementById('username');
  var password = document.getElementById('password');
  var passwordError = document.getElementById('passwordError');
  var usernameError = document.getElementById('usernameError');

  passwordError.innerHTML = "";
  usernameError.innerHTML = "";

  try {
   if (!username.value.trim()) {
      usernameError.style.display = "block";
      usernameError.innerHTML = "Username is required.";
      return;
    }

    if (!password.value.trim()) {
      passwordError.style.display = "block";
      passwordError.innerHTML = "Password is required.";
      return;
    }

    let result = await Login(username.value, password.value);
    console.log(result);

    if (!result.success) {
      passwordError.innerHTML = result.message;
      return;
    }

    // Fetch user data to check role
    const userData = await userdata();

    if (
      userData.message === "Unauthorized: Token expired" ||
      userData.message === "Unauthorized: Invalid token" ||
      userData.message === "Unauthorized: Token verification failed"
    ) {
      passwordError.innerHTML = "Session expired. Please log in again.";
      return;
    }

    // Enforce Admin-only login
    if (userData.message.Role !== "Student") {
  passwordError.innerHTML = "Access denied: Student only.";
  return;
}


     window.location.reload();
    updateUIOnLogin(userData);

  } catch (error) {
    console.error("Error:", error);
    passwordError.innerHTML = "Something went wrong. Please try again.";
  }
});

async function updateUIOnLogin(userData) {
   
  localStorage.setItem('classid', userData.message.class_id);
     document.getElementById('login').style.display = 'none';
  document.getElementById('down').style.display = 'inline-block';

  document.getElementById('profile').src = userData.message.profilepic;
  document.getElementById('profile').style.display = 'inline-block';

  const username = document.getElementById('userame');
  username.style.display = 'inline-block';
  username.innerText = userData.message.Fullname;

  const iconElement = document.createElement('i');
  iconElement.className = 'fas fa-caret-down';
  username.appendChild(iconElement);

  setTimeout(() => {
    document.getElementById("overlay1").style.display = "none";
  }, 2000);
}

function updateUIOnLogout() {
  document.getElementById('login').style.display = 'inline-block';
  document.getElementById('down').style.display = 'none';
  document.getElementById('profile').style.display = 'none';
  document.getElementById('userame').style.display = 'none';
  document.querySelector('.dropdown-contentr').style.display = 'none';
  document.getElementById("overlay1").style.display = "flex";
}

async function loginstatus() {
  const result = await user();
  if (result.success) {
    const userData = await userdata();
    if (userData.message.Role === "Student") {
      updateUIOnLogin(userData);
    } else {
      updateUIOnLogout();
    }
  } else {
    updateUIOnLogout();
  }
}
loginstatus();

document.getElementById('eyeSlash').addEventListener('click', function () {
  var passwordInput = document.getElementById('password');
  var eyeSlashIcon = document.getElementById('eyeSlash');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeSlashIcon.classList.remove('fa-eye-slash');
    eyeSlashIcon.classList.add('fa-eye');
  } else {
    passwordInput.type = 'password';
    eyeSlashIcon.classList.remove('fa-eye');
    eyeSlashIcon.classList.add('fa-eye-slash');
  }
});



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