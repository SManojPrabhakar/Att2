import {
  Plecturerlist,
  Padminlist,
  Pstudentslist,
  Pclasses,
  PLecturesDelivered,PstudentslistbyCourse,
  Psubjects,Pstattendance,Pstresults,Pstfeedues,PlecturerlistbyCourse,
} from "./model.js";

let allData = [];
let userRole = null;

function getRoleFromURL() {
  const pathParts = window.location.pathname.split("/");
  return pathParts[3] || null;
}

const collegename = localStorage.getItem("collegename");
const collegecode = localStorage.getItem("collegecode");
const desigination=localStorage.getItem("desigination")
const course=localStorage.getItem('department');

document.getElementById("regNo").addEventListener("input", function (e) {
  const keyword = e.target.value.toLowerCase().trim();
  if (!keyword) {
    renderCards(allData);
    
    return;
  }

  const matched = allData.filter(item =>
    item.Name.toLowerCase().includes(keyword) || item.Regno.toLowerCase().includes(keyword)
  );

  const unmatched = allData.filter(item =>
    !item.Name.toLowerCase().includes(keyword) && !item.Regno.toLowerCase().includes(keyword)
  );

  const combined = [...matched, ...unmatched];
  renderCards(combined);
});


async function handlePrincipalView(userRole, collegecode, collegename) {
  switch (userRole) {
    case "Lecturer":
      return await Plecturerlist(collegecode);
    case "Admin":
      return await Padminlist(collegecode);
    case "Student":
      return await Pstudentslist(collegename);
    default:
      console.warn("Unknown role:", userRole);
      return null;
  }
}

async function getdata() {
  userRole = getRoleFromURL();
  let result = [];

  try {
    if (desigination === "Principal") {
      result = await handlePrincipalView(userRole, collegecode, collegename);
    } else if (desigination === "HOD") {
      switch (userRole) {
        case "Lecturer":
          result = await PlecturerlistbyCourse(collegecode, course);
          break;
        case "Student":
          result = await PstudentslistbyCourse(collegename, course);
          break;
        default:
          console.warn("Unknown role for HOD:", userRole);
          return;
      }
    } else {
      // Treat all other designations same as Principal
      result = await handlePrincipalView(userRole, collegecode, collegename);
    }

    // Handle response (unchanged logic)
    const errorMessageEl = document.getElementById("errorMessage");
    const cardsContainer = document.getElementById("feeCardsContainer");
    errorMessageEl.style.display = "none";
    errorMessageEl.textContent = "";

    if (Array.isArray(result)) {
      if (result.length === 0) {
        errorMessageEl.textContent = "No Records found...!";
        errorMessageEl.style.display = "block";
        cardsContainer.innerHTML = "";
      } else {
        allData = result;
        renderCards(result);
      }
    } else {
      if (result?.message?.includes("Token expired") || result?.message?.includes("Unauthorized")) {
        showSessionExpiredPopup();
      } else if (result?.success === false && result?.message) {
        errorMessageEl.textContent = result.message;
        errorMessageEl.style.display = "block";
        cardsContainer.innerHTML = "";
      } else {
        errorMessageEl.textContent = "Failed to fetch data.";
        errorMessageEl.style.display = "block";
      }
    }

  } catch (error) {
    console.error("Error fetching data:", error);
    document.getElementById("errorMessage").textContent = "Unexpected error occurred.";
    document.getElementById("errorMessage").style.display = "block";
  }
}


getdata();




function showSessionExpiredPopup() {
  const popup = document.getElementById('session-popup');
  popup.style.display = 'flex'; // or 'block' based on your CSS
}

document.getElementById('ton').addEventListener('click', () => {
  
   if (desigination && desigination.trim() !== "") {
    window.location.href = '/campus';
  } else {
    window.location.href = '/colleges';
  }
});




