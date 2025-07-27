import { collegefee, Enrollfee, Otherfee } from './model.js';

document.addEventListener('submit', async function (event) {
  // Stop reload for all your forms:
  if (
    event.target.classList.contains('payment-form') ||
    event.target.classList.contains('enroll-form') ||
    event.target.classList.contains('other-fee-form')
  ) {
    event.preventDefault();

    const form = event.target;

    if (form.classList.contains('payment-form')) {
      const regNo = form.querySelector('input[readonly]').value;
   const academicYear = form.querySelector('#academicYearSelect')?.value;
   const feeType = form.querySelector('#feeTypeDropdown').value;
      const amount = form.querySelector('input[type="number"]').value;
    console.log(feeType)
      const feeresult = await collegefee(regNo, feeType, amount, academicYear);
      console.log('Payment form submitted:', feeresult);


   if(feeresult.success){
    showSuccessPopup()
form.reset();
  form.closest('.card-form').style.display = 'none';
  
   }else{
 if (feeresult.message.includes("Unauthorized")) {
    showSessionExpiredPopup(); // custom popup handler
  } else {
    const errorMsg = form.querySelector(".error-message");
          errorMsg.innerText = feeresult.message || "Failed to submit payment.";
          errorMsg.style.display = "block";
        }
   }
    }

    if (form.classList.contains('enroll-form')) {
  const feeType = form.querySelector('[name="feeType"]').value;
 const academicYear = form.querySelector('#academicYearSelect')?.value;

  const totalFee = form.querySelector('[name="totalFee"]').value;
 const regNo = form.querySelector('#regNo').value;
  const feeAmount = form.querySelector('[name="feeAmount"]').value;

  

  const model = await Enrollfee(regNo, feeType, feeAmount, academicYear, totalFee);


   if(model.success){
    showSuccessPopup()
form.reset();
  form.closest('.card-form').style.display = 'none';
  
   }else{
 if (model.message.includes("Unauthorized")) {
    showSessionExpiredPopup(); // custom popup handler
  } else {
    const errorMsg = form.querySelector(".errore-message");
          errorMsg.innerText = model.message || "Failed to submit payment.";
          errorMsg.style.display = "block";
        }
   }

  
}


    if (form.classList.contains('other-fee-form')) {
 const feeType = form.querySelector('[name="feetype"]').value;
 const regNo = form.querySelector('[name="regNo"]').value;
 const amount = form.querySelector('[name="feeAmount"]').value;
 
      const data = await Otherfee(regNo, feeType, amount);
  

   if(data.success){
    showSuccessPopup()
form.reset();
  form.closest('.card-form').style.display = 'none';
  
   }else{
 if (data.message.includes("Unauthorized")) {
    showSessionExpiredPopup(); // custom popup handler
  } else {
    const errorMsg = form.querySelector(".erroro-message");
          errorMsg.innerText = data.message || "Failed to submit payment.";
          errorMsg.style.display = "block";
        }
   }
    }
  }
});


function showSuccessPopup() {
  const popup = document.getElementById('successPopup');
  popup.style.display = 'block';
  setTimeout(() => {
    popup.style.display = 'none';
  }, 3000); // Hides after 3 seconds
}


function showSessionExpiredPopup() {
  const popup = document.getElementById('session-popup');
  popup.style.display = 'flex'; // or 'block' based on your CSS
}

document.getElementById('ton').addEventListener('click', () => {
  window.location.href = '/feeportal';
});