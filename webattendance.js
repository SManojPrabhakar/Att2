const express = require('express');
const router = express.Router();
const multer = require('multer')
const jwt = require('jsonwebtoken');
const s3 = require('./awsConfig');
const bcrypt = require('bcrypt');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY

const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

const pool = require('./config.js');

router.get('/getattendance/new/single/', async (req, res) => {
  let connection;
  try {
    const token = req.cookies.att2day;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;
 
   

    const query = "SELECT subject_name, date, is_present, period FROM attendance WHERE student_id = ?";
    
    connection = await pool.getConnection();
    const [result] = await connection.query(query, [Id]);
    connection.release();

    if (!result.length) {
      return res.status(200).json({ success: true, message: [] });
    }

    let totalClasses = result.length; 
    let attendedClasses = 0;

    const attendanceDetails = result.reduce((acc, curr) => {
      try {
        let date = curr.date;
        if (!(date instanceof Date)) {
          throw new Error('Invalid date format');
        }

        const normalizedDate = date.toISOString().split('T')[0];

        const subjectDetails = {
          subject_name: curr.subject_name,
          period: curr.period,
          is_present: curr.is_present
        };

        if (curr.is_present === 1) {
          attendedClasses += 1;
        }

        const existingDate = acc.find(item => item.date === normalizedDate);
        if (existingDate) {
          existingDate.subjects.push(subjectDetails);
        } else {
          acc.push({ date: normalizedDate, subjects: [subjectDetails] });
        }
      } catch (err) {
        console.error("Date processing error:", err);
      }
      return acc;
    }, []);

    res.status(200).json({ 
      success: true, 
      message: [{
        total_classes: totalClasses,
        attended_classes: attendedClasses,
        attendanceDetails: attendanceDetails
      }]
    });

  } catch (error) {
    console.error('Error executing query:', error);

    if (connection) {
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(400).json({ success: false, message: "Invalid database field name in query" });
    } else if (error.code === 'ER_PARSE_ERROR') {
      return res.status(400).json({ success: false, message: "SQL syntax error in query" });
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ success: false, message: "Table not found in database" });
    } else {
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
});



router.get('/college/details/', async (req, res) => {
  let connection;
  try {
    const token = req.cookies.att2day;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

    // Decode token (You must define `secretKey` earlier in your code)
    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Token expired" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ success: false, message: "Invalid token" });
      } else {
        return res.status(401).json({ success: false, message: "Unauthorized access" });
      }
    }

    const fondid = decoded.Id; 
 

    const query = 'SELECT * FROM register WHERE fonid = ?';

    connection = await pool.getConnection();

    const [rows] = await connection.query(query, [fondid]);

    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No colleges registered under your ID' });
    }

    return res.status(200).json({ success: true, colleges: rows });

  } catch (error) {
    if (connection) connection.release();
    console.error('Server error:', error);

    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(400).json({ success: false, message: 'Invalid field in SQL query' });
    } else if (error.code === 'ER_PARSE_ERROR') {
      return res.status(400).json({ success: false, message: 'SQL syntax error' });
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ success: false, message: 'Table not found in database' });
    } else {
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
});
  


router.post("/attendance/new/", async (req, res) => {
  const token = req.cookies.att2day
  let connection;  // Declare connection outside for proper rollback

  try {
      if (!token) {
          return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
      }

     
    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;
      const { subject_name, date, period, attendance,attendance_sheet_id,present} = req.body;
     


      // Validate input data
      if (!subject_name || !date || !Array.isArray(attendance)) {
          return res.status(400).json({ error: "Invalid input data" });
      }

      if (attendance.length === 0) {
          return res.status(400).json({ error: "Attendance array cannot be empty" });
      }

      const unixTimestamp = Math.floor(Date.now() / 1000);
      const values = attendance.map(record => [
          record.student_id,
          subject_name,
         date,
          period,
          record.is_present,
          unixTimestamp
      ]);

      const attendanceQuery = `
          INSERT INTO attendance (student_Id, subject_name, date, period, is_present, timestamp)
          VALUES ?
      `;

      const lecturerQuery = `
          INSERT INTO lecturer_attendance_log (attendance_sheet_id,lecturer_id,present_Count)
          VALUES (?, ?, ?)
      `;

      connection = await pool.getConnection();
      await connection.beginTransaction();

      await connection.query(attendanceQuery, [values]);
      await connection.query(lecturerQuery, [
          attendance_sheet_id,Id,present
      ]);

      await connection.commit();
      connection.release();

      res.status(201).json({ success: true, message: "Attendance and lecturer records inserted successfully" });

  } catch (error) {
      console.error("Error inserting attendance data:", error);

      if (connection) {
          await connection.rollback();
          connection.release();
      }

      if (error.name === "TokenExpiredError") {
          return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
      } else if (error.name === "JsonWebTokenError") {
          return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
      } else if (error.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Duplicate entry detected" });
      } else if (error.code === "ER_NO_REFERENCED_ROW" || error.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(400).json({ error: "Foreign key constraint failed" });
      } else if (error.code === "ER_BAD_NULL_ERROR") {
          return res.status(400).json({ error: "A required field cannot be NULL" });
      } else if (error.code === "ER_PARSE_ERROR") {
          return res.status(500).json({ error: "SQL syntax error" });
      }

      res.status(500).json({ error: "Failed to insert attendance and lecturer records" });
  }
});



