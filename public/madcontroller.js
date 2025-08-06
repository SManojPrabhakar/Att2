
import { recentregister,Login,user, userdata
  ,logout,collegenames,verificationt,userlog,rightt,founderlog } from './model.js';

let timeInSeconds
let countdownInterval
async function displayRecentRegistrations() {
  try {
    const collages = await recentregister();
    const cardContainer = document.getElementById('card');
    
    if (collages.message) {
      const messageCard = document.createElement('div');
      messageCard.className = 'card message';
      messageCard.innerHTML = '<p>No recent registrations found</p>';
      cardContainer.appendChild(messageCard);
    } else {
      
      cardContainer.innerHTML = '';
      collages.forEach(collage => {
      
        // Create a card element
        const card = document.createElement('div');
        card.className = 'card';

        // Create an image element
        const image = document.createElement('img');
        //image.src = collage.imageUrl; // Set the image source

        // Create a paragraph element for the collage name
        const collageName = document.createElement('p');
        collageName.textContent = collage.collage_name;

        // Append the image and collage name to the card
        card.appendChild(image);
        card.appendChild(collageName);
       
        // Append the card to the card container
        cardContainer.appendChild(card);
       
      });
      




    }
  } catch (error) {
    // Handle errors if needed
    console.log('Error getting recent registrations:', error.message);
  }
}

displayRecentRegistrations(); 


document.getElementById('loged').addEventListener('click', async function () {
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const passwordError = document.getElementById('passwordError');
  const usernameError = document.getElementById('usernameError');

  // Clear previous errors
  passwordError.style.display = "none";
  usernameError.style.display = "none";

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

    const result = await Login(username.value.trim(), password.value.trim());

    if (!result.success) {
      if (result.message === 'Invalid password or email') {
        passwordError.style.display = "block";
        passwordError.innerHTML = "Invalid username or password.";
      } else {
        passwordError.style.display = "block";
        passwordError.innerHTML = result.message || "Login failed.";
      }
      return;
    }

    // Success: login logic
    window.location.reload();
    updateUIOnLogin();

  } catch (error) {
    console.error("Error:", error);
    passwordError.style.display = "block";
    passwordError.innerHTML = "An unexpected error occurred. Please try again.";
  }
});


 

document.getElementById('xmark').addEventListener('click', async function(){
  document.getElementById("overlay").style.display = "none";
})

document.getElementById('xmark2').addEventListener('click', async function(){
  document.getElementById("overlay2").style.display = "none";
})
          // Add this in your <script> tag or external JavaScript file (e.g., madcontroller.js)
/*
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
          })*/

          document.getElementById('register').addEventListener('click', function() {
            window.location.href = 'registration';
        });

       

