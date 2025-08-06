import {Login,user, userdata
  ,logout } from './model.js';
  

 
  document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("lecturers-card").addEventListener("click", () => {
     window.location.href = `/campus/students/${"Lecturer"}/`;
  });

  document.getElementById("students-card").addEventListener("click", () => {
     window.location.href = `/campus/students/${"Student"}/`;
  });

  document.getElementById("admin-card").addEventListener("click", () => {
     window.location.href = `/campus/students/${"Admin"}/`;
  });
});




  
document.getElementById('logout').addEventListener('click', async function () {
  localStorage.clear();
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

    // Enforce Admin-only login
   if (userData.message.Role === "Student") {
  passwordError.innerHTML = "Access denied: Admins only.";
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
  localStorage.setItem('collegecode', userData.message.College_Code);
  localStorage.setItem('collegename', userData.message.College_name);
  localStorage.setItem('desigination', userData.message.Desigination);
  localStorage.setItem('department', userData.message.Department);

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

  // Hide admin card if designation is HOD
  if (userData.message.Desigination === 'HOD') {
    const adminCard = document.getElementById('admin-card');
    if (adminCard) {
      adminCard.style.display = 'none';
    }
  }

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
    const allowedDesignations = ["Principal", "HOD", "Dean", "Director", "Vice Principal", "Vice Chancellor", "Chancellor"];

if (userData.message.Role !== "Student" && allowedDesignations.includes(userData.message.Desigination)) {
  updateUIOnLogin(userData);
}
 else {
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