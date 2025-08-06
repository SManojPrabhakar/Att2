 import {collegetype,studentreg } from "./model.js";

async function collegetypes() {
    var collegecode = localStorage.getItem('code');

    // Simulate fetching college type
    const result = await collegetype(collegecode); // Your backend call
    const type = result.collegetype.College_Type;

    const courseList = Courses(type);
    populateCourses(courseList);

}
// Dynamically populate dropdown
function populateCourses(courseList) {
    const select = document.getElementById("course");

    

    // Add new options
    courseList.forEach(course => {
        const option = document.createElement("option");
        option.value = course;
        option.textContent = course;
        select.appendChild(option);


    });
}


collegetypes();

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("subreg").addEventListener("click", async function (e) {
    e.preventDefault();

    // Clear all error messages
    document.querySelectorAll(".error-message").forEach(el => el.textContent = "");

    let hasError = false;

    // Helper to set error
    function setError(id, message) {
      document.getElementById(id).textContent = message;
      hasError = true;
    }

    // Get values
    const Regno = document.getElementById("regno").value.trim();
    const Fullname = document.getElementById("fullname").value.trim();
    const Course = document.getElementById("course").value;
      const regulation = document.getElementById("Regulation").value;
    const Year = document.getElementById("year").value;
    const Section = document.getElementById("section").value.trim();
    const Sem = document.getElementById("sem").value;
    const Gender = document.getElementById("gender").value;
    const Phone = document.getElementById("Phone-number").value.trim();
    const joiningdate = document.getElementById("joiningdate").value;
    const Completion= document.getElementById("completionyears").value.trim();
    const Password = document.getElementById("password").value;
    const Fee = document.getElementById("totalfee").value.trim();

    // Validate fields
    if (Regno === "") setError("regno-error", "Register Number is required.");
    if (Fullname === "") setError("fullname-error", "Full name is required.");
    if (!Course) setError("course-error", "Please select a course.");
    if (!Year) setError("year-error", "Please select a year.");
    if (Section === "") setError("section-error", "Section is required.");
    if (!Sem) setError("sem-error", "Please select a semester.");
    if (!Gender) setError("gender-error", "Please select a gender.");
if (!regulation) setError("Regulation-error", "Syllabus regulation is required.");
    // Phone number validation (10-digit)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(Phone)) {
      setError("Phone-error", "Enter a valid 10-digit phone number.");
    }

    if (joiningdate === "") setError("joiningdate-error", "Joining date is required.");
    if (Completion === "") setError("completionyears-error", "Completion years are required.");
    if (Password === "") setError("password-error", "Password is required.");
  

    const Role="Student"
  var College = localStorage.getItem('collegename');


    if (!hasError) {
  const result = await studentreg(
    Regno, Fullname, joiningdate, Year, Section, Course,
    Gender, College, Completion, Password, Role, Sem, Phone, Fee,regulation
  );

  if (result.success) {
  
    showPopup(result.message); // Show success popup
  document.getElementById("regno").value = "";
  document.getElementById("fullname").value = "";
  document.getElementById("course").value = "";
  document.getElementById("Regulation").value = "";
  document.getElementById("year").value = "";
  document.getElementById("section").value = "";
  document.getElementById("sem").value = "";
  document.getElementById("gender").value = "";
  document.getElementById("Phone-number").value = "";
  document.getElementById("joiningdate").value = "";
  document.getElementById("completionyears").value = "";
  document.getElementById("password").value = "";
  document.getElementById("totalfee").value = "";

  // Also clear backend error if it was shown before
  document.getElementById("back-error").textContent = "";

  } else {
     
     if (result.message.includes("Unauthorized")) {
      showSessionExpiredPopup(); // custom popup handler
    }else{
    setError("back-error", result.message);
    }
  }
  
}

  });
});



function showSessionExpiredPopup() {
  const popup = document.getElementById('session-popup');
  popup.style.display = 'flex'; // or 'block' based on your CSS
}

document.getElementById('ton').addEventListener('click', () => {
 location.reload(); 
});

function showPopup(message) {
  const popup = document.getElementById("successPopup");
  const msg = document.getElementById("popupMessage");

  msg.textContent = message;
  popup.style.display = "block";

  setTimeout(() => {
    popup.style.display = "none";
  }, 3000);
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
        
           conten.style.display='inline'// Hide progress bar
      } else {
          width++;
          progressBar.style.width = width + '%';
      }
  }, 10);
};







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
