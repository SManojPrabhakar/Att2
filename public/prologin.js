
import {Login,user, userdata,Lectupdatepassword,updatepassword
  ,logout,Foupdatepassword } from './model.js';

  let currentUserData = null; // Global to hold user data after login

// Handle Password Update Submission
document.querySelector('.password-update-btn').addEventListener('click', async (e) => {
  e.preventDefault();

  const prevPassword = document.getElementById('prevPassword').value.trim();
  const currPassword = document.getElementById('currPassword').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();

  const prevError = document.getElementById('prevPasswordError');
  const currError = document.getElementById('currPasswordError');
  const confirmError = document.getElementById('confirmPasswordError');
  const updateMsg = document.getElementById('updateMessage');

  // Reset previous messages
  prevError.textContent = '';
  currError.textContent = '';
  confirmError.textContent = '';
  updateMsg.textContent = '';
  updateMsg.style.color = 'green';

  let hasError = false;

  if (!prevPassword) {
    prevError.textContent = 'Current password is required';
    hasError = true;
  }

  if (!currPassword) {
    currError.textContent = 'New password is required';
    hasError = true;
  }

  if (currPassword !== confirmPassword) {
    confirmError.textContent = 'Passwords do not match';
    hasError = true;
  }

  if (hasError) return;

  // Get role from current user data
  const role = currentUserData?.Role;
  if (!role) {
    updateMsg.textContent = "User role not found. Please login again.";
    updateMsg.style.color = "red";
    return;
  }

   let result;
switch (currentUserData.Role) {

  case "Student":
    result = await updatepassword(prevPassword, currPassword);
    break;
  case "Lecturer":
  case "Admin":
    result = await Lectupdatepassword(prevPassword, currPassword);
    break;
  case "Founder":
    result = await Foupdatepassword(prevPassword, currPassword);
    break;
  default:
    updateMsg.style.color = 'red';
    updateMsg.textContent = 'Unrecognized role';
    return;
}


    if (result.success) {
       
      updateMsg.textContent = 'Password updated successfully!';
   document.getElementById('prevPassword').value = "";
document.getElementById('currPassword').value = "";
document.getElementById('confirmPassword').value = "";

    } else {
        if (result.message.includes("Unauthorized")) {
    showSessionExpiredPopup(); // custom popup handler
  } else {
          updateMsg.style.color = 'red';
      updateMsg.textContent = result.message || 'Failed to update password';// Show other error messages above the button
  }

    }
  
});

function showSessionExpiredPopup() {
  const popup = document.getElementById('session-popup');
  popup.style.display = 'flex'; // or 'block' based on your CSS
}


document.getElementById('ton').addEventListener('click', () => {
  window.location.href = '/profile';
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

  


     window.location.reload();
    updateUIOnLogin(userData);

  } catch (error) {
    console.error("Error:", error);
    passwordError.innerHTML = "Something went wrong. Please try again.";
  }
});

async function updateUIOnLogin(userData) {
    currentUserData = userData.message;
   profile(userData)

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
    if(userData.success){
    updateUIOnLogin(userData);
    }else{
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


async function profile(data) {
  document.getElementById("fullname").textContent = data.message.Fullname;
  document.getElementById("profilePic").src = data.message.profilepic;

  // Show Regno if not Founder
  if (data.message.Role !== "Founder") {
    document.getElementById("regno").textContent = data.message.Regno;
    document.getElementById("regno").style.display = "block";
  } else {
    document.getElementById("regno").style.display = "none";
  }

  let detailsHTML = "";

  if (data.message.Role === "Student") {
    detailsHTML = `
      <li><span class="label">Email:</span> ${data.message.Email}</li>
      <li><span class="label">Year:</span> ${data.message.Year}</li>
      <li><span class="label">Semester:</span> ${data.message.Sem}</li>
      <li><span class="label">Department:</span> ${data.message.Course}</li>
      <li><span class="label">Section:</span> ${data.message.Section}</li>
      <li><span class="label">Address:</span> ${data.message.Address}</li>
    `;
  } else if (data.message.Role === "Lecturer") {
    detailsHTML = `
      <li><span class="label">Email:</span> ${data.message.Email}</li>
      <li><span class="label">Designation:</span> ${data.message.Desigination}</li>
      <li><span class="label">Department:</span> ${data.message.Department}</li>
      <li><span class="label">Address:</span> ${data.message.Address}</li>
    `;
  } else if (data.message.Role === "Founder") {
    detailsHTML = `
      <li><span class="label">Email:</span> ${data.message.Email}</li>
      <li><span class="label">Address:</span> ${data.message.Address}</li>
    `;
  }

  document.getElementById("detailsList").innerHTML = detailsHTML;
}


      
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    const header = card.querySelector('.card-header');
    const content = card.querySelector('.card-content');
    const toggleIcon = header.querySelector('.toggle-icon');
    function toggleCard() {
      const expanded = header.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        header.setAttribute('aria-expanded', 'false');
        content.classList.remove('active');
        toggleIcon.classList.remove('rotate');
      } else {
        header.setAttribute('aria-expanded', 'true');
        content.classList.add('active');
      
      }
    }
    header.addEventListener('click', toggleCard);
    header.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard();
      }
    });
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
        
           conten.style.display='block';// Hide progress bar
      } else {
          width++;
          progressBar.style.width = width + '%';
      }
  }, 10);
};