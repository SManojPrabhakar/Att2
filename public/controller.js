// Controller (your-controller.js)

import { sendDataToServer,s3images,right,verification, S3delete,userdata,Login,logout,user} from './model.js';



let timeInSeconds;
let countdownInterval;
let Id;



document.getElementById('logout').addEventListener('click', async function(){
  const result= await logout()
  if(result.message ==="logged out"){
  updateUIOnLogout()
  }
})

document.getElementById('userame').addEventListener('click', async function(){
  var dropdownContent = document.querySelector('.dropdown-contentr');

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
 
    if (result.message === "College not found") {
      passwordError.innerHTML = "Invalid username and password";
      return;
    } 
     const userData = await userdata();
 if (userData.message.Role !== "Founder") {
      passwordError.innerHTML = "Access denied: Founders only.";
      return;
    }

    window.location.reload();
    updateUIOnLogin(userData);

  } catch (error) {
    console.error("Error:", error);
    // Handle the error (e.g., display an error message to the user)
  }
});

async function updateUIOnLogin(result) {

  localStorage.setItem('fondid', result.message.Id);


  document.getElementById('login').style.display='none'
  document.getElementById('down').style.display = 'inline-block';
  
  document.getElementById('profile').src = result.message.profilepic;
  document.getElementById('profile').style.display = 'inline-block';      
  const username=document.getElementById('userame')

  username.style.display = 'inline-block';
username.innerText=result.message.Fullname;
const iconElement = document.createElement('i');
    iconElement.className = 'fas fa-caret-down';
    username.appendChild(iconElement);
  setTimeout(function () {
    document.getElementById("overlay1").style.display = "none";
  }, 2000);

}



 document.getElementById('ton').addEventListener('click', async function(){
   
    const result= await logout()
  
    if(result.message ==="logged out"){
      window.location.reload(); 
    updateUIOnLogout()
   
    }
  })

async function loginstatus(){
  const result=await user()
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

  loginstatus()



function updateUIOnLogout() {
  localStorage.clear();
  document.getElementById('login').style.display = 'inline-block';
 document.getElementById('down').style.display = 'none';
  document.getElementById('profile').style.display = 'none';
 
  document.getElementById('userame').style.display = 'none';
  document.querySelector('.dropdown-contentr').style.display = 'none';
  document.getElementById("overlay1").style.display = "flex";

}

document.getElementById('eyeSlash').addEventListener('click',async function(){
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
})

// Function to handle image upload
/*async function handeImageUpload() {
  const images = document.getElementById('file-input').files;

  // Check if there are any files
  if (images.length > 0) {
      // Loop through each file
      for (let i = 0; i < images.length; i++) {
          console.log(images[i].name); // Log the name of each file
          // You can perform any further processing with the files here
      }
  } else {
      console.log("No files selected.");
  }
}

// Add event listener for change event on file input
document.getElementById('file-input').addEventListener('change', handeImageUpload);
*/


async function handelImageUpload() {
  try {
    
      const images = document.getElementById('file-input');
    const Imagekeys = images.files;
   
const  imageUploadError=""
      if (!Imagekeys || Imagekeys.length === 0) {
      
          // Success case
          const popupContent = document.getElementById('popupContent');
          const imageElement = document.createElement('img');
          imageElement.src = 'wrong.jpg'; // Replace with the actual path to your image
          imageElement.alt = 'Selected Image';
          imageElement.height=80;
          imageElement.width=80;
         
          popupContent.innerText ='Image is not selected';
        
          popupContent.appendChild(imageElement);
      
          // Show the popup container and overlay
          const popupContainer = document.getElementById('popupContainer');
          const overlay = document.getElementById('overlay');
          popupContainer.style.display = 'block';
          overlay.style.display = 'block';
        
      }else{
         const keys = await s3images(Imagekeys);
         return keys
       } // Optionally, you can send the image keys to the model
      // const result = await sendImageKeysToModel(keys);
  } catch (error) {
      console.log('Error handling image upload:', error);
  }
}



document.getElementById('submitBtn').addEventListener('click', async function () {
  const fondid = localStorage.getItem('fondid');
  const spinner = document.getElementById('loadingSpinner');
  spinner.style.display = "block";

  // Clear previous errors
  document.getElementById('mailError').textContent = "";
  document.getElementById('PrincipalError').textContent = "";
  document.getElementById('fileError').textContent = "";

  document.getElementById('mail').classList.remove('input-error');
  document.getElementById('Principal').classList.remove('input-error');
  document.getElementById('file-input').classList.remove('input-error');

  // Inputs
  const mail = document.getElementById("mail").value.trim();
  const Principal = document.getElementById("Principal").value.trim();
  const fileInput = document.getElementById("file-input");

  let hasError = false;

  // Email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(mail)) {
    document.getElementById('mailError').textContent = "Enter a valid email address.";
    document.getElementById('mail').classList.add('input-error');
    hasError = true;
  }

  // Principal name validation
  if (Principal.length < 3) {
    document.getElementById('PrincipalError').textContent = "Principal name must be at least 3 characters.";
    document.getElementById('Principal').classList.add('input-error');
    hasError = true;
  }

  // File validation
  if (!fileInput.files || fileInput.files.length === 0) {
    document.getElementById('fileError').textContent = "Please upload a registration or affiliation certificate.";
    document.getElementById('file-input').classList.add('input-error');
    hasError = true;
  }

  if (hasError) {
    spinner.style.display = 'none';
    return;
  }

  let key;
  try {
    key = await handelImageUpload(); // Your custom function
  } catch (err) {
    spinner.style.display = 'none';
    document.getElementById('fileError').textContent = "Image upload failed. Please try again.";
    return;
  }

  try {
    // Other values (assume all are defined in your form)
    const state = document.getElementById("state").value.trim();
    const Collage_Type = document.getElementById("collageType").value.trim();
    const Collage_Code = document.getElementById("Code").value.trim();
    const Collage_Name = document.getElementById("collageName").value.trim();
    const Collage_Email = document.getElementById("Email").value.trim();
    const Collage_Address = document.getElementById("collageAddress").value.trim();
    const Collage_Admin_Number = document.getElementById("collageLandline").value.trim();

    const result = await sendDataToServer(
      state,
      Collage_Type,
      Collage_Code,
      Collage_Name,
      Collage_Email,
      Collage_Admin_Number,
      Principal,
      key[0],
      mail,
      Collage_Address,
      fondid
    );

    spinner.style.display = 'none';

    if (result.success) {

      showPopup(result.message, true); 
    } else {
      await S3imagedelete(key[0]);
      showPopup(result.message, false); 
    }
  } catch (error) {
    spinner.style.display = 'none';

    if (key && key[0]) await S3imagedelete(key[0]);
    showPopup(error.message || "Unexpected error occurred.", false);
  }
});

