
import {Login,user, userdata
  ,logout,collegeslist,updatefond} from './model.js';
  
  let colleges = [];
async function colls() {
  const result = await collegeslist();
  const container = document.getElementById('collegeCardsContainer');
  container.innerHTML = '';

  // If no response or token error
  if (!result) {
    container.innerHTML = `
      <div class="alert alert-danger text-center" role="alert">
        Could not fetch data. Please try again later.
      </div>
    `;
    return;
  }

  // Handle API error response
  if (!result.success) {
    if (result.message === 'No colleges registered under your ID') {
      container.innerHTML = `
        <div class="alert alert-info text-center" role="alert">
          No colleges have been registered yet.
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="alert alert-danger text-center" role="alert">
          ${result.message}
        </div>
      `;
    }
    return;
  }

  // Proceed if success and colleges exist
   colleges = result.colleges;

  if (!Array.isArray(colleges) || colleges.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info text-center" role="alert">
        No colleges have been registered yet.
      </div>
    `;
    return;
  }

  // Render colleges
  colleges.forEach((college, index) => {
    const card = document.createElement('div');
    card.className = 'card mb-3 custom-width-card';
    card.innerHTML = `
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">${college.College_Name}</h5>
        <i class="fas fa-edit text-primary" style="cursor:pointer;"></i>
      </div>
      <div class="card-body collapsed" id="college-details-${index}" style="display: none;">
        <p><strong>Code:</strong> ${college.Code}</p>
        <p><strong>College Code:</strong> ${college.College_Code}</p>
        <p><strong>Address:</strong> ${college.College_Address}</p>
        <p><strong>State:</strong> ${college.State}</p>
        <p><strong>Admin Number:</strong> ${college.College_Admin_Number}</p>
        <p><strong>Email:</strong> ${college.College_Email}</p>
        <p><strong>Principal:</strong> ${college.Principal}</p>
        <p><strong>Principal Email:</strong> ${college.P_Email}</p>
        <p><strong>Type:</strong> ${college.College_Type}</p>
        <div class="d-flex justify-content-end">
          <button class="btn btn-success mt-2 insights-btn" data-index="${index}">College Insights</button>
        </div>
      </div>
    `;

    // Toggle details
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('fa-edit')) return;
      const details = document.getElementById(`college-details-${index}`);
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    });

    // Edit button
    card.querySelector('.fa-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      const c = colleges[index];
      document.getElementById('editIndex').value = index;
      document.getElementById('editCollegeName').value = c.College_Name;
      document.getElementById('editCollegeCode').value = c.College_Code;
      document.getElementById('editAddress').value = c.College_Address;
      document.getElementById('editState').value = c.State;
      document.getElementById('editAdminNumber').value = c.College_Admin_Number;
      document.getElementById('editEmail').value = c.College_Email;
      document.getElementById('editPrincipal').value = c.Principal;
      document.getElementById('editPrincipalEmail').value = c.P_Email;

      const editModal = new bootstrap.Modal(document.getElementById('editCollegeModal'));
      editModal.show();
    });

    // Insights button
    card.querySelector('.insights-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const c = colleges[index];
      const name = encodeURIComponent(c.College_Name);
      const code = encodeURIComponent(c.College_Code);
      window.location.href = `/fo/campus/${name}/${code}`;
    });

    container.appendChild(card);
  });
}


  colls();
  // Optionally handle save button
document.getElementById('saveChangesBtn').addEventListener('click', async () => {
  const index = document.getElementById('editIndex').value;
 

  if (index !== '') {
   

    // Collect updated form data
    const College_Name = document.getElementById('editCollegeName').value.trim();
    const College_Code = document.getElementById('editCollegeCode').value.trim();
    const College_Address = document.getElementById('editAddress').value.trim();
    const State = document.getElementById('editState').value.trim();
    const College_Admin_Number = document.getElementById('editAdminNumber').value.trim();
    const College_Email = document.getElementById('editEmail').value.trim();
    const Principal = document.getElementById('editPrincipal').value.trim();
    const P_Email = document.getElementById('editPrincipalEmail').value.trim();
    const code= colleges[index].Code
    // Assuming you use 'id' or 'College_Code' to identify the college

const collegeInfo = {
  College_Name,
  College_Code,
  College_Address,
  State,
  College_Admin_Number,
  College_Email,
  Principal,
  P_Email,
 code
};


    try {
      const result = await updatefond(collegeInfo);
   
      if (result.success) {
        showPopup(result.message)
        document.getElementById('editCollegeModal').classList.remove('show'); // hide modal manually
        document.querySelector('.modal-backdrop')?.remove();
        await colls(); // Refresh college list
      } else {
        if (result.message.includes("Unauthorized")) {
    showSessionExpiredPopup(); // custom popup handler
  } 
      }
    } catch (error) {
      console.error('Update failed:', error);
      alert('An error occurred while updating the college.');
    }
  }
});


document.getElementById('ton').addEventListener('click', () => {
  location.reload(); // This reloads the current page
});

function showSessionExpiredPopup() {
  const popup = document.getElementById('session-popup');
  popup.style.display = 'flex'; // or 'block' based on your CSS
}
  // Load colleges on page load



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
  var password = document.getElementById('passwordl');
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
    if (userData.message.Role !== "Founder") {
      passwordError.innerHTML = "Access denied: Principal only.";
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
  localStorage.clear();
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
    if (userData.message.Role === "Founder") {
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
  var passwordInput = document.getElementById('passwordl');
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
  
  var conten = document.getElementById('conten');

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