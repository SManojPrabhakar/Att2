
import { Login,user, userdata
    ,logout,collegenames,verificationt,userlog,rightt,founderlog, } from './model.js';
  
  let timeInSeconds
  let countdownInterval
  
  
  
  document.getElementById('Email').addEventListener('input', async function() {
    await toggleVerifyButton();
   });
   
   
   async function toggleVerifyButton() {
     var emailInput = document.getElementById('Email').value;
     var verifyButton = document.getElementById('verifyButton');
   
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
    const result = await rightt(Email,combinedValue);

    // Clear container again before adding image (just to be extra safe)
    otpResultContainer.innerHTML = "";

    const Image = document.createElement('img');
    Image.height = 50;
    Image.width = 50;

    if (result.success) {
      Image.src = 'im.png';
      Image.alt = 'Success Image';
      document.getElementById('subsignup').disabled = false;
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



    
   document.getElementById('verifyButton').addEventListener('click', async function verify() {
    try {
      var emailInput = document.getElementById('Email').value;
      timeInSeconds=30
      startCountdown()
  showOTP()
  const result = await verificationt(emailInput);
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
    const countdownButton = document.getElementById('verifyButton');
  
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
    const countdownButton = document.getElementById('verifyButton');
     
  
    clearInterval(countdownInterval); // Stop the countdown
    countdownButton.innerText = "verify";
    countdownButton.disabled = true;
  }
  const selectElement = document.getElementById('Administration');

  
  // Add event listener for the change event
  selectElement.addEventListener('change', function() {
      // Get the selected option
      const selectedOption = selectElement.options[selectElement.selectedIndex];
      const college=document.getElementById('collegeselect')
      const Roll=document.getElementById('Id')
      const Rolllabel=document.getElementById('Ids')
      const RollError=document.getElementById('IdError')
     const unqcode=document.getElementById('unqcode')
      const unqcodelabel=document.getElementById('unqcodes')
      const unqcodeError=document.getElementById('unqcodeError')
      const collegecode=document.getElementById('collegecode')
      const collegecodelabel=document.getElementById('collegecodes')
      const collegecodeError=document.getElementById('collegecodeError')
      // Get the value of the selected option
      const selectedValue = selectedOption.value;
    
      switch (selectedValue) {
        case "Student":
          college.style.display = 'none';
          Roll.style.display = 'inline-block';
          Rolllabel.style.display = 'inline-block';
          RollError.style.display = 'inline-block';
          
         
          collage_name();
          break;
        case "Lecturer":
          college.style.display = 'block';
         unqcodelabel.style.display = 'inline-block';
            unqcode.style.display = 'inline-block';
            unqcodeError.style.display = 'inline-block';
        // collegecodelabel.style.display = 'inline-block';
          //  collegecode.style.display = 'inline-block';
            //collegecodeError.style.display = 'inline-block'; 
          Roll.style.display = 'inline-block';
          Rolllabel.style.display = 'inline-block';
          RollError.style.display = 'inline-block';
      
          collage_name();
          break;
          case "Admin":
            college.style.display = 'block';
              unqcodelabel.style.display = 'inline-block';
            unqcode.style.display = 'inline-block';
            unqcodeError.style.display = 'inline-block';
              //collegecodelabel.style.display = 'inline-block';
            //collegecode.style.display = 'inline-block';
            //collegecodeError.style.display = 'inline-block';
            Roll.style.display = 'inline-block';
            Rolllabel.style.display = 'inline-block';
            RollError.style.display = 'inline-block';
             collage_name();
            break;
          case "Founder":
      
          college.style.display='none'
        Roll.style.display = 'none';
          Rolllabel.style.display = 'none';
          RollError.style.display = 'none';
           unqcodelabel.style.display = 'none';
            unqcode.style.display = 'none';
            unqcodeError.style.display = 'none';
         //collegecodelabel.style.display = 'none';
           // collegecode.style.display = 'none';
            //collegecodeError.style.display = 'none';
          break;
        default:
          // Handle default case if needed
          break;
      }
      
         
  });
   
  
 async function collage_name() {
    try {
        const res = await collegenames();

        const selectElement = document.getElementById('collagesele');
        selectElement.innerHTML = '';

        // If no colleges found or empty array
        if (!res.success || !res.colleges || res.colleges.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '--No college registered--';
            selectElement.appendChild(option);
        } else {
            res.colleges.forEach(college => {
                const option = document.createElement('option');
                option.value = college.college_name;
                option.textContent = college.college_name;
                selectElement.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

  
  
  document.getElementById('login').addEventListener('click', function(){
    document.getElementById("overlay").style.display = "flex";
  })
  
  
  document.getElementById('signup').addEventListener('click', function(){
    document.getElementById("overlay2").style.display = "flex";
  })
  
 
  document.getElementById('xmark').addEventListener('click', async function(){
    document.getElementById("overlay").style.display = "none";
  })
  
  document.getElementById('xmark2').addEventListener('click', async function(){
    document.getElementById("overlay2").style.display = "none";
  })
            // Add this in your <script> tag or external JavaScript file (e.g., madcontroller.js)
  
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
  
  
            document.getElementById('eyeSlash2').addEventListener('click',async function(){
              var passwordInput = document.getElementById('pasword');
              var eyeSlashIcon = document.getElementById('eyeSlash2');
            
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
  
            document.getElementById('eyeSash').addEventListener('click',async function(){
              var passwordInput = document.getElementById('confirmpassword');
              var eyeSlashIcon = document.getElementById('eyeSash');
            
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
  
          
  
  
 
  
  
  document.getElementById('logout').addEventListener('click', async function(){
   
    const result= await logout()
  
    if(result.message ==="logged out"){
     
    updateUIOnLogout()
   
    }
  })
  
  function updateUIOnLogout() {
 
    document.getElementById('login').style.display = 'inline-block';
  
    document.getElementById('down').style.display = 'none';
    document.getElementById('Image').style.display = 'none';
    document.getElementById('register').style.display = 'none';
    document.getElementById('userame').style.display = 'none';
    document.querySelector('.dropdown-content').style.display = 'none';
  
  }
  
  
  
  document.getElementById('subsignup').addEventListener('click', async function () {
  
    var Administration = document.getElementById("Administration").value;
    var collegename = document.getElementById("collagesele").value;
    var fullname = document.getElementById("fullname").value;
    var Email = document.getElementById("Email").value;
    var password = document.getElementById("pasword").value;
    var confirmpassword = document.getElementById("confirmpassword").value;
 var unqcode = document.getElementById("unqcode").value;
    //const Year=document.getElementById('Year').value
    //const Section=document.getElementById('Section').value
    //const Course =document.getElementById('Course').value
    const roll=document.getElementById("Id").value
    //const Gender =document.getElementById('Gender').value
  
  
    var AdministrationError = document.getElementById("AdministrationError");
    var qualificationError=document.getElementById("collageseleError")
    var fullnameError = document.getElementById("FullnameError");
     var unqcodeError = document.getElementById("unqcodeError");
     // var collegecodeError = document.getElementById("collegecodeError");
    var EmailError = document.getElementById("EmailError");
    var passwordError=document.getElementById('paswordError');
    var rollError=document.getElementById('IdError');
    var confirmpasswordError = document.getElementById("confirmpasswordError");
   
   // const YearError=document.getElementById('YearError')
   // const SectionError=document.getElementById('SectionError')
   // const CourseError =document.getElementById('CourseError')
   // const GenderError =document.getElementById('GenderError')
    var check=document.getElementById('agree')
    const checkError =document.getElementById('checkboxError')
  
    AdministrationError.innerHTML = "";
    qualificationError.innerHTML=""
    fullnameError.innerHTML = ""; 
    EmailError.innerHTML = ""; 
    passwordError.innerHTML="";
    confirmpasswordError.innerHTML = "";
   unqcodeError.innerHTML="";
  // collegecodeError.innerHTML="";

   // YearError.innerHTML="";
    //SectionError.innerHTML=""
    //CourseError.innerHTML=""
   // GenderError.innerHTML=""
    checkError.innerHTML=""
    // Validation for "issues"
    
    if (Administration == null || Administration === "Select role") {
        AdministrationError.innerHTML = "Please select any one of them";
    }
    if (collegename == null || collegename === "Select College") {
      qualificationError.innerHTML = "Please select any one of them";
  }
  
    // Validation for "fullName"
    if (fullname=== "") {
        fullnameError.innerHTML = "Please enter your full name";
    }
    if (roll === "") {
      rollError.innerHTML = "Please enter your reg.no/Id";
  }
    // Validation for "emailAddress"
    if (Email === "") {
        EmailError.innerHTML = "Please enter your email address";
    }
  
    
     
  
if (password ==="" ) {
      passwordError.innerHTML = "password must have atleast 8 characters";
  }
    // Validation for "message"
    if (confirmpassword ==="" ||confirmpassword !== password  ) {
        confirmpasswordError.innerHTML = "password doesn't match";
    }
   if(!check.checked){
  checkError.innerHTML="Accept the terms and conditions"
   }
  
    if (
      fullname !== "" &&
      Email !== "" &&
      Administration !== "" &&
      password !== "" &&
      confirmpassword !== "" &&
      collegename === "Select College" &&
      roll === "" &&
      password === confirmpassword && 
      check.checked// Check if password and confirm password match
  ) {
      const done = await founderlog(Administration, fullname, Email, confirmpassword);
      if(done.success){
         document.getElementById("overlay2").style.display = "none";
      showSignedInPopup(done)
    }else{
       checkError.innerHTML=done.message
    }
  }
  
      if(fullname !=="" &&    unqcode !== "" &&     Email !=="" && Administration !==""  && password !=="" && confirmpassword !==""  && roll !==""&&
      password === confirmpassword){
        
        const done=    await userlog(Administration,roll,fullname,collegename,Email,confirmpassword,unqcode)
          if(done.success){
 document.getElementById("overlay2").style.display = "none";
      showSignedInPopup(done)
    }else{
       checkError.innerHTML=done.message
    }
        
        
        }
    
  });

  
function showSignedInPopup(resultmessage) {
    var popup = document.querySelector('.overlay-content3 .popup');
    popup.innerHTML = ''; // Clear previous content

    const popupContainer = document.createElement("div");
    popupContainer.style.display = "flex";
    popupContainer.style.flexDirection = "column";
    popupContainer.style.alignItems = "center";
    popupContainer.style.gap = "20px";

    const messageElement = document.createElement('p');
    messageElement.textContent = resultmessage.message;

    const imageElement = document.createElement('img');
    imageElement.src = resultmessage.success ? 'im.png' : 'wong.jpg';
    imageElement.alt = resultmessage.success ? "Success" : "Error";
    imageElement.style.maxWidth = "120px";
    imageElement.style.borderRadius = "12px";

    const button = document.createElement('button');
    button.textContent = resultmessage.success ? 'Login' : 'Close';
    button.onclick = function () {
        document.getElementById('overlay3').style.display = 'none';
        if (resultmessage.success) {
            document.getElementById('overlay2').style.display = 'none';
            document.getElementById('overlay').style.display = 'flex';
        }
    };

    popupContainer.appendChild(imageElement);
    popupContainer.appendChild(messageElement);
    popupContainer.appendChild(button);

    popup.appendChild(popupContainer);
    document.getElementById('overlay3').style.display = 'flex';
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