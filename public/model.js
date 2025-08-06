// Model (your-model.js)

// Assuming you have some kind of data structure to store the information

export { sendDataToServer,recentregister,s3images,S3delete,report,verification,getattendancesheets,getsubjectslist,studentssublist,studentstimelist,
  gettimetablelist,postattendancesheet,right,reportingmail,Login,user,userdata,logout,studentslist,attstudentslist,searchlist,studentattend,dueslist,
 lecturerlist,updatefond,feetypelist,updateuse,putsubjects,studentreg,classestimelist, classeslist,signup,collegenames,userlog,founderlog,getclasses,
 postclasses,collegetype,collegeslist,puttimetable,Enrollfee,collegefee,Otherfee,Lectupdatepassword,updatepassword,postattend,putassignments,
 classesassignments,lectsubjects,studentsassignmentslist,Plecturerlist,Padminlist,Pstudentslist,Pclasses,PLecturesDelivered,Psubjects,Pstattendance,Pstfeedues,
Pstresults,PlecturerlistbyCourse,PstudentslistbyCourse,deactivatestudent,rightt,verificationt,contactus,getYearlyFeeAmount,Foupdatepassword};
 
  async function collegenames(){
    try{
      const response=await fetch('/colls/sin/collegenames/',{
        method:'Get',
        headers:{
          'Content-Type': 'application/json'
        }
      })
      const result=await response.json();
  
      return result
     
    }
    catch(error){
      console.error('Error sending data to server:', error.message);
    }
  }