// Show popup with conditional buttons
function showPopup(message, success) {
  document.getElementById("popupContent").textContent = message;
  document.getElementById("popupContainer").style.display = "block";

 const blocker = document.getElementById("ui-blocker-overlay");

  if (success) {
    blocker.style.display = 'block'; // ✅ Block the UI
    document.getElementById("closePopupBtn").style.display = "inline-block";
    document.getElementById("cancelPopupBtn").style.display = "none";
  } else {
    blocker.style.display = 'none'; // ❌ Allow interaction
    document.getElementById("closePopupBtn").style.display = "inline-block";
    document.getElementById("cancelPopupBtn").style.display = "inline-block";
  }
}

// Example: Popup close/cancel
document.getElementById("closePopupBtn").addEventListener("click", function () {
  window.location.href = "/"; // or your home route
});

document.getElementById("cancelPopupBtn").addEventListener("click", function () {
  document.getElementById("popup").style.display = "none";
});
/*
function showPopup(message) {
  const popupContent = document.getElementById('popupContent');
  popupContent.innerText = message;

  const popupContainer = document.getElementById('popupContainer');
  const overlay = document.getElementById('overlay');
  popupContainer.style.display = 'block';
  overlay.style.display = 'block';
}
*/
function showPopupWithImage(message, imagePath) {
  console.log(message)
  const popupContent = document.getElementById('popupContent');
  popupContent.innerHTML = ''; // Clear previous content

  const imageElement = document.createElement('img');
  imageElement.src = imagePath;
  imageElement.alt = 'Error Image';
  imageElement.height = 50;
  imageElement.width = 50;

  const messageText = document.createElement('p');
  messageText.innerText = message;

  popupContent.appendChild(imageElement);
  popupContent.appendChild(messageText);

  const popupContainer = document.getElementById('popupContainer');
  const overlay = document.getElementById('overlay');
  popupContainer.style.display = 'block';
  overlay.style.display = 'block';
}

document.getElementById('cancelPopupBtn').addEventListener('click', async function () {
  const popupContainer = document.getElementById('popupContainer');
  const overlay = document.getElementById('overlay'); // make sure overlay exists
  popupContainer.style.display = 'none';
  overlay.style.display = 'none';
});

async function S3imagedelete(key) {
  try {
    
      const images = document.getElementById('file-input');
    const Imagekeys = images.files;


       const eys = await S3delete(key);
         
      
  } catch (error) {
      console.error('Error handling image upload:', error);
  }
}

