import {
  Login,
  user,
  userdata,
  logout,
  searchlist,
  feetypelist,getYearlyFeeAmount
} from './model.js';

let students = [];
let selectedStudent = null;
let selectedYear = (() => {
  const currentYear = new Date().getFullYear();
  return `${currentYear}-${currentYear + 1}`;
})();

const currentYear = new Date().getFullYear();

const yearOptions = Array.from({ length: 6 }, (_, offset) => {
  const startYear = currentYear + offset;
  return `${startYear}-${startYear + 1}`;
});

const feeTypes = [
  { id: 1, title: 'College-fee' },
  { id: 2, title: 'Hostel-fee' },
  { id: 3, title: 'Transportation-fee' },
  { id: 4, title: 'Mess-fee' },
  { id: 5, title: 'Tuition-fee' },
  { id: 6, title: 'Development-fee' },
  { id: 7, title: 'Other' }
];

function updateFeeTypeDropdown(feeTypesList, dropdown) {
  const studentFeeTitles = feeTypesList.map(f => f.fee_type);
  const matchedOptions = feeTypes
    .filter(fee => studentFeeTitles.includes(fee.title))
    .map(fee => `<option value="${fee.title}">${fee.title}</option>`)
    .join("");

  dropdown.innerHTML = `
    <option value="" disabled ${matchedOptions ? "" : "selected"}>Select Fee Type</option>
    ${matchedOptions}
  `;
}

function generateYearOptions() {
  return yearOptions.map(year => {
    const isSelected = year === selectedYear ? "selected" : "";
    return `<option value="${year}" ${isSelected}>${year}</option>`;
  }).join("");
}

function renderPayFeeCard(student) {
  const container = document.getElementById("feeCardsContainer");
  const paymentCard = document.createElement("div");
  paymentCard.className = "fee-card highlight";

  paymentCard.innerHTML = `
    <div class="card-header toggle-payment">
      <h3>Pay Fee</h3>
      <span class="dropdown-icon" style="cursor: pointer;">&#9662;</span>
    </div>
    <div class="card-form" style="display: none;">
      <form class="payment-form">

      <div class="floating-label">
  <input type="text"  id="regNo"  value="${student.Regno}" readonly required />
  <label>Reg No</label>
</div>

        <div class="floating-label">
          <select id="academicYearSelect" required>
            <option value="" disabled ${!selectedYear ? "selected" : ""}>Select Academic Year</option>
            ${generateYearOptions()}
          </select>
        </div>
        <div class="floating-label">
          <select id="feeTypeDropdown" required></select>
        </div>
        <div class="floating-label">
          <input type="number" required />
          <label>Amount</label>
        </div>
        <p class="error-message text-danger" style="display:none; font-size: 0.9em;"></p>
        <button type="submit" class="submit-btn">Pay</button>
      </form>
    </div>
  `;

  container.prepend(paymentCard);

  const header = paymentCard.querySelector(".toggle-payment");
  const form = paymentCard.querySelector(".card-form");
  const icon = paymentCard.querySelector(".dropdown-icon");
  const feeTypeDropdown = paymentCard.querySelector("#feeTypeDropdown");
  const yearSelect = paymentCard.querySelector("#academicYearSelect");

  header.addEventListener("click", () => {
    const isVisible = form.style.display === "block";
    form.style.display = isVisible ? "none" : "block";
    icon.innerHTML = isVisible ? "&#9662;" : "&#9652;";
  });

  yearSelect.addEventListener("change", async function () {
    selectedYear = this.value;
    try {
      const updatedFees = await feetypelist(student.Regno, selectedYear);
      student.feeTypes = updatedFees || [];
      updateFeeTypeDropdown(student.feeTypes, feeTypeDropdown);
      renderFeeCards();
      const newPayCard = document.querySelector(".highlight .card-form");
      const newIcon = document.querySelector(".highlight .dropdown-icon");
      newPayCard.style.display = "block";
      newIcon.innerHTML = "&#9652;";
    } catch (err) {
      console.error("Failed to update fee types:", err);
    }
  });

  (async () => {
    try {
      const updatedFees = await feetypelist(student.Regno, selectedYear);
      student.feeTypes = updatedFees || [];
      updateFeeTypeDropdown(student.feeTypes, feeTypeDropdown);
    } catch (err) {
      console.error("Failed to fetch fee types on load:", err);
    }
  })();
}

