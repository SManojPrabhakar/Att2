import {Login,user, userdata
  ,logout,searchlist,dueslist,deactivatestudent} from './model.js';


    let selectedStudent = null;
  $(document).ready(async function () {
    const $input = $("#regNo");
    const $suggestions = $("#studentSuggestions");
    const collegename = localStorage.getItem("collegename");

    let students = [];
 

    try {
      students = await searchlist(collegename);
      console.log(students)
    } catch (err) {
      console.error("Failed to fetch student list:", err);
      return;
    }

    $input.on("input", function () {
      const query = $(this).val().toLowerCase();
      $suggestions.empty();

      if (query.length === 0) return;

      const matched = students.filter(
        s =>
          s.Fullname.toLowerCase().includes(query) ||
          s.Regno.toLowerCase().includes(query)
      );

      matched.forEach(student => {
        const item = $(`
          <li class="list-group-item list-group-item-action d-flex align-items-center">
            <img src="${student.Profilepic}" alt="Profile" class="rounded-circle mr-2" style="width: 40px; height: 40px;">
            ${student.Regno} - ${student.Fullname}
          </li>`);

        item.on("click", async function () {
          selectedStudent = student;
          $input.val(`${student.Fullname} (${student.Regno})`);
          $suggestions.empty();

          // Set basic details
          $("#studentPic").attr("src", student.Profilepic);
          $("#studentName").text(student.Fullname);
          $("#studentRegno").text(`${student.Regno}`);
          $("#studentYear").text(`Year: ${student.Year || 'N/A'}`);
          $("#studentSemester").text(`Sem: ${student.Sem || 'N/A'}`);
          $("#studentCourse").text(`Course: ${student.Course || 'N/A'}`);
          $("#studentSection").text(`Section: ${student.Section || 'N/A'}`);

          try {
            const feedues = await dueslist(student.Regno);
            selectedStudent.feeTypes = feedues.message || [];
          } catch (error) {
            console.error("Failed to fetch fee types for student:", error);
            selectedStudent.feeTypes = [];
          }

          // Format and show dues
          const feeDuesHtml =
            selectedStudent.feeTypes.length > 0
              ? `<h5 class="mt-3">Fee Due List</h5>` +
                selectedStudent.feeTypes
                  .map(
                    fee =>
                      `<p>${fee.Fee_type}: ₹${fee.Fee_due} (${fee.Fee_year})</p>`
                  )
                  .join("")
              : "<p>No dues</p>";

          $("#feeDues").html(feeDuesHtml);
          $("#studentDetails").show();

          // Handle Deactivate button visibility
          if (selectedStudent.feeTypes.length > 0) {
            $("#confirmDeactivateContainer").show();
            $("#confirmDeactivate").prop("checked", false);
            $("#deactivateBtn").prop("disabled", true);
          } else {
            $("#confirmDeactivateContainer").hide();
            $("#deactivateBtn").prop("disabled", false);
          }
        });

        $suggestions.append(item);
      });
    });

    // Enable/disable deactivate button based on checkbox
    $("#confirmDeactivate").on("change", function () {
      $("#deactivateBtn").prop("disabled", !this.checked);
    });

    // Close suggestions on click outside
    $(document).on("click", function (e) {
      if (!$(e.target).closest(".search-wrapper").length) {
        $suggestions.empty();
      }
    });
  });


  $("#deactivateBtn").on("click", async function () {
  if (!selectedStudent) return;

  try {
    
    const result = await deactivatestudent(selectedStudent.Regno);
if (result.success) {
  showPopup(result.message);
  $("#studentDetails").hide();
  $("#regNo").val('');
} else {
  if (result.message.includes("Unauthorized")) {
    showSessionExpiredPopup();
  } else {
    showDeactivateError(result.message);
  }
}
  } catch (error) {
    console.error("Deactivation error:", error);
    alert("An error occurred while deactivating the student.");
  }
});


function showDeactivateError(message) {
  const errorDiv = document.getElementById('deactivateErrorMsg');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';

  // Optional: hide after 5 seconds
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}


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
  var password = document.getElementById('passwordl');
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
    console.log(result);

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
    if (userData.message.Role !== "Admin") {
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
    if (userData.message.Role === "Admin") {
      updateUIOnLogin(userData);
    } else {
      updateUIOnLogout();
    }
  } else {
    updateUIOnLogout();
  }
}
loginstatus();

document.getElementById('eyeSlash').addEventListener('click', function () {
  var passwordInput = document.getElementById('passwordl');
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
  
  var conten = document.getElementById('content');

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