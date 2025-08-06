
import {Login,user, userdata
  ,logout } from './model.js';
  
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
      document.getElementById("session-popup").style.display = "flex"; 
      return;
    }

    // Enforce Admin-only login
    if (userData.message.Role === "Student") {
  passwordError.innerHTML = "Access denied: Lecturer only.";
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
 
     localStorage.setItem('code', userData.message.Code);
  localStorage.setItem('collegename', userData.message.College_name);
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

  if (!result.success) {
    updateUIOnLogout();
    return;
  }

  const userData = await userdata();

  if (!userData.success || userData.message.Role === "Student") {
    updateUIOnLogout();
    return;
  }

  updateUIOnLogin(userData);
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


function showSessionPopup(onConfirm) {
  const popup = document.getElementById("session-popup");
  popup.style.display = "flex";

  const reloginButton = document.getElementById("ton");
  reloginButton.onclick = () => {
    popup.style.display = "none";
    if (typeof onConfirm === "function") {
      onConfirm();
    }
  };
}