async function updateUIOnLogin() {

  const result=await userdata()
  localStorage.setItem('code', result.message.Code);
  localStorage.setItem('collegename', result.message.College_name);
  if (
    result.message === "Unauthorized: Token expired" ||
    result.message === "Unauthorized: Invalid token" ||
    result.message === "Unauthorized: Token verification failed"
  ) {
    document.getElementById('age').style.display='inline-block'
    document.getElementById('login').style.display='inline-block'
    document.getElementById('signup').style.display='inline-block'
    document.getElementById('down').style.display = 'none';
  
    document.getElementById('Image').style.display = 'none';
    document.getElementById('studentreg').style.display = 'none';

    document.getElementById('register').style.display = 'none';
    document.getElementById('register').style.display = 'none';
    username.style.display = 'none';
    document.getElementById("session-popup").style.display = "flex";
    return;
  }else{
 
  document.getElementById('age').style.display='none'
  document.getElementById('login').style.display='none'
  document.getElementById('signup').style.display='none'

  var contactus = document.getElementById("contactus");
  contactus.parentNode.removeChild(contactus);
  
  document.getElementById('down').style.display = 'inline-block';
  
 
switch (result.message.Role) {
  case 'Founder':
    document.getElementById('register').style.display = 'inline-block';
     document.getElementById('feeportal').style.display='none'
     document.getElementById('colleges').style.display='inline-block'
    break;
  case 'Student':
    // Hide register button or do something specific for Student
     document.getElementById('feeportal').style.display='none'
    document.getElementById('register').style.display = 'none';
    document.getElementById('studentstuff').style.display='inline-block'
    document.getElementById('academics').style.display='none'
      
    break;

case 'Admin':
  const designation = result.message.Desigination;

  // Hide all admin-related sections initially
  document.getElementById('register').style.display = 'none';
  document.getElementById('academics').style.display = 'none';
  document.getElementById('colleges').style.display = 'none';

  // List of designations that get Principal-level access
  const principalLevel = [
    "Chancellor",
    "Vice Chancellor",
    "Director",
    "Dean",
    "Principal",
    "Vice Principal"
  ];

  if (principalLevel.includes(designation)) {
    // Show buttons for Principal-level admins
    document.getElementById('feeportal').style.display = 'none';
    document.getElementById('studentreg').style.display = 'none';
    document.getElementById('academics').style.display = 'inline-block';
    document.getElementById('campus').style.display = 'inline-block';
    document.getElementById('deactivate').style.display = 'none';
  } else {
    // Show standard Admin access
    document.getElementById('feeportal').style.display = 'inline-block';
    document.getElementById('studentreg').style.display = 'inline-block';
    document.getElementById('campus').style.display = 'none';
    document.getElementById('deactivate').style.display = 'inline-block';
  }

  break;

case 'Lecturer':
  const lecDesignation = result.message.Desigination;

  if (lecDesignation === 'HOD') {
    // Show Principal-level screens
    document.getElementById('academics').style.display = 'inline-block';
    document.getElementById('campus').style.display = 'inline-block';
    document.getElementById('deactivate').style.display = 'none';
    document.getElementById('register').style.display = 'none';
    document.getElementById('colleges').style.display = 'none';
    document.getElementById('studentstuff').style.display = 'none';
  } else {
    // Regular Lecturer
    document.getElementById('academics').style.display = 'inline-block';
    document.getElementById('colleges').style.display = 'none';
    document.getElementById('register').style.display = 'none';
    document.getElementById('studentstuff').style.display = 'none';
    document.getElementById('campus').style.display = 'none';
    document.getElementById('deactivate').style.display = 'none';
  }
  break;

  default:
    // Handle unknown roles
    document.getElementById('register').style.display = 'none';
    break;
}

  const username=document.getElementById('userame')

  username.style.display = 'inline-block';
username.innerText=result.message.Fullname;
document.getElementById('Image').src = result.message.profilepic;

const iconElement = document.createElement('i');
    iconElement.className = 'fas fa-caret-down';
    username.appendChild(iconElement);
  setTimeout(function () {
    document.getElementById("overlay").style.display = "none";
  }, 2000);
  
}
}

 document.getElementById('ton').addEventListener('click', async function(){
  
    const result= await logout()
  
    if(result.message ==="logged out"){
      window.location.reload(); 
    updateUIOnLogout()
   
    }
  })

  document.getElementById('logout').addEventListener('click', async function(){
  
    const result= await logout()
  
    if(result.message ==="logged out"){
      window.location.reload(); 
    updateUIOnLogout()
   
    }
  })

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


   document.getElementById('eyeSlash3').addEventListener('click',async function(){
              var passwordInput = document.getElementById('password');
              var eyeSlashIcon = document.getElementById('eyeSlash3');
            
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



/*
  
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
    Image.height = 40;
    Image.width = 40;

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

async function loginstatus(){
  const result=await user()
  if (result.success) {
  
    updateUIOnLogin();
 
   
  } else {
   
    updateUIOnLogout();
  
  }
  
  }

  loginstatus()

// Function to update UI on logout
function updateUIOnLogout() {

  document.getElementById('login').style.display = 'inline-block';

  document.getElementById('down').style.display = 'none';
  document.getElementById('Image').style.display = 'none';
  document.getElementById('register').style.display = 'none';
  document.getElementById('userame').style.display = 'none';
  document.querySelector('.dropdown-content').style.display = 'none';

}





document.getElementById('userame').addEventListener('click', async function(){
  var dropdownContent = document.querySelector('.dropdown-content');

  // Toggle the display property between 'none' and 'block'
  if (dropdownContent.style.display === 'none' || dropdownContent.style.display === '') {
      dropdownContent.style.display = 'block';
  } else {
      dropdownContent.style.display = 'none';
  }
})








function showSignedInPopup(resultmessage) {
  var popup = document.querySelector('.overlay-content3 .popup');
 
  if(resultmessage.success){
 
        
  // Create elements for message and image
  var messageElement = document.createElement('p');
  messageElement.textContent = resultmessage.message;

  var imageElement = document.createElement('img');
  imageElement.src = 'im.png';

  var button = document.createElement('button');
  button.textContent = 'Login';
  button.style.alignContent='center'
  button.onclick = function() {
    // Close the popup or perform necessary action
    document.getElementById('overlay3').style.display = 'none';
    document.getElementById('overlay2').style.display = 'none';
    document.getElementById('overlay').style.display = 'flex';
  };

  popup.innerHTML = '';

  // Append message and image to the popup
  popup.appendChild(imageElement);
  popup.appendChild(messageElement);
 popup.appendChild(button);

  // Display the overlay
  document.getElementById('overlay3').style.display = 'block';
}else{
  
        
  // Create elements for message and image
  var messageElement = document.createElement('p');
  messageElement.textContent = resultmessage.message;

  var imageElement = document.createElement('img');
  imageElement.src = 'wrong.jpg';

  var closeButton = document.createElement('button');
  closeButton.textContent = 'Close';

  closeButton.onclick = function() {
    // Close the popup or perform necessary action
    document.getElementById('overlay3').style.display = 'none';
  };
  // Clear existing content
  popup.innerHTML = '';

  // Append message and image to the popup
  popup.appendChild(imageElement);
  popup.appendChild(messageElement);

  popup.appendChild(closeButton);
  // Display the overlay
  document.getElementById('overlay3').style.display = 'block';
}
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