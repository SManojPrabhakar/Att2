
import { Login,user, userdata
    ,logout,collegenames,verificationt,userlog,rightt,founderlog, } from './model.js';
  
  let timeInSeconds
  let countdownInterval
  
  
  
 
  /*
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
   */
  

  /*
  
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
  
  */
  /*
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
    showSignedInPopup(done);
    resetFormFields(); 

    }else{
       checkError.innerHTML=done.message
    }
        
        
        }
    
  });


function resetFormFields() {
    // Reset form inputs
    document.getElementById("Administration").value = "Select role";
    document.getElementById("collagesele").value = "Select College";
    document.getElementById("fullname").value = "";
    document.getElementById("Email").value = "";
    document.getElementById("pasword").value = "";
    document.getElementById("confirmpassword").value = "";
    document.getElementById("unqcode").value = "";
    document.getElementById("Id").value = "";
    document.getElementById("agree").checked = false;

    // Reset OTP fields
    for (let i = 1; i <= 6; i++) {
        let otpInput = document.getElementById(`digit${i}`);
        if (otpInput) otpInput.value = "";
    }

    // Hide OTP section
    const otpSection = document.querySelector('.otp');
    if (otpSection) otpSection.style.display = 'none';

    // Disable the verify button
    const verifyButton = document.getElementById("verifyButton");
    if (verifyButton) verifyButton.disabled = true;

    // Clear errors if needed
    const errorFields = document.querySelectorAll('span[id$="Error"]');
    errorFields.forEach(span => span.innerHTML = "");
}

  
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
*/
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