/*const express = require('express');
const router = express.Router();
const app = express();
const cookieParser = require('cookie-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const multer = require('multer');


const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

app.use(cookieParser());
app.use(express.json());

const pool = require('./config.js');

require('dotenv').config();
const secretKey =process.env.SECRET_KEY

router.get('/profile/web/', async (req, res) => {
    try {
       const token = req.cookies.token;
       
  
      if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
      }
  
      const decoded = jwt.verify(token, secretKey);
      const { Regno } = decoded;  // Ensure this is lowercase 'id'
      // This should now correctly log the user's ID*/
      /*
  
      const studentQuery = `
      SELECT 
    students.regno,
    students.fullname,
    students.Course,
    students.Profile,
    students.Role,
    students.Email,
    students.Number,
    students.College_name,
    students.year,
    COUNT(*) AS total_classes, -- Total classes attended or not
    SUM(CASE WHEN attendance.is_present = 1 THEN 1 ELSE 0 END) AS classes_present -- Classes where the student was present
FROM 
    attendance
INNER JOIN 
    students
ON 
    attendance.student_id = students.Id
WHERE 
    students.regno = ?
GROUP BY 
    students.Id, students.fullname, students.Course;`

     const lecturerquery=`SELECT regno,Email,Fullname,Role,Profile,Address,Desigination,Department,College_name from lecturer where Regno=?`

  
      const connection = await pool.getConnection();
      try {
        // Check in the 'students' table
        let [results] = await connection.query(studentQuery,[Regno]);
  
        if (results.length === 0) {
          // If not found, check in the 'lecturer' table
          [results] = await connection.query(lecturerquery, [Regno]);
  
          if (results.length === 0) {
            console.log("User not found in both tables");
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
          }
        }
  
        const { Profile, ...user } = results[0];
  
        // Fetch the profile image from S3
        const profileParams = {
          Bucket: 'add-imag',
          Key: Profile,
        };
  
        let profilepic = '';
        try {
          profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
        } catch (err) {
          console.error(`Error retrieving image for ${Profile}:`, err);
        }
  
        // Add the profile URL to the user data
        const userData = { ...user, profilepic };

        return res.status(200).json({ success: true, message: userData });
        
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });




module.exports=router
/*router.post("/exam/timetable/", async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { id, timetable } = req.body;

    if (!id || !timetable?.examname || !Array.isArray(timetable.subjects)) {
      return res.status(400).json({ success: false, message: "Missing or invalid 'id' or 'timetable'" });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if the same exam name already exists for the class
    const [existing] = await connection.query(
      `SELECT 1 FROM exam_timetable WHERE classid = ? AND examination_name = ? LIMIT 1`,
      [id, timetable.examname]
    );

    if (existing.length > 0) {
      await connection.release();
      return res.status(409).json({
        success: false,
        message: `Exam timetable for '${timetable.examname}' already exists for this class`
      });
    }

    // Prepare values to insert
    const insertValues = timetable.subjects.map(entry => [
      id,
      timetable.examname,
      entry.subjectName,
      entry.startTime,
      entry.endTime,
      entry.date
    ]);

    // Perform bulk insert
    if (insertValues.length > 0) {
      await connection.query(
        `INSERT INTO exam_timetable (classid, examination_name, subject_name, starttime, endtime, exam_date) VALUES ?`,
        [insertValues]
      );
    }

    await connection.commit();
    connection.release();

    res.status(201).json({ success: true, message: "Exam timetable inserted successfully" });
  } catch (error) {
    console.error("Error inserting exam timetable:", error);
    if (connection) {
      await connection.rollback();
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else {
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
});
*/