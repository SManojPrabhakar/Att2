import { userdata,user,logout,Login,contactus } from "./model.js";


async function updateUIOnLogin() {

  const result=await userdata()

  if (
    result.message === "Unauthorized: Token expired" ||
    result.message === "Unauthorized: Invalid token" ||
    result.message === "Unauthorized: Token verification failed"
  ) {
  
    document.getElementById('login').style.display='inline-block'
  
    document.getElementById('down').style.display = 'none';
  
    document.getElementById('profile').style.display = 'none';
    username.style.display = 'none';
    document.getElementById("session-popup").style.display = "flex";
    return;
  }else{

  document.getElementById('login').style.display='none'
  document.getElementById('down').style.display = 'inline-block';
  
  document.getElementById('profile').src = result.message.profilepic;

  const username=document.getElementById('userame')

  username.style.display = 'inline-block';
username.innerText=result.message.Fullname;
const iconElement = document.createElement('i');
    iconElement.className = 'fas fa-caret-down';
    username.appendChild(iconElement);

  

}
}

document.getElementById('login').addEventListener('click', function () {
  document.getElementById('overlay1').style.display = 'flex';
});
document.getElementById('xmark').addEventListener('click', function () {
  document.getElementById('overlay1').style.display = 'none';
});

 document.getElementById('logout').addEventListener('click', async function(){
   
    const result= await logout()
  
    if(result.message ==="logged out"){
      window.location.reload(); 
    updateUIOnLogout()
   
    }
  })
// Function to update UI on logout
function updateUIOnLogout() {
  
  localStorage.clear();
  document.getElementById('down').style.display = 'none';
    document.getElementById('profile').style.display='none'
    
  document.getElementById('userame').style.display = 'none';
  document.querySelector('.dropdown-content').style.display = 'none';

}

async function loginstatus(){
  const result=await user()
  if (result.success) {
  
    updateUIOnLogin();
 
   
  } else {
   
    updateUIOnLogout();
  
  }
  
  }

  loginstatus()

document.getElementById('userame').addEventListener('click', async function(){
  var dropdownContent = document.querySelector('.dropdown-content');

  // Toggle the display property between 'none' and 'block'
  if (dropdownContent.style.display === 'none' || dropdownContent.style.display === '') {
      dropdownContent.style.display = 'block';
  } else {
      dropdownContent.style.display = 'none';
  }
})






document.getElementById('loged').addEventListener('click', async function() {
  var username = document.getElementById('username');
  var password = document.getElementById('password');
  var passwordError = document.getElementById('passwordError');
  var usernameError = document.getElementById('usernameError');

  passwordError.innerHTML = "";
  usernameError.innerHTML = "";

  try {
    // Validate and sanitize user inputs before sending to the server
    if (!username.value || !password.value) {
      throw new Error("Username and password are required.");
    }

    let result = await Login(username.value, password.value);
 
    if (result.message === "College not found") {
      passwordError.innerHTML = "Invalid username and password";
    } else {
      window.location.reload();
      updateUIOnLogin()
      
    }
  } catch (error) {
    console.error("Error:", error);
    // Handle the error (e.g., display an error message to the user)
  }
});





  
document.getElementById('submitBtn').addEventListener('click', async function () {
  document.getElementById("progressOverlay").style.display = "flex";
    var issues = document.getElementById("issues");
    var fullName = document.getElementById("fullName");
    var emailAddress = document.getElementById("email");
    var message = document.getElementById("message");
    var mobileNumber = document.getElementById("mobilenumber");

    var mobileError = document.getElementById("mobilenumberError");
    var issuesError = document.getElementById("issuesError");
    var fullNameError = document.getElementById("fullNameError");
    var emailAddressError = document.getElementById("emailError");
    var messageError = document.getElementById("messageError");

    // Clear old error messages
    issuesError.innerHTML = "";
    fullNameError.innerHTML = ""; 
    emailAddressError.innerHTML = ""; 
    messageError.innerHTML = "";
    mobileError.innerHTML = "";

    // Validation for "issues"
    if (issues.value == null || issues.value === "How may I help you?") {
        issuesError.innerHTML = "Please select an issue";
    }

    // Validation for "fullName"
    if (fullName.value.trim() === "") {
        fullNameError.innerHTML = "Please enter your full name";
    }

    // Validation for "emailAddress"
    if (emailAddress.value.trim() === "") {
        emailAddressError.innerHTML = "Please enter your email address";
    }

    // Validation for "mobileNumber"
    if (mobileNumber.value.trim() === "") {
        mobileError.innerHTML = "Please enter your mobile number";
    } else if (!/^\d{10}$/.test(mobileNumber.value.trim())) {
        mobileError.innerHTML = "Please enter a valid 10-digit mobile number";
    }

    // Validation for "message"
    if (message.value.trim() === "") {
        messageError.innerHTML = "Please enter your feedback message";
    }

    // Prevent submit if there are any errors
    if (
        issuesError.innerHTML ||
        fullNameError.innerHTML ||
        emailAddressError.innerHTML ||
        mobileError.innerHTML ||
        messageError.innerHTML
    ) {
        return;
    }

    try {
        const result = await contactus(
            emailAddress.value,
            fullName.value,
            issues.value,
            mobileNumber.value,
            message.value
        );

        document.getElementById("progressOverlay").style.display = "none";

        if (result.success) {
            showPopup(result.message);
            
            fullName.value = "";
            mobileNumber.value = "";
            message.value = "";
            emailAddress.value = "";
            issues.value = "How may I help you?";
        }else{
           messageError.innerHTML = result.message
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