function renderFeeCards() {
  const container = document.getElementById("feeCardsContainer");
  container.innerHTML = "";
  if (!selectedStudent) return;
  renderPayFeeCard(selectedStudent);

  const studentFeeTitles = selectedStudent.feeTypes.map(f => f.fee_type.trim().toLowerCase());

  feeTypes.forEach(fee => {
    if (studentFeeTitles.includes(fee.title.trim().toLowerCase())) return;

    const card = document.createElement("div");
    card.className = "fee-card";
    card.dataset.id = fee.id;
    const isOther = fee.title === "Other";
    const feeForm = isOther
      ? `
        <form class="other-fee-form">
          <div class="floating-label">
            <input type="text" name="regNo" value="${selectedStudent.Regno}" readonly required />
            <label>Reg No</label>
          </div>
          <div class="floating-label">
            <input type="text" name="feetype" />
            <label>Fee Type</label>
          </div>
          <div class="floating-label">
            <input type="number" name="feeAmount" required />
            <label>Fee Amount</label>
          </div>
          <p class="erroro-message text-danger" style="display:none; font-size: 0.9em;"></p>
          <button type="submit" class="submit-btn">Submit</button>
        </form>
      ` : `
        <form class="enroll-form">
          <div class="floating-label">
            <input type="text" name="feeType" value="${fee.title}" readonly />
            <label>Fee Type</label>
          </div>
            <div class="floating-label">
  <input type="text"  id="regNo"  value="${selectedStudent.Regno}" readonly required />
  <label>Reg No</label>
</div>
          <div class="floating-label">
            <select id="academicYearSelect" required>
              <option value="" disabled ${!selectedYear ? "selected" : ""}>Select Academic Year</option>
              ${generateYearOptions()}
            </select>
          </div>
          <div class="floating-label">
            <input type="number" name="totalFee" required />
            <label>Yearly Fee</label>
          </div>
          <div class="floating-label">
            <input type="number" name="feeAmount" required />
            <label>Fee Amount</label>
          </div>
          <p class="errore-message text-danger" style="display:none; font-size: 0.9em;"></p>
          <button type="submit" class="submit-btn">Submit</button>
        </form>
      `;

    card.innerHTML = `
      <div class="card-header">
        <h3>${fee.title}</h3>
        <button class="enroll-btn">Enroll</button>
      </div>
      <div class="card-form" style="display: none;">
        ${feeForm}
      </div>
    `;

    container.appendChild(card);
  });

  FeeEnrollModule.init();
}

const FeeEnrollModule = (() => {
  function toggleForm(event) {
    const button = event.currentTarget;
    const card = button.closest(".fee-card");
    const form = card.querySelector(".card-form");

    if (form.style.display === "block") {
      form.style.display = "none";
      button.textContent = "Enroll";
    } else {
      document.querySelectorAll(".card-form").forEach(f => f.style.display = "none");
      document.querySelectorAll(".enroll-btn").forEach(btn => btn.textContent = "Enroll");
      form.style.display = "block";
      button.textContent = "Close";
    }
  }

function init() {
  document.querySelectorAll(".enroll-btn").forEach(btn => {
    btn.removeEventListener("click", toggleForm);
    btn.addEventListener("click", async function (event) {
      toggleForm(event);

      const card = event.currentTarget.closest(".fee-card");
      const form = card.querySelector(".card-form");
      const feeTypeInput = form.querySelector('input[name="feeType"]');
      const totalFeeInput = form.querySelector('input[name="totalFee"]');

      const feeType = feeTypeInput?.value;
      const regno = selectedStudent?.Regno;

      // ✅ Always use previous year, ignore selected dropdown value
      const now = new Date();
      const prevYear = now.getFullYear() - 1;
      const academicYear = `${prevYear}-${prevYear + 1}`;

      if (feeType && academicYear && regno && totalFeeInput) {
        try {
          const yearlyAmount = await getYearlyFeeAmount(regno,  academicYear,feeType,);
          totalFeeInput.value = yearlyAmount.total;
        } catch (error) {
          console.error("Failed to fetch yearly amount:", error);
        }
      }
    });
  });
}



  return { init };
})();

$(document).ready(async function () {
  const $input = $("#regNo");
  const $suggestions = $("#studentSuggestions");
  const collegename = localStorage.getItem("collegename");

  try {
    students = await searchlist(collegename);
  } catch (err) {
    console.error("Failed to fetch student list:", err);
    return;
  }

  $input.on("input", function () {
    const query = $(this).val().toLowerCase();
    $suggestions.empty();
    if (query.length === 0) return;

    const matched = students.filter(
      s => s.Fullname.toLowerCase().includes(query) || s.Regno.toLowerCase().includes(query)
    );

    matched.forEach(student => {
      const profilePicUrl = student.Profilepic || 'default-profile.png';
      const item = $(`<li class="list-group-item list-group-item-action">
        <img src="${profilePicUrl}" alt="Profile" class="rounded-circle me-2" style="width: 40px; height: 40px;">
        ${student.Regno} ${student.Fullname}</li>`);

      item.on("click", async function () {
        selectedStudent = student;
        $input.val(`${student.Fullname} (${student.Regno})`);
        $suggestions.empty();

        try {
          const feeTypesData = await feetypelist(student.Regno, selectedYear);
          selectedStudent.feeTypes = feeTypesData || [];
        } catch (error) {
          console.error("Failed to fetch fee types for student:", error);
          selectedStudent.feeTypes = [];
        }

        renderFeeCards();
      });

      $suggestions.append(item);
    });
  });

  $(document).on("click", function (e) {
    if (!$(e.target).closest(".search-wrapper").length) {
      $suggestions.empty();
    }
  });
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