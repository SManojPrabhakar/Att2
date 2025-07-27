import { report,reportingmail,logout,Login,user,userdata} from './model.js';


async function updateUIOnLogin(userData) {

  document.getElementById("fullName").value = userData.message.Fullname;
document.getElementById("email").value = userData.message.Email;

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

  
    document.getElementById("overlay1").style.display = "none";
 
}

  document.getElementById('logout').addEventListener('click', async function(){
     
      const result= await logout()
       console.log("'''")
      if(result.message ==="logged out"){
        window.location.reload(); 
      updateUIOnLogout()
     
      }
    })
  // Function to update UI on logout
  function updateUIOnLogout() {
    
    document.getElementById('login').style.display = 'inline-block';
    document.getElementById('down').style.display = 'none';
    document.getElementById("overlay1").style.display = "flex";
    document.getElementById('profile').style.display='none'
    document.getElementById('userame').style.display = 'none';
    document.querySelector('.dropdown-content').style.display = 'none';
  
  }
  
  async function loginstatus() {
    const result = await user();
    if (result.success) {
      const userData = await userdata();
      if (userData.success) {
        updateUIOnLogin(userData);
      } else {
        updateUIOnLogout();
      }
    } else {
      updateUIOnLogout();
    }
  }
  loginstatus();
  
  document.getElementById('userame').addEventListener('click', async function(){
    var dropdownContent = document.querySelector('.dropdown-content');
  
    // Toggle the display property between 'none' and 'block'
    if (dropdownContent.style.display === 'none' || dropdownContent.style.display === '') {
        dropdownContent.style.display = 'block';
    } else {
        dropdownContent.style.display = 'none';
    }
  })
  
 
  
  
 
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
 
    
      updateUIOnLogin(userData);
      window.location.reload();
  
 
   } catch (error) {
     console.error("Error:", error);
     passwordError.innerHTML = "Something went wrong. Please try again.";
   }
 });
  
  
  
  
  
document.getElementById('submitBtn').addEventListener('click', async function () {
  // Show loading spinner
  document.getElementById("progressOverlay").style.display = "flex";

  var fullName = document.getElementById("fullName");
  var emailAddress = document.getElementById("email");
  var number = document.getElementById("mobilenumber");
  var Name = document.getElementById("orgin");
  var message = document.getElementById("message");

  var fullNameError = document.getElementById("fullNameError");
  var emailAddressError = document.getElementById("emailError");
  var mobilenumberError = document.getElementById("mobilenumberError");
  var orginError = document.getElementById("orginError");
  var messageError = document.getElementById("messageError");

  fullNameError.innerHTML = "";
  emailAddressError.innerHTML = "";
  mobilenumberError.innerHTML = "";
  orginError.innerHTML = "";
  messageError.innerHTML = "";

  let hasError = false;

  if (number.value === "") {
    mobilenumberError.innerHTML = "Please enter number";
    hasError = true;
  }

  if (fullName.value.trim() === "") {
    fullNameError.innerHTML = "Please enter your full name";
    hasError = true;
  }

  if (emailAddress.value.trim() === "") {
    emailAddressError.innerHTML = "Please enter your email address";
    hasError = true;
  }

  if (Name.value.trim() === "") {
    orginError.innerHTML = "Please enter person name or organization";
    hasError = true;
  }

  if (message.value.trim() === "") {
    messageError.innerHTML = "Please enter your feedback message";
    hasError = true;
  }

  if (hasError) {
    document.getElementById("progressOverlay").style.display = "none"; // Hide spinner if error
    return;
  }

  try {
    const result = await report(
      emailAddress.value,
      fullName.value,
      Name.value,
      number.value,
      message.value
    );

    // Hide loader
    document.getElementById("progressOverlay").style.display = "none";

    if (result.success) {
      showPopup(result.message);
       Name.value = "";
  number.value = "";
  message.value = "";
    } else if (result.message.includes("Unauthorized")) {
      showSessionExpiredPopup();
    }
  } catch (err) {
    document.getElementById("progressOverlay").style.display = "none";
    console.error("Error:", err);
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

window.onload = function() {
  var progressBar = document.querySelector('#loading .loader');
  
  var conten = document.getElementById('conte');

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