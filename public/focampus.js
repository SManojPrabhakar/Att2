 
  const pathParts = window.location.pathname.split('/');

  // Extract and decode parameters
  const collegeName = decodeURIComponent(pathParts[3]);
  const collegeCode = decodeURIComponent(pathParts[4]);

  // Store them in localStorage
  localStorage.setItem('collegename', collegeName);
  localStorage.setItem('collegecode', collegeCode);
  
  
  document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("lecturers-card").addEventListener("click", () => {
     window.location.href = `/campus/students/${"Lecturer"}/`;
  });

  document.getElementById("students-card").addEventListener("click", () => {
     window.location.href = `/campus/students/${"Student"}/`;
  });

  document.getElementById("admin-card").addEventListener("click", () => {
     window.location.href = `/campus/students/${"Admin"}/`;
  });
});



  window.onload = function() {
  var progressBar = document.querySelector('#loading .loader');
  
  var conten = document.getElementById('conten');

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