function renderCards(data) {
  const container = document.getElementById("feeCardsContainer");
  container.innerHTML = "";


   if (!Array.isArray(data) || data.length === 0) {

    container.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #dc3545; font-size: 1.2rem;">
        No records found.
      </div>`;
    return;
  }
  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "shadow card p-3 bg-white rounded";
    card.style = "max-width: 680px; margin: 10px auto; border: none;";

    let buttonsHTML = "";
    if (userRole === "Lecturer" ||userRole === "Admin") {
      buttonsHTML = `
        <button class="btn btn-sm btn-classes me-2 mb-2" data-regno="${item.Regno}">Classes</button>
        <button class="btn btn-sm btn-subjects me-2 mb-2" data-regno="${item.Regno}">Subjects</button>
        <button class="btn btn-sm btn-lecturers mb-2" data-regno="${item.Regno}">Lecturers Delivered</button>
      `;
    } else if (userRole === "Student") {
      buttonsHTML = `
        <button class="btn btn-sm btn-attendance me-2 mb-2" data-regno="${item.Regno}">Attendance</button>
        <button class="btn btn-sm btn-marks me-2 mb-2" data-regno="${item.Regno}">Marks Summary</button>
        <button class="btn btn-sm btn-fee mb-2" data-regno="${item.Regno}">Fee Dues</button>
      `;
    }

    card.innerHTML = `
      <div class="d-flex align-items-center">
        <img src="${item.ProfilePic}" alt="${item.Name}" class="rounded-circle mr-3"
            style="width: 90px; height: 90px; object-fit: cover; border: 2px solid #007bff;">
        <div class="flex-grow-1">
          <h5 class="mb-1 font-weight-bold">${item.Name}</h5>
          <p class="text-muted mb-2"><strong>Reg No:</strong> ${item.Regno}</p>
          <div class="d-flex flex-wrap gap-2">
            ${buttonsHTML}
          </div>
          <div class="expandable mt-2 p-2 border rounded bg-light" style="display: none;"></div>
        </div>
      </div>
    `;

    container.appendChild(card);
    const expandable = card.querySelector(".expandable");

    if (userRole === "Lecturer" ||userRole === "Admin") {
      const [classesBtn, subjectsBtn, lecturersBtn] = card.querySelectorAll("button");

      classesBtn.addEventListener("click", async () => {

        const classes = await Pclasses(item.Id);
             console.log(classes)
        expandable.innerHTML = classes.length
          ? classes.map(cls => `
              <div class="mb-2">
                <strong>${cls.Role}</strong> ${cls.Course} - ${cls.Year} ${cls.Sem} ${cls.Section}
              </div>
            `).join("")
          : "<div>No class data available.</div>";
        expandable.style.display = "block";
      });

      subjectsBtn.addEventListener("click", async () => {
        const response = await Psubjects(item.Id);
        console.log(response)
        if (response?.success && Array.isArray(response.message)) {
          expandable.innerHTML = response.message.map(sub => `
            <div class="mb-2">
              <strong>${sub.subject_name}</strong><br/>
              ${sub.course} - ${sub.year} ${sub.sem} ${sub.section}
            </div>
          `).join("");
        } else {
          expandable.innerHTML = "<div>No subject data available.</div>";
        }
        expandable.style.display = "block";
      });

      lecturersBtn.addEventListener("click", async () => {
        const response = await PLecturesDelivered(item.Id);
        if (Array.isArray(response) && response.length > 0) {
          expandable.innerHTML = response.map(lec => `
            <div class="mb-2">
              <strong>${lec.Subject}</strong> - ${lec.Course} (${lec.Year} ${lec.Sem} ${lec.Section})<br/>
              <span style="color: #28a745;">Lectures Delivered: ${lec.Count}</span>
            </div>
          `).join("");
        } else {
          expandable.innerHTML = "<div>No lectures delivered data available.</div>";
        }
        expandable.style.display = "block";
      });
    }

    if (userRole === "Student") {
      const [attendanceBtn, marksBtn, feeBtn] = card.querySelectorAll("button");

    attendanceBtn.addEventListener("click", async () => {
  const response = await Pstattendance(item.Id);
  

  if (response?.success && response.message) {
    const attended = response.message.attended_classes || 0;
    const total = response.message.total_classes || 0;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    const angle = percentage * 3.6;

    expandable.innerHTML = `
      <div>
        <strong>Attendance</strong>
        <div class="progress-circle" style="--angle: ${angle}deg;">
          <div class="progress-value">${percentage}%</div>
        </div>
        <p>${attended} out of ${total} classes attended.</p>
      </div>
    `;
  } else {
    expandable.innerHTML = `<div><strong>Attendance</strong>: No data available.</div>`;
  }

  expandable.style.display = "block";
});

   marksBtn.addEventListener("click", async () => {
  const response = await Pstresults(item.Regno);


  if (Array.isArray(response) && response.length > 0) {
    // Group data by examname
    const grouped = {};
    response.forEach(entry => {
      if (!grouped[entry.examname]) {
        grouped[entry.examname] = [];
      }
      grouped[entry.examname].push(entry);
    });

   
    let html = `<div><strong>Marks Summary</strong></div>`;
    for (const exam in grouped) {
      html += `<div class="mt-2"><h6>${exam}</h6><ul>`;
      grouped[exam].forEach(subject => {
        html += `<li><strong>${subject.SubjectName}</strong>: ${subject.marks} / ${subject.totalmarks}</li>`;
      });
      html += `</ul></div>`;
    }

    expandable.innerHTML = html;
  } else {
    expandable.innerHTML = `<div><strong>Marks Summary</strong>: No data available.</div>`;
  }

  expandable.style.display = "block";
});


    feeBtn.addEventListener("click", async () => {
  const response = await Pstfeedues(item.Regno);
 if (response?.success && Array.isArray(response.message)) {
    const dues = response.message;

    let html = `<div><strong>Fee Dues</strong></div>`;
    html += `<ul style="padding-left: 18px;">`;

    dues.forEach(due => {
      const amount = parseFloat(due.Fee_due);
      const color = amount > 0 ? "#dc3545" : amount < 0 ? "#28a745" : "#6c757d"; // red, green, gray
      html += `
        <li style="margin-bottom: 4px;">
          <strong>${due.Fee_type}</strong> (${due.Fee_year}): 
          <span style="color: ${color}; font-weight: bold;">₹${due.Fee_due}</span>
        </li>
      `;
    });

    html += `</ul>`;
    expandable.innerHTML = html;
  } else {
    expandable.innerHTML = `<div><strong>Fee Dues</strong>: No data available.</div>`;
  }

  expandable.style.display = "block";
});

    }
  });
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
        
           conten.style.display='block'// Hide progress bar
      } else {
          width++;
          progressBar.style.width = width + '%';
      }
  }, 10);
};