function showSessionExpiredPopup() {
  const popup = document.getElementById('session-popup');
  popup.style.display = 'flex'; // or 'block' based on your CSS
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


document.getElementById('Email').addEventListener('input', async function() {
    await toggleVerifyButton();
   });
   
   
   async function toggleVerifyButton() {
     var emailInput = document.getElementById('Email').value;
     var verifyButton = document.getElementById('verification');
   
        if (!emailInput) {
         var otpSection = document.querySelector('.otp');
     otpSection.style.display = 'none'; // Use 'flex' to show the OTP inputs
         verifyButton.disabled = true;
         timeInSeconds=null;
      stopCountdown()
         return;
     }
     const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput);
     if (isValidEmail) {
         // Clear error message if the email is valid
        $ ('#EmailError').text('').css('color', 'red');
         verifyButton.disabled=false;
         
       
   
     } else {
         // Display error message if the email is not valid
      
         var otpSection = document.querySelector('.otp');
         otpSection.style.display = 'none'; // Use 'flex' to show the OTP inputs
             verifyButton.disabled = true;
             timeInSeconds=null;
           
            
       stopCountdown()
     }
   }
window.hello = (function () {
  let listenersAttached = false;  // to avoid multiple listener attachments

  return function () {
    if (listenersAttached) return; // prevent re-attaching
    listenersAttached = true;

    const inputs = [
      document.getElementById('digit1'),
      document.getElementById('digit2'),
      document.getElementById('digit3'),
      document.getElementById('digit4'),
      document.getElementById('digit5'),
        document.getElementById('digit6')
    ];

    let otpInProgress = false;

    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value;
        const otpResultContainer = document.getElementById('otpResult');

        // Clear result container immediately on every input
        otpResultContainer.innerHTML = "";

        if (val.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }

        if (inputs.every(i => i.value.length === 1) && !otpInProgress) {
          otpInProgress = true;
          otp(...inputs.map(i => i.value))
            .finally(() => {
              otpInProgress = false;
            });
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value === '' && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });
  };
})();

async function otp(num1, num2, num3, num4, num5,num6) {

  const combinedValue = num1 + num2 + num3 + num4 + num5 + num6;
  const otpResultContainer = document.getElementById('otpResult');
 var Email = document.getElementById('Email').value;
  try {
    const result = await right(Email,combinedValue);

    // Clear container again before adding image (just to be extra safe)
    otpResultContainer.innerHTML = "";

    const Image = document.createElement('img');
    Image.height = 50;
    Image.width = 50;

    if (result.success) {
      Image.src = 'im.png';
      Image.alt = 'Success Image';
      document.getElementById('nxt').disabled = false;
    } else {
      Image.src = 'wong.png';
      Image.alt = 'Unsuccessful Image';
    }

    otpResultContainer.appendChild(Image);

    setTimeout(() => {
      otpResultContainer.innerHTML = "";
    }, 5000);
  } catch (error) {
    console.error("OTP verification failed:", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.hello();
});



    
   document.getElementById('verification').addEventListener('click', async function verify() {
    try {
      var emailInput = document.getElementById('Email').value;
      
      timeInSeconds=30
      startCountdown()
  showOTP()
  const result = await verification(emailInput);

  hello();
  
    } catch (error) {
    
        console.log(error);
    }
  });
  
   function showOTP() {
    // Toggle the visibility of the OTP input fields
    var otpSection = document.querySelector('.otp');
    otpSection.style.display = 'flex'; // Use 'flex' to show the OTP inputs
  
    // Optionally, you can disable the "Verify" button after displaying OTP
    var verifyButton = document.querySelector('.btn-primary');
   
  }
  
  function startCountdown() {
    // Disable the button
    const countdownButton = document.getElementById('verification');
  
    countdownButton.disabled = true;
  
    // Set the initial time in seconds
   
  
    // Update the button text every second
     countdownInterval = setInterval(() => {
        countdownButton.innerText = `resend ${timeInSeconds}'s`;
  
        // Check if the countdown has reached 0
        if (timeInSeconds <= 0) {
            clearInterval(countdownInterval); // Stop the countdown
            countdownButton.innerText="resend"
            countdownButton.disabled = false;
        } else {
            timeInSeconds--;
        }
    }, 1000);
  }
  
  function stopCountdown() {
    const countdownButton = document.getElementById('verification');
     
  
    clearInterval(countdownInterval); // Stop the countdown
    countdownButton.innerText = "verify";
    countdownButton.disabled = true;
  }
