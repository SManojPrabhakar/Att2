/*router.get('/search/students/', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const Id=req.body.Id
        const query = 'SELECT Id,Fullname,year,course,profilepic, FROM student where id="1256"';
  
        // Use the connection pool to get a connection
        const connection = await pool.getConnection();
  
        // Execute the query using the connection
        const [result] = await connection.query(query); // Destructuring the result to access rows directly
  
        // Release the connection back to the pool
        connection.release();
  
     
      
            res.send(result); // Sending rows
        
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            const errorMessage = 'Your session has expired. Please log in again.';
            return res.status(401).json({ success: false, message: errorMessage });
        }
            else{
        res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
    }
  });


  router.get('search/lecturer/', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const Id=req.body.Id
        const query = 'SELECT * FROM student_attendance where id="1256"';

        const decodedToken = jwt.verify(token, secretKey);
        
        // Check if the token has expired
        const isExpired = Date.now() >= decodedToken.exp * 1000;
        if (isExpired) {
            const errorMessage = 'Your session has expired. Please log in again.';
            return res.status(401).json({ success: false, message: errorMessage });
        }
        // Use the connection pool to get a connection
        const connection = await pool.getConnection();
  
        // Execute the query using the connection
        const [result] = await connection.query(query,[Id]); // Destructuring the result to access rows directly
  
        // Release the connection back to the pool
        connection.release();
  
     
      
            res.send(result); // Sending rows
        
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            const errorMessage = 'Your session has expired. Please log in again.';
            return res.status(401).json({ success: false, message: errorMessage });
        }
            else{
        res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
    }
  });



  //updating the student attendance table by adding date to the json column 
//First class attendance query updating date and single subject in single query
//checked successfully
router.patch("/date/s1/f1/", async (req, res) => {
    const collagecode = req.body.Collegename;
    const id = req.body.Id;
    const Sem = req.body.Semester;
    const Section = req.body.Section;
    const dat = req.body.Date;
    const Course =req.body.Course;
    const Year=req.body.Year
    const connection = await pool.getConnection();
    try {
      
      await connection.beginTransaction();
  
      // Updating student attendance table
      await connection.query(`UPDATE student_attedance INNER JOIN students ON student_attedance.Regno=students.Regno SET Attendance = JSON_SET(Attendance, CONCAT(\'$."\',?, \'"\'), JSON_OBJECT()) WHERE students.college_name=? AND students.Year=? AND students.Section=? AND students.Sem=? AND students.Course=?`, [dat, collagecode, Year, Section, Sem, Course]);
  
      // Updating lecturer attendance table
      await connection.query('UPDATE Lecturer_attendance INNER JOIN lecturer ON lecturer_attendance.Regno=lecturer.Regno  SET Attendance = JSON_SET(Attendance, CONCAT(\'$."\',?, \'"\'), JSON_OBJECT()) WHERE lecturer_attendance.Regno=? AND lecturer.College_name=?', [dat, id, collagecode]);
  
      await connection.commit();
      connection.release();
  
      res.status(200).json({Success:"true", Message:"Autodate update"});
    } catch (error) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      return res.status(500).json({Success:"false", error: error.message });
    }
  });
  
  
  router.patch("/attendance/backup/", async (req, res) => {
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token is missing' });
    }
  
    try {
      const decoded = jwt.verify(token, secretKey);
      const { Regno } = decoded;
  
      // Check if the token has expired
      const isExpired = Date.now() >= decoded.exp * 1000;
      if (isExpired) {
        const errorMessage = 'Your session has expired. Please log in again.';
        return res.status(401).json({ success: false, message: errorMessage });
      }
  
      const connection = await pool.getConnection();
  
      try {
        await connection.beginTransaction();
  
        // Updating student attendance table
        await connection.query(
          `UPDATE student_attedance SET total=0, attended=0, Attendance_backup = Attendance WHERE Regno = ?`, 
          [Regno]
        );
  
        // Assuming the 'lecturer attendance' update logic, here's a sample query
        await connection.query(
          `UPDATE student_attedance SET Attendance_backup = Attendance, Attendance = JSON_OBJECT() WHERE Regno = ?`,
          [Regno]
        );
  
        await connection.commit();
        connection.release();
  
        res.status(200).json({ success: true, message: "Restored Successfully" });
      } catch (error) {
        if (connection) {
          await connection.rollback();
          connection.release();
        }
        console.error('Database transaction error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
      }
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      } else {
        console.error('JWT Verification error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
      }
    }
  });
  
  //adding single subject
  router.patch("/classdate/f1/s1", async (req, res) => {
      const date = req.body.Date;
      const Id = req.body.Id;
      const Year = req.body.Year;
      const Semester = req.body.Semester;
      const Course = req.body.Course;
      const Ids = req.body.Ids;
      const Collageid = req.body.Collegename;
      const Section = req.body.Section;
      const Subject = req.body.Subject;
      const Taken = req.body.Taken;
      const connection = await pool.getConnection();
      try {
        console.log(Collageid,Id,Semester,Section,date,Course,Year,Taken,Subject,Ids)
        await connection.beginTransaction();
    
        // Updating student attendance table
        await connection.query('UPDATE student_attedance SET Attended=Attended+1, Attendance = JSON_SET(Attendance, CONCAT(\'$."\',?, \'"\'), JSON_OBJECT(?,?)) WHERE Regno IN(?)', [date, Subject, Taken, Ids]);
    
        // Updating lecturer attendance table
        await connection.query(`UPDATE student_attedance
        JOIN students ON student_attedance.Regno = students.Regno
        SET student_attedance.Total = student_attedance.Total+1
        WHERE students.college_name = ? AND students.Year = ? AND students.Section = ? AND students.Sem = ? AND students.Course = ?`, [Collageid, Year, Section, Semester, Course]);
  
        const query = `
        UPDATE Lecturer_attendance SET Total = Total + 1,
            Attendance = JSON_SET(
                Attendance,
                '$."${date}"."${Year}"',
                JSON_OBJECT(
                    '${Section}', JSON_OBJECT(
                        '${Course}', JSON_OBJECT('${Subject}','${Taken}'
                            )
                        )
                    )
                )
            
        WHERE Regno = ?;
    `;
  
    await connection.query(query, [Id]);
        
        await connection.commit();
        connection.release();
    
        res.status(200).json({success:"true", message:"Autodate update"});
      } catch (error) {
        if (connection) {
          await connection.rollback();
          connection.release();
        }
        return res.status(500).json({success:"false", error: error.message });
      }
    });
    
  
  //multiple subjects
    router.patch("/update/classes/same/f1/s1/", async (req, res) => {
      const date = req.body.Date;
      const Ids = req.body.Ids;
      const Id = req.body.Id;
      const Collageid = req.body.Collageid;
      const Year = req.body.Year;
      const Course = req.body.Course;
      const Semester = req.body.Semester;
      const Section = req.body.Section;
      const Subject = req.body.Subject;
      const Taken = req.body.Taken;
      const connection = await pool.getConnection();
      try {
        
        await connection.beginTransaction();
    
        // Updating student attendance table
        await connection.query('UPDATE student_attedance SET Attended=Attended+1, Attendance = JSON_SET(Attendance, CONCAT(\'$."\', ?, \'".\', ?), \'?\') WHERE id IN(?)',
        [date, Subject, Taken, Ids]);
    
        // Updating lecturer attendance table
        await connection.query('UPDATE Lecturer_attendance SET Total=Total+1, Attendance = JSON_SET(Attendance, ?, ?) WHERE id = ?',
        [`$."${date}"."${Year}".${Section}.${Course}.${Subject}`, Taken, Id],);
  
        await connection.query(`UPDATE student_attedance
        JOIN students ON student_attedance.id = students.id
        SET student_attedance.Total = student_attedance.Total+1
        WHERE students.college_name = ? AND students.Year = ? AND students.Section = ? AND students.Sem = ? AND students.Course = ?`,
        [Collageid, Year, Section, Semester, Course]);
        
        await connection.commit();
        connection.release();
    
        res.status(200).json({Success:"true", Message:"Autodate update"});
      } catch (error) {
        if (connection) {
          await connection.rollback();
          connection.release();
        }
        return res.status(500).json({Success:"false", error: error.message });
      }
    });
     
       
    
  
      
     
  
    
    router.get("/attendance/s1/", async (req, res) => {
      try {
        const token = "madmax1@gmail.com"
  
        if (!token) {
          return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
        }
    
        /*const decoded = jwt.verify(token, secretKey);
        const { email } = decoded;
  
          const query = "SELECT t1.fullname, t1.Profile, t2.* FROM students t1 JOIN student_attedance t2 ON t1.Regno = t2.Regno WHERE t1.Email= ? AND (t1.Active IS NULL OR t1.Active = 1)";
  
          // Use the connection pool to get a connection
          const connection = await pool.getConnection();
  
          // Execute the query using the connection
          const [result] = await connection.query(query,[token]);
  
          // Release the connection back to the pool
          connection.release();
  
          // Format the response
          const formattedResult = await Promise.all(result.map(async student => {
              const { Attendance, Profile, ...rest } = student;
              const attendanceDetails = [];
  
              // Process the attendance details
              for (const [date, subjects] of Object.entries(Attendance)) {
                  const subjectsList = [];
                  for (const [subject, count] of Object.entries(subjects)) {
                      subjectsList.push({ subject, count });
                  }
                  attendanceDetails.push({ date, subjects: subjectsList });
              }
  
              // Fetch the profile image from S3
              const profileParams = {
                  Bucket: 'add-imag',
                  Key: Profile,
              };
  
              const profileUrl = await s3.getSignedUrlPromise('getObject', profileParams);
  
              return { ...rest, profileUrl, attendanceDetails };
          }));
  
          res.status(200).json({ success: true, message: formattedResult });
      } catch (error) {
          console.error('Error executing query:', error);
          res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
  });
  
  
  
  
    router.get('/getattendance/', async (req, res) => {
      try {
          const query = "SELECT t1.Id, t1.Profile, t1.fullname, t2.Attendance,t2.total,t2.Attended FROM students t1 JOIN student_attedance t2 ON t1.id = t2.id  WHERE t1.id='1236' And t1.College_code='Ciet'";
    
          // Use the connection pool to get a connection
          const connection = await pool.getConnection();
    
          // Execute the query using the connection
          const [result] = await connection.query(query); // Destructuring the result to access rows directly
    
          // Release the connection back to the pool
          connection.release();
    
       
        
          res.status.apply(200).json(result); // Sending rows
          
      } catch (error) {
          console.error('Error executing query:', error);
          res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
    });
    
    
          
  router.get('/AttendanceSheet/', async (req, res) => {
    try {
        const query = "SELECT t1.Id, t1.fullname, t1.profile  FROM students AS t1  WHERE t1.course='EEE' AND t1.Year='4' AND t1.Section='A' AND t1.college_code='Ciet'";
  
        // Use the connection pool to get a connection
        const connection = await pool.getConnection();
  
        // Execute the query using the connection
        const [result] = await connection.query(query); // Destructuring the result to access rows directly
  
        // Release the connection back to the pool
        connection.release();
  
     
      
        res.status.apply(200).json(result); // Sending rows
        
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });
  
  /*document.getElementById('Email').addEventListener('input', async function() {
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
      $('#EmailError').text('').css('color', 'red');
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

 async function hello(){
  const num1Input = document.getElementById('digit1');
  const num2Input = document.getElementById('digit2');
  const num3Input = document.getElementById('digit3');
  const num4Input = document.getElementById('digit4');
  const num5Input = document.getElementById('digit5');
  // Store all input elements in an array
  const inputElements = [num1Input, num2Input, num3Input, num4Input,num5Input];
  
  inputElements.forEach(input => {
    input.addEventListener('input', () => {
     
      otp(num1Input.value, num2Input.value, num3Input.value, num4Input.value,num5Input.value);
    });
  });
  }
  
  async function otp(num1, num2, num3, num4, num5) {
    var combinedValue = num1 + num2 + num3 + num4 +num5;
  
    // Check if the combined value has a length of 4
    if (combinedValue.length === 5) {
      const result = await right(combinedValue);
      console.log(result);
   if(result.success === 'OTP verification successful'){
        const otpResultContainer = document.getElementById('otpResult');
        const successImage = document.createElement('img');
                  successImage.src = 'project/im.png'; 
                  successImage.alt = 'Success Image';
                  successImage.height=50;
                  successImage.width=50;
        otpResultContainer.appendChild(successImage);
        document.getElementById('subsignup').disabled = false;
      }
    else{
    
      const otpResultContainer = document.getElementById('otpResult');
      const successImage = document.createElement('img');
                  successImage.src = 'project/wrong.icon.free.vector.jpg'; 
                  successImage.alt = 'Success Image';
                  successImage.height=50;
                  successImage.width=50;
        otpResultContainer.appendChild(successImage);
      document.getElementById('nxt').disabled = true;
    }
    setTimeout(function () {
      const otpResultContainer = document.getElementById('otpResult');
      otpResultContainer.innerHTML = "";
    }, 5000); // Adjust the delay as needed
  }
  }
  
 document.getElementById('verifyButton').addEventListener('click', async function verify() {
  try {
    var emailInput = document.getElementById('Email').value;
    timeInSeconds=30
    startCountdown()
showOTP()
const result = await verification(emailInput);
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
    const Gaurdian=document.getElementById('Gaurdian')
    const GaurdianError=document.getElementById('GaurdianError')
    const Gaurdians=document.getElementById('Gaurdians')
    const Year=document.getElementById('Year')
    const YearError=document.getElementById('YearError')
    const Course=document.getElementById('Course')
    const CourseError=document.getElementById('CourseError')
    const Gender=document.getElementById('Gender')
    const GenderError=document.getElementById('GenderError')
    const Section=document.getElementById('Section')
    const SectionError=document.getElementById('SectionError')
    // Get the value of the selected option
    const selectedValue = selectedOption.value;
    switch (selectedValue) {
      case "Student":
        college.style.display = 'block';
        Roll.style.display = 'inline-block';
        Rolllabel.style.display = 'inline-block';
        RollError.style.display = 'inline-block';
        GaurdianError.style.display = 'inline-block';
        Gaurdian.style.display = 'inline-block';
        Gaurdians.style.display = 'inline-block';
        Gender.style.display='inline-block';
        GenderError.style.display='inline-block';
        Course.style.display='inline-block';
        CourseError.style.display='inline-block';
        Year.style.display="inline-block";
        YearError.style.display='inline-block';
        Section.style.display='inline-block';
        SectionError.style.display='inline-block';
        collage_name();
        break;
      case "Lecturer":
        Year.style.display = 'none';
        YearError.style.display='none';
        Section.style.display = 'none';
        SectionError.style.display='none';
        GaurdianError.style.display = 'none';
        Gaurdian.style.display = 'none';
        Gaurdians.style.display = 'none';
        college.style.display = 'block';
        Roll.style.display = 'inline-block';
        Rolllabel.style.display = 'inline-block';
        RollError.style.display = 'inline-block';
        Gender.style.display='none';
        GenderError.style.display='none';
        Course.style.display='none';
        CourseError.style.display='none';
        collage_name();
        break;
        case "Admin":
          Year.style.display = 'none';
          YearError.style.display='none';
          Section.style.display = 'none';
          SectionError.style.display='none';
          GaurdianError.style.display = 'none';
          Gaurdian.style.display = 'none';
          Gaurdians.style.display = 'none';
          college.style.display = 'block';
          Roll.style.display = 'inline-block';
          Rolllabel.style.display = 'inline-block';
          RollError.style.display = 'inline-block';
          Gender.style.display='none';
          GenderError.style.display='none';
          Course.style.display='none';
          CourseError.style.display='none';
          collage_name();
          break;
        case "Founder":
        Year.style.display = 'none';
        Section.style.display = 'none';
        GaurdianError.style.display = 'none';
        Gaurdians.style.display='none'
        Gaurdian.style.display = 'none';
        YearError.style.display='none'
        college.style.display = 'block';
        Roll.style.display = 'none';
        Rolllabel.style.display = 'none';
        RollError.style.display = 'none';
        Gender.style.display='none';
        GenderError.style.display='none';
        Course.style.display='none';
        CourseError.style.display='none';
        YearError.style.display='none';
        SectionError.style.display='none';
        collage_name();
        break;
      default:
        // Handle default case if needed
        break;
    }
    
       
});
 

async function collage_name() {
  try {
      // Call the collegenames function to get the results
      const res = await collegenames();
     
      // Get the select element
      const selectElement = document.getElementById('collagesele');
      
      // Clear any existing options
      selectElement.innerHTML = '';
      // If no colleges are registered
      if (res.message === "college is not registered") {
          const option = document.createElement('option');
          option.value = ''; // Set the value of the option to empty string or whatever is appropriate
          option.textContent = '--No college registered--'; // Set the text content of the option
          selectElement.appendChild(option); // Append the option to the select element
      } else {
          // Create and append new options based on the result data
          res.forEach(college => {
              const option = document.createElement('option');
              option.value = college.college_name; // Set the value of the option
              option.textContent = college.college_name; // Set the text content of the option
              selectElement.appendChild(option); // Append the option to the select element
          });
      }
  } catch (error) {
      console.error('Error:', error);
      // Handle error
  }
}


document.getElementById('login').addEventListener('click', function(){
  document.getElementById("overlay").style.display = "flex";
})


document.getElementById('signup').addEventListener('click', function(){
  document.getElementById("overlay2").style.display = "flex";
})
*/