router.post('/collegefee/reg/', async (req, res) => {
  const token = req.cookies.att2day;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
    }
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', errorMessage: error.message });
  }

  const {
    Regno, Fullname, joiningdate, Year, Section, Course, Gender,
    College, Sem, Fee, Completion, Password, Role, Phone, regulation
  } = req.body;

  const completionMapping = {
  'I year': 1,
  'II year': 2,
  'III year': 3,
  'IV year': 4,
  'V year': 5
};

  

  if (!Regno || !Fullname || !joiningdate || !Year || !Section || !Course || !Gender || !College || !Sem || !Completion || !regulation || !Phone) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (Completion <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid Completion value (must be greater than zero)' });
  }

  const hashedPassword = await bcrypt.hash(Password, 10);

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if Regno exists in students
    const [studentRows] = await connection.query(`SELECT Regno FROM students WHERE Regno = ?`, [Regno]);

    // Check if Regno exists in lecturer
    const [lecturerRows] = await connection.query(`SELECT Regno FROM lecturer WHERE Regno = ?`, [Regno]);

    if (studentRows.length > 0 || lecturerRows.length > 0) {
      connection.release();
      return res.status(409).json({ success: false, message: "Regno already exists in students or lecturers." });
    }

    // Check if Phone already exists in students
    const [phoneRows] = await connection.query(`SELECT Regno FROM students WHERE Number = ?`, [Phone]);
    if (phoneRows.length > 0) {
      connection.release();
      return res.status(409).json({ success: false, message: "Phone number already exists." });
    }

    // Insert into students
    const insertStudentQuery = `
      INSERT INTO students 
      (Regno, Fullname, joining_date, Year, Section, Course, Gender, college_name, course_completion_years, password, Role, Sem, Number, Regulation) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(insertStudentQuery, [
      Regno, Fullname, joiningdate, Year, Section, Course, Gender,
      College, Completion, hashedPassword, Role, Sem, Phone, regulation
    ]);

    const numericCompletion = completionMapping[Completion?.trim()];

    // Handle Fee
  if (
  Fee !== null &&
  Fee !== undefined &&
  Fee !== "" &&
  !isNaN(parseFloat(Fee)) &&
  numericCompletion > 0
) {
  const fees = parseFloat(Fee);
  const college_fee = parseFloat((fees / numericCompletion).toFixed(2));
  const currentAcademicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  const insertFeeQuery = `
    INSERT INTO Yearly_fees (Regno, Fee_type, Fee_year, Fee_total, Fee_due) 
    VALUES (?, ?, ?, ?, ?)
  `;
  await connection.query(insertFeeQuery, [
    Regno,
    "College-fee",
    currentAcademicYear,
    college_fee,
    college_fee
  ]);
}


    await connection.commit();
    connection.release();

    res.status(200).json({ success: true, message: "Registered successfully" });

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }

    if (error.code === 'ER_DUP_ENTRY') {
      const msg = error.message;
      if (msg.includes('Regno')) {
        return res.status(409).json({ success: false, message: "Regno already exists." });
      } else if (msg.includes('Number')) {
        return res.status(409).json({ success: false, message: "Phone number already exists." });
      } else {
        return res.status(409).json({ success: false, message: "Duplicate entry detected.", errorMessage: msg });
      }
    }

    if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: "Invalid foreign key reference. Please check if the college exists." });
    }

    console.error('Error executing query:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
  }
});




module.exports = router;