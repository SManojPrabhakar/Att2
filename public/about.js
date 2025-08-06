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

