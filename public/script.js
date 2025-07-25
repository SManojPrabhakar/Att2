

let currentStep = 1;

function nextStep(step) {
    if (validateStep(currentStep)) {
        $('.step-' + currentStep).removeClass('active');
        currentStep = step + 1;
        updateProgress();
        $('.step-' + currentStep).addClass('active');
    }
}

function prevStep(step) {
    $('.step-' + currentStep).removeClass('active');
    currentStep = step - 1;
    updateProgress();
    $('.step-' + currentStep).addClass('active');
}

function updateProgress() {
    const progress = (currentStep - 1) * 50.00;
    $('.progress-bar').css('width', progress + '%').attr('aria-valuenow', progress);
}



function moveToNextField(currentInput, nextInputId) {
    // Get the length of the input value
    var inputValueLength = currentInput.value.length;

    // If the input value length is 1, move focus to the next input field
    if (inputValueLength === 1) {
        var nextInput = document.getElementById(nextInputId);
        if (nextInput) {
            nextInput.focus();
        }
    }
}


function validateStep(step) {
    let isValid = true;

    if (step === 1) {
        // Step 1 validation
        const state = $('#state').val();
        const collageType = $('#collageType').val();
        const Code = $('#Code').val();
        const collageName = $('#collageName').val();
        const collageEmail = $('#Email').val();
        const collageAddress = $('#collageAddress').val();
        const collageLandline = $('#collageLandline').val();
        const digi1=$('#digit1').val()
        const digi2=$('#digit2').val()
        const digi3=$('#digit3').val()
        const digi4=$('#digit4').val()
         const digi5=$('#digit5').val()
           const digi6=$('#digit6').val()
        if (!state || state === 'Select a state') {
            $('#collageStateError').text('Please select a state').css('color', 'red');
            isValid = false;
        } else {
            $('#collageStateError').text('');
        }

        if (!collageType || collageType === 'Select type') {
            $('#collageTypeError').text('Please select a collage type').css('color', 'red');
            isValid = false;
        } else {
            $('#collageTypeError').text('');
        }
    

        if (!Code) {
            $('#CodeError').text('Please enter college Code').css('color', 'red');
            isValid = false;
        } else {
            $('#CodeError').text('');
        }
        if (!collageName) {
            $('#collageNameError').text('Please enter college name').css('color', 'red');
            isValid = false;
        } else {
            $('#collageNameError').text('');
        }
      
        if (!digi1 && !digi2 && !digi3 && !digi4) {
            $('#otperror').text('Please enter the otp').css('color', 'red');
            isValid = false;
        } else {
            $('#collageCodeError').text('');
        }
        if (!collageAddress) {
            $('#collageAddressError').text('Please enter college address').css('color', 'red');
            isValid = false;
        } else {
            $('#collageAddressError').text('');
        }

        if (!collageLandline || collageLandline.toString().length !== 10) {
            // If collageLandline is falsy OR its string representation doesn't have exactly 10 characters
            $('#collageLandlineError').text('Please enter a valid 10-digit college landline or contact number').css('color', 'red');
            isValid = false;
          } else {
            $('#collageLandlineError').text('');
          }

    } else if (step === 2) {
        // Step 2 validation
       
        const Principal = $('#Principal').val();
        const mail = $('#mail').val();
        const imageUpload = $('#imageUpload').val();
     

        if (!Principal) {
            $('#PrincipalError').text('Please enter name').css('color', 'red');
            isValid = false;
        } else {
            $('#PrincipalError').text('');
        }
        if (!mail) {
            $('#mailError').text('Please enter name').css('color', 'red');
            isValid = false;
        } else {
            $('#mailError').text('');
        }
        if (!imageUpload) {
            $('#imageUploadError').text('Please select at least one image').css('color', 'red');
            isValid = false;
        } else {
            $('#imageUploadError').text('');
        }
     
        
    } 

    return isValid;
}

// Display selected images to the user
function handelImageUpload() {
    var input = document.getElementById('imageUpload');
    var selectedImage = document.getElementById('selectedImage');

    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            selectedImage.src = e.target.result;
        };

        reader.readAsDataURL(input.files[0]);
    }
}

function showOTP() {
    // Toggle the visibility of the OTP input fields
    var otpSection = document.querySelector('.otp');
    otpSection.style.display = 'flex'; // Use 'flex' to show the OTP inputs

    // Optionally, you can disable the "Verify" button after displaying OTP
    var verifyButton = document.querySelector('.btn-primary');
   
}











function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    var files = event.dataTransfer.files;
    handleFiles(files);
}
function handleFiles(files) {
    var container = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input').files;
    var imagePreviews = document.getElementsByClassName('img-preview');
    if (imagePreviews.length < 2) {
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.type.match('image.*')) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    var img = document.createElement('img');
                    img.src = event.target.result;
                    img.className = 'img-preview';
                    container.appendChild(img);

                    var removeIcon = document.createElement('span');
                    removeIcon.className = 'remove-icon';
                    removeIcon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                    removeIcon.addEventListener('click', function() {
                        img.remove();
                        removeIcon.remove() // Remove the container when remove icon is clicked
                       
                    })
                    container.appendChild(removeIcon);
                };
                reader.readAsDataURL(file);
            }
        }
    } else {
        alert('You can only upload 2 images.');
    }
}
/*function handleFiles(files) {
    var container = document.getElementById('drop-area');
    var imagePreviews = document.getElementsByClassName('img-preview');
    
    if (imagePreviews.length < 2) {
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.type.match('image.*')) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    var imgContainer = document.createElement('div');
                    imgContainer.className = 'img-container';
                    
                    var img = document.createElement('img');
                    img.src = event.target.result;
                    img.className = 'img-preview';
                    imgContainer.appendChild(img);
                    
                    var removeIcon = document.createElement('span');
                    removeIcon.className = 'remove-icon';
                    removeIcon.innerHTML = '&#10006;';
                    removeIcon.addEventListener('click', function() {
                        imgContainer.remove(); // Remove the container when remove icon is clicked
                    });
                    imgContainer.appendChild(removeIcon);
                    
                    container.appendChild(imgContainer);
                };
                reader.readAsDataURL(file);
            }
        }
    } else {
        alert('You can only upload 2 images.');
    }
}

function handleFiles(files) {
    var container = document.getElementById('drop-area');
    var imagePreviews = document.getElementsByClassName('img-preview');
    
    if (imagePreviews.length < 2) {
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.type.match('image.*')) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    var imgContainer = document.createElement('div');
                    imgContainer.className = 'img-container';

                    var img = document.createElement('img');
                    img.src = event.target.result;
                    img.className = 'img-preview';
                    imgContainer.appendChild(img);

                    // Add remove icon
                    var removeIcon = document.createElement('span');
                    removeIcon.className = 'remove-icon';
                    removeIcon.innerHTML = '&times;'; // Use '&times;' for the remove icon
                    removeIcon.addEventListener('click', function() {
                        imgContainer.remove(); // Remove the container when remove icon is clicked
                    });
                    imgContainer.appendChild(removeIcon);

                    container.appendChild(imgContainer);
                };
                reader.readAsDataURL(file);
            }
        }
    } else {
        alert('You can only upload 2 images.');
    }
}*/