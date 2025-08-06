const express = require('express');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 3000;
const IP_ADDRESS="10.98.163.22"

app.use(cookieParser())
app.use(express.json());
app.use(express.static(path.join(__dirname, './public')));


const reportRoutes = require('C:/Users/vsdhe/Data/project/reportRoutes.js');
const collageRoutes = require('C:/Users/vsdhe/Data/project/collegeRoutes.js');
const register = require('C:/Users/vsdhe/Data/project/register.js');
const routes = require('C:/Users/vsdhe/Data/project/pageroutes.js');
const Login = require('C:/Users/vsdhe/Data/project/Loginroute.js');
const signup = require('C:/Users/vsdhe/Data/project/signup.js');
const Attend = require('C:/Users/vsdhe/Data/project/Attendance.js');
const posts = require('C:/Users/vsdhe/Data/project/posts.js');
const Userupdates = require('C:/Users/vsdhe/Data/project/Userupdates.js');
const Fees = require('C:/Users/vsdhe/Data/project/Fees.js');
const Passwords = require('C:/Users/vsdhe/Data/project/Passwords.js');

const Delete=require('C:/Users/vsdhe/Data/project/Delete.js')
const Notify=require('C:/Users/vsdhe/Data/project/PushNotifi.js');
const Classes=require('C:/Users/vsdhe/Data/project/Classes.js')
//const Profile=require('C:/Users/vsdhe/Data/project/Profile.js')
const sendOtpRoutes = require('C:/Users/vsdhe/Data/project/sendOtpRoutes.js');
const webclassesRoutes = require('C:/Users/vsdhe/Data/project/webclasses.js');
const webfeeRoutes= require('C:/Users/vsdhe/Data/project/webfees.js');
const webattendance= require('C:/Users/vsdhe/Data/project/webattendance.js');
const webupdate= require('C:/Users/vsdhe/Data/project/webupdate.js');
const founder= require('C:/Users/vsdhe/Data/project/founder.js');
const principal= require('C:/Users/vsdhe/Data/project/principal.js');
const webprincipal= require('C:/Users/vsdhe/Data/project/webprinci.js');
const exams= require('C:/Users/vsdhe/Data/project/exams.js');
const hod= require('C:/Users/vsdhe/Data/project/hod.js');
// Middleware...

app.use('/', routes);
app.use('/otp', sendOtpRoutes);
app.use('/issue', reportRoutes);
app.use('/colls', collageRoutes);
app.use('/reg', register);
app.use('/auth', Login);
app.use('/sin', signup);
app.use('/attend',Attend)
app.use("/po",posts)
app.use("/userup",Userupdates)
app.use("/fee",Fees)
app.use("/Pass",Passwords)

app.use("/del/",Delete)
app.use("/Notify/",Notify)
app.use("/class/",Classes)
//app.use("/pro",Profile)
app.use("/webclass",webclassesRoutes)
app.use("/webfees",webfeeRoutes)
app.use("/webattendance",webattendance)
app.use("/webupdate",webupdate)
app.use("/fond",founder)
app.use("/princi",principal)
app.use("/webprinci",webprincipal)
app.use("/examcell",exams)
app.use("/hod",hod)
// Other routes...
app.listen(PORT,IP_ADDRESS,() => {
    console.log(`Server is running on port ${PORT}`);
  });