document.getElementById('loged').addEventListener('click', async function () {
  // Get form elements
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const passwordError = document.getElementById('passwordError');
  const usernameError = document.getElementById('usernameError');

  // Clear previous errors
  passwordError.innerHTML = "";
  usernameError.innerHTML = "";

  try {
    // Input validation
    if (!username.value.trim()) {
      usernameError.style.display = "block"; 
      usernameError.innerHTML = "Username is required.";
      return; // Stop further execution
    }

    if (!password.value.trim()) {
      passwordError.style.display = "block"; 
      passwordError.innerHTML = "Password is required.";
      return; // Stop further execution
    }

    // Call the login function
    const result = await Login(username.value.trim(), password.value.trim());

    // Handle response
    if (result.message === 'Authentication error') {
      passwordError.innerHTML = "Invalid username or password.";
    } else {
      // Successful login
      window.location.reload(); // Refresh page
      updateUIOnLogin(); // Update UI logic (if any)
    }
  } catch (error) {
    // Log and display unexpected errors
    console.error("Error:", error);
    passwordError.innerHTML = "An unexpected error occurred. Please try again.";
    passwordError.style.display = "block"; 
  }
});



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

          document.getElementById('register').addEventListener('click', function() {
            window.location.href = 'registration';
        });

       

async function updateUIOnLogin() {

  const result=await userdata()
 
  document.getElementById('age').style.display='none'
  document.getElementById('login').style.display='none'
  document.getElementById('signup').style.display='none'
  var contactus = document.getElementById("contactus");
  contactus.parentNode.removeChild(contactus);
  
  document.getElementById('down').style.display = 'inline-block';
  
  document.getElementById('Image').style.display = 'inline-block';
if(result.message.Role==='Founder'){
  document.getElementById('register').style.display = 'inline-block';
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







/*document.getElementById('subsignup').addEventListener('click', async function () {

  var Administration = document.getElementById("Administration").value;
  var collegename = document.getElementById("collagesele").value;
  var fullname = document.getElementById("fullname").value;
  var Email = document.getElementById("Email").value;
  var password = document.getElementById("pasword").value;
  var confirmpassword = document.getElementById("confirmpassword").value;
  const Gaurdian=document.getElementById('Gaurdian').value
  const Year=document.getElementById('Year').value
  const Section=document.getElementById('Section').value
  const Course =document.getElementById('Course').value
  const roll=document.getElementById("Id").value
  const Gender =document.getElementById('Gender').value


  var AdministrationError = document.getElementById("AdministrationError");
  var qualificationError=document.getElementById("collageseleError")
  var fullnameError = document.getElementById("fullnameError");
  var EmailError = document.getElementById("EmailError");
  var passwordError=document.getElementById('paswordError');
  var rollError=document.getElementById('IdError');
  var confirmpasswordError = document.getElementById("confirmpasswordError");
  const GaurdianError=document.getElementById('GaurdianError')
  const YearError=document.getElementById('YearError')
  const SectionError=document.getElementById('SectionError')
  const CourseError =document.getElementById('CourseError')
  const GenderError =document.getElementById('GenderError')
  var check=document.getElementById('agree')
  const checkError =document.getElementById('checkboxError')

  AdministrationError.innerHTML = "";
  qualificationError.innerHTML=""
  fullnameError.innerHTML = ""; 
  EmailError.innerHTML = ""; 
  passwordError.innerHTML="";
  confirmpasswordError.innerHTML = "";
  GaurdianError.innerHTML="";
  YearError.innerHTML="";
  SectionError.innerHTML=""
  CourseError.innerHTML=""
  GenderError.innerHTML=""
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
  if (roll=== "") {
    rollError.innerHTML = "Please enter your reg.no/Id";
}
  // Validation for "emailAddress"
  if (Email === "") {
      EmailError.innerHTML = "Please enter your email address";
  }

  if (Section == null || Section === "Section") {
    SectionError.innerHTML = "Select section";
}
if (Year == null || Year === "Year") {
  YearError.innerHTML = "Select Year";
}
if (Course == null || Course === "Course") {
  CourseError.innerHTML = "Select Course";
}
if (Gender == null || Gender === "Gender") {
  GenderError.innerHTML = "Select Gender";
}

if (Gaurdian=== "") {
  GaurdianError.innerHTML = "Gaurdian name required";
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
    showSignedInPopup(done)
}

    if(fullname !=="" && Email !=="" && Administration !==""  && password !=="" && confirmpassword !=="" && collegename !=="" && roll !==""&&
    password === confirmpassword){
      
      const done=    await userlog(Administration,roll,collegename,fullname,Email,confirmpassword)
      
      showSignedInPopup(done);
      
      
      }
  
});*/