async function s3images(Imagekeys) {
  try {
    const formData = new FormData();

    // Iterate through each image and append it to the FormData
    for (let i = 0; i < Imagekeys.length; i++) {
      formData.append(`file`, Imagekeys[i]);
    }

    const response = await fetch('/colls/s3upload/', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const result = await response.json();
    

    return result; // This result will be passed to the calling code (controller.js)
  } catch (error) {
    console.log('Error sending data to server:', error.message);
  }
}

async function logout(){
  try{
    const response=await fetch('/auth/logout/',{
      method:'Get',
      headers:{
        'Content-Type': 'application/json'
      }
    })
    const result=await response.json();
   
    return result
   
  }
  catch(error){
    console.error('Error sending data to server:', error.message);
  }
}


async function recentregister(){
  try{
    const response=await fetch('/colls/collages/',{
      method:'Get',
      headers:{
        'Content-Type': 'application/json'
      }
    })
    const result=await response.json();
   
    return result
   
  }
  catch(error){
    console.error('Error sending data to server:', error.message);
  }
}


async function Pstudentslist(collegename) {
  try {
    const response = await fetch(`/webprinci/college/students/?collegename=${encodeURIComponent(collegename)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function PstudentslistbyCourse(collegename,course) {
  try {
    const response = await fetch(`/webprinci/hod/college/students/?collegecode=${encodeURIComponent(collegename)}&course=${encodeURIComponent(course)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function Padminlist(collegecode) {
  try {
    const response = await fetch(`/webprinci/college/Admin/?collegecode=${encodeURIComponent(collegecode)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}


async function Plecturerlist(collegecode) {
 
  try {
    const response = await fetch(`/webprinci/college/lecturers/?collegecode=${encodeURIComponent(collegecode)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}


async function PlecturerlistbyCourse(collegecode,course) {
 
  try {
    const response = await fetch(`/webprinci/hod/college/lecturers/?collegecode=${encodeURIComponent(collegecode)}&course=${encodeURIComponent(course)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function user(){
  try{
    
   
    const response = await fetch('/auth/loginstatus/', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
     
      }
    })
    const result = await response.json();
  
    return result
   
  }
  catch(error){
    console.error('Error sending data to server:', error.message);
  }
}
async function userdata() {
  try {
    const response = await fetch('/auth/collegelogindata/', {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function getclasses() {
  try {
    const response = await fetch('/webclass/classes/get/', {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
 
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function getattendancesheets() {
  try {
    const response = await fetch('/webclass/attendancesheets/get/', {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function getsubjectslist() {
  try {
    const response = await fetch('/webclass/subjects/list/', {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function gettimetablelist() {
  try {
    const response = await fetch('/webclass/timetable/list/', {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function collegetype(collegeName) {
  try {
    const response = await fetch(`/webclass/collegetype/?college_name=${encodeURIComponent(collegeName)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function Pclasses(Id) {

  try {
    const response = await fetch(`/webprinci/classes/?Id=${encodeURIComponent(Id)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}
async function Psubjects(Id) {
  try {
    const response = await fetch(`/webprinci/get/lect/subjects/?Id=${encodeURIComponent(Id)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}
async function PLecturesDelivered(Id) {
  try {
    const response = await fetch(`/webprinci/lec/taken/?Id=${encodeURIComponent(Id)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}



async function Pstfeedues(regno) {

  try {
    const response = await fetch(`/webprinci/collegefeedue/list/?regno=${encodeURIComponent(regno)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}
async function Pstattendance(Id) {
  console.log(Id)
  try {
    const response = await fetch(`/webprinci/getattendance/lect/single/?Id=${encodeURIComponent(Id)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}
async function Pstresults(Regno) {
  try {
    const response = await fetch(`/webprinci/student/results/?Regno=${encodeURIComponent(Regno)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function classeslist() {
  try {
    const response = await fetch(`/webclass/classes/without/subjects/`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function classestimelist() {
  try {
    const response = await fetch(`/webclass/classes/without/timetable/`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function classesassignments() {
  try {
    const response = await fetch(`/webclass/classes/assignments/`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function dueslist(Regno) {
  try {
    const response = await fetch(`/webfees/college-feedue/list/?Regno=${encodeURIComponent(Regno)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    console.log(result)
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function collegeslist() {
  try {
    const response = await fetch(`/webattendance/college/details/`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function studentstimelist(classid) {
  try {
    const response = await fetch(`/webclass/student/timetable/list/?classid=${encodeURIComponent(classid)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}



async function studentssublist(classid) {
 
  try {
    const response = await fetch(`/webclass/student/subjects/list/?classid=${encodeURIComponent(classid)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}


async function studentsassignmentslist(classid) {
 
  try {
    const response = await fetch(`/webclass/students/assignments/list/?classid=${encodeURIComponent(classid)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    console.log(result)
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}


async function studentslist(classid) {
  try {
    const response = await fetch(`/webclass/students/${classid}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function searchlist(college_name) {
 
  try {
    const response = await fetch(`/webfees/search/get/?college_name=${encodeURIComponent(college_name)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
   
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}


async function feetypelist(Regno, feeyear) {
  try {
    const response = await fetch(`/webfees/feetypes/?Regno=${encodeURIComponent(Regno)}&feeyear=${encodeURIComponent(feeyear)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function getYearlyFeeAmount(Regno, feeyear,feetype) {
  
  try {
    const response = await fetch(`/webfees/previousfee/?regno=${encodeURIComponent(Regno)}&feeyear=${encodeURIComponent(feeyear)}&feetype=${encodeURIComponent(feetype)}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}




async function deactivatestudent(Regno) {

  try {
    const response = await fetch(`/webupdate/deactivate/delete/?Regno=${encodeURIComponent(Regno)}`, {
      method: 'DELETE',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}


async function studentattend() {

  try {
    const response = await fetch(`/webattendance/getattendance/new/single/`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
   console.log(result)
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function attstudentslist(college, course, section, year, sem) {
  try {
    const response = await fetch(`/webclass/students/${college}/${course}/${section}/${year}/${sem}`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function lecturerlist(college) {
  try {
    const response = await fetch(`/webclass/lecturer/${college}/`, {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function postclasses(Course, Year, Section, Sem, Name, Role, college_name,regulation) {
 
  try {
    const response = await fetch('/webclass/classes/new/incharge/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
        Course,
        Year,
        Section,
        Sem,
        Name,
        Role,
        college_name,
        regulation
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function postattend(Subject,  Course, Year, Section, Sem, Name) {
 
  try {
    const response = await fetch('/webclass/attendance/new/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
      Subject,  Course, Year, Section, Sem, Name
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}
async function postattendancesheet( subject_name, date, period, attendance,attendance_sheet_id,present) {
 
  try {
    const response = await fetch('/webattendance/attendance/new/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
        subject_name, date, period, attendance,attendance_sheet_id,present
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}


async function studentreg( Regno, Fullname, joiningdate, Year, Section, Course, 
  Gender, College, Completion,Password,Role,Sem,Phone,Fee,regulation) {
    
  try {
    const response = await fetch('/webattendance/collegefee/reg/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
        Regno, Fullname, joiningdate, Year, Section,
       Course, Gender, College, Completion,Password,Role,Sem,Phone,Fee,regulation
      }),
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function updateuse(Fullname, Year,Section,Sem,aRegno,Course) {
 
  try {
    const response = await fetch('/webupdate/user/update/edit/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
     Fullname, Year,Section,Sem,aRegno,Course
      }),
    });

    const result = await response.json();
   
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function updatepassword(password, newpassword) {
 
  try {
    const response = await fetch('/webupdate/password/change', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
   password, newpassword
      }),
    });

    const result = await response.json();
   
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function Lectupdatepassword(password, newpassword) {
 
  try {
    const response = await fetch('/webupdate/lectpassword/change', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
   password, newpassword
      }),
    });

    const result = await response.json();
   
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function Foupdatepassword(password, newpassword) {
 
  try {
    const response = await fetch('/webupdate/fondpassword/change', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
   password, newpassword
      }),
    });

    const result = await response.json();
   
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

  
async function updatefond(collegeinfo) {
    
  try {
    const response = await fetch('/webupdate/fond/update/college/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
        
     collegename:collegeinfo.College_Name,
      collegecode:collegeinfo.College_Code,
     Address:collegeinfo.College_Address,
     adminnumber:collegeinfo.College_Admin_Number,
     email:collegeinfo.College_Email,
     principal:collegeinfo.Principal,
     principalemail:collegeinfo.P_Email,
     code:collegeinfo.code
      }),
    });

    const result = await response.json();
   
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function puttimetable(classname,timetable) {

  try {
    const response = await fetch('/webclass/timetable/upload/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
        classname,
     timetable
      }),
    });

    const result = await response.json();
   
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}


async function putsubjects(classid,subjects) {

  try {
    const response = await fetch('/webclass/subjects/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
        classid,
     subjects
      }),
    });

    const result = await response.json();
    console.log(result)
   
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function lectsubjects(classid,subjects) {

  try {
    const response = await fetch('/webclass/get/lect/subjects/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
    });

    const result = await response.json();

   
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}


async function putassignments(classid, subjectname, due_date, file) {
  const formData = new FormData();
  formData.append('classid', classid);
  formData.append('subjectname', subjectname);
  formData.append('due_date', due_date);
  formData.append('file', file);
  try {
    const response = await fetch('/webclass/uploadassignment/', {
      method: 'POST',
      body: formData,
      credentials: 'include', // ensures cookies like token are sent
    });

    const result = await response.json();
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}


async function postattendance(classid,subjects) {

  try {
    const response = await fetch('/webclass/attendance/new/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
        classid,
     subjects
      }),
    });

    const result = await response.json();
    console.log(result)
   
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function collegefee(Regno, Fee_type, Fee, Ayear) {
 
  try {
    const response = await fetch('/webfees/college-fee/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
        Regno, Fee_type, Fee, Ayear
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}


async function Enrollfee(Regno, Fee_type, Fee, Ayear,total) {
 
  try {
    const response = await fetch('/webfees/college-fee/enroll/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
      Regno, Fee_type, Fee, Ayear,total
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}

async function Otherfee(Regno, Fee_type, Fee) {
 
  try {
    const response = await fetch('/webfees/college-fee/other/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures cookies are sent
      body: JSON.stringify({
      Regno, Fee_type, Fee
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}
async function Login(Email,password){
  try{
    const response=await fetch(`/auth/collegelogin/`,{
      method:'post',
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
      
        Email,password
       }),credentials:'include'
    })
    const result=await response.json();

   return result
  }
  catch(error){
    console.error('Error sending data to server:', error.message);
  }
}


async function reportingmail( 

  Email,
  full_name,
  orgina,
  city,
  
) {
  // You can use fetch or any other method to send data to the server
  try{
    
    const response=await fetch('/issue/reporting/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      
    
      Email,
    full_name,
      orgina,
      city,
     
      
    })
  })
 const result = await response.json();
console.log(result)
return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}


async function report( 
 
  Email,
   Fullname,
  Organization,
  Number,
   Message
){
  // You can use fetch or any other method to send data to the server
  try{
    
    const response=await fetch('/issue/web/reporting/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Email,Fullname,Organization,Number,Message
     
      
    }),credentials:'include'
  })
 const result = await response.json();

return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}


async function contactus( 
 
  Email,
   Fullname,
  issue,
  Number,
   Message
){

  console.log( Email,
   Fullname,
  issue,
  Number,
   Message)
  // You can use fetch or any other method to send data to the server
  try{
    
    const response=await fetch('/issue/web/contact/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Email,Fullname,issue,Number,Message
     
      
    })
  })
 const result = await response.json();

return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}

async function verificationt( 
  
  Email,
  
) {
  // You can use fetch or any other method to send data to the server
  try{
    
    const response=await fetch('/otp/send-otp/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
      body: JSON.stringify({
      
        Email
       })
      })
  
   const result = await response.json();
return result // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}

async function rightt( 
  Email,
  otp
  
) {
  // You can use fetch or any other method to send data to the server
  try{
  
   
    const response=await fetch('otp/verify-otp', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Email,
      otp
      })
      
      
  })
 const result = await response.json();

return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}


async function verification( 
  
  Email,
  
) {

  try{
    
    const response=await fetch('/otp/send-otp/coll/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
      body: JSON.stringify({
      
        Email
       }),credentials:'include'
      })
  
   const result = await response.json();
return result // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}

async function right( 
  Email,
  otp
  
) {
  // You can use fetch or any other method to send data to the server
  try{
   
   
    const response=await fetch('otp/verify-otp/coll', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Email,
      otp
      })
      ,credentials:'include'
      
  })
 const result = await response.json();

return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}

async function signup( type,qualification,fullname,email,
 password) {
  // You can use fetch or any other method to send data to the server
  try{
    
    const response=await fetch('auth/signup/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      qualification,
      fullname,
      email,
      password
     
      
    })
  })
 

const result = await response.json();

return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}
async function S3delete(key) {
  try {
    console.log(key)
      
    const response = await fetch(`colls/s3delete/${key}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
    throw error;
  }
}

async function founderlog( Role,Fullname,Email,password) {
  // You can use fetch or any other method to send data to the server
  try{
 
    const response=await fetch('sin/founder/signup/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      
      
     Fullname,
      Email,
      Role,
      password
      
    })
  })
 

const result = await response.json();
console.log(result)
return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}


async function userlog( Role,Regno,Fullname,College,Email,password,Code) {
  // You can use fetch or any other method to send data to the server
  try{

    const response=await fetch('sin/lecturer/admin/signup/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      
    Fullname,
      Regno,
      Email,
      Role,
     College,
      password,Code
      
    })
  })
 

const result = await response.json();

return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}



async function sendDataToServer(State,
  College_Type,
  College_Code,
  College_Name,
  College_Email,
  College_Number,Principal,Imagekeys,P_Email,College_Address,fondid) {
  // You can use fetch or any other method to send data to the server
  try{
    
    const response=await fetch('reg/register/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
     
    },
    credentials: 'include',
    body: JSON.stringify({
      
      State,
      College_Type,
      College_Code,
      College_Name,
      College_Email,
      College_Number,
      Principal,
      Imagekeys,
      P_Email,
      College_Address
      ,fondid
    })
  })
 

const result = await response.json();

return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}


