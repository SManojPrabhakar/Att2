
import { recentregister,Login,user, userdata
  ,logout,collegenames,verification,userlog,right,founderlog } from './model.js';

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

  if (designation === 'Principal') {
    // Hide buttons meant for other admins if needed
    document.getElementById('feeportal').style.display = 'none';
    document.getElementById('studentreg').style.display = 'none';
     document.getElementById('academics').style.display = 'inline-block';
    document.getElementById('campus').style.display = 'inline-block';
   document.getElementById('deactivate').style.display = 'none';
  } else {
    // Buttons for non-principal Admins
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