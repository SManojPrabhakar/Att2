const express = require('express');
const router = express.Router();
const multer = require('multer')
const jwt = require('jsonwebtoken');
const s3 = require('./awsConfig');
const bcrypt = require('bcrypt');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });
const pool = require('./config.js');


router.get('/college/lecturers/', async (req, res) => {
  let connection;

  try {
       const token = req.cookies.att2day;
       
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

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
    const collegecode = req.query.collegecode;
     console.log(collegecode)
    const query = `SELECT id as Id, Fullname AS Name, Profile AS ProfilePic, Regno 
FROM lecturer 
WHERE College_Code = ? 
  AND Role = 'Lecturer' 
  AND (Desigination IS NULL OR Desigination != 'Principal');
`;

    connection = await pool.getConnection();
    const [rows] = await connection.query(query, [collegecode]);
    connection.release();

    if (rows.length === 0) {
     
      return res.status(404).json({ success: false, message: 'No Lecturers under your college' });
    }

    // Map through all students and get signed URLs
    const studentsWithSignedUrls = await Promise.all(
      rows.map(async (student) => {
        let profilepic = '';
        if (student.ProfilePic) {
          try {
            const profileParams = {
              Bucket: 'add-imag',
              Key: student.ProfilePic,
            };
            profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
          } catch (err) {
            console.error(`Error retrieving image for ${student.ProfilePic}:`, err);
          }
        }

        return {
          Regno: student.Regno,
          Name: student.Name,
          Id:student.Id,
          ProfilePic: profilepic,
        };
      })
    );

 

    return res.status(200).json(studentsWithSignedUrls);

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

router.get('/hod/college/lecturers/', async (req, res) => {
  let connection;

  try {
       const token = req.cookies.att2day;
       
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

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
    const {collegecode,course} = req.query
    
    const query = `SELECT id as Id, Fullname AS Name, Profile AS ProfilePic, Regno 
FROM lecturer 
WHERE College_Code = ? 
  AND Role = 'Lecturer' 
 AND Department=?
  AND (Desigination IS NULL OR Desigination != 'HOD');
`;

    connection = await pool.getConnection();
    const [rows] = await connection.query(query, [collegecode,course]);
    connection.release();

    if (rows.length === 0) {
     
      return res.status(404).json({ success: false, message: 'No Lecturers under your department' });
    }

    // Map through all students and get signed URLs
    const studentsWithSignedUrls = await Promise.all(
      rows.map(async (student) => {
        let profilepic = '';
        if (student.ProfilePic) {
          try {
            const profileParams = {
              Bucket: 'add-imag',
              Key: student.ProfilePic,
            };
            profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
          } catch (err) {
            console.error(`Error retrieving image for ${student.ProfilePic}:`, err);
          }
        }

        return {
          Regno: student.Regno,
          Name: student.Name,
          Id:student.Id,
          ProfilePic: profilepic,
        };
      })
    );

 

    return res.status(200).json(studentsWithSignedUrls);

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


router.get('/college/students/', async (req, res) => {
  let connection;

  try {
    const token = req.cookies.att2day;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

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
    const collegecode = req.query.collegename;
  
    const query = `SELECT id as Id, Fullname AS Name, Profile AS ProfilePic, Regno FROM students WHERE College_name = ? `;

    connection = await pool.getConnection();
    const [rows] = await connection.query(query, [collegecode]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No students under your college' });
    }

    // Map through all students and get signed URLs
    const studentsWithSignedUrls = await Promise.all(
      rows.map(async (student) => {
        let profilepic = '';
        if (student.ProfilePic) {
          try {
            const profileParams = {
              Bucket: 'add-imag',
              Key: student.ProfilePic,
            };
            profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
          } catch (err) {
            console.error(`Error retrieving image for ${student.ProfilePic}:`, err);
          }
        }

        return {
          Regno: student.Regno,
          Name: student.Name,
          Id:student.Id,
          ProfilePic: profilepic,
        };
      })
    );

    return res.status(200).json(studentsWithSignedUrls);

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

router.get('/hod/college/students/', async (req, res) => {
  let connection;

  try {
    const token = req.cookies.att2day;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

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
    const {collegecode,course} = req.query
  
    const query = `SELECT id as Id, Fullname AS Name, Profile AS ProfilePic, Regno FROM students WHERE College_name = ? 
    ANd Course=? `;

    connection = await pool.getConnection();
    const [rows] = await connection.query(query, [collegecode,course]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No students under your department' });
    }

    // Map through all students and get signed URLs
    const studentsWithSignedUrls = await Promise.all(
      rows.map(async (student) => {
        let profilepic = '';
        if (student.ProfilePic) {
          try {
            const profileParams = {
              Bucket: 'add-imag',
              Key: student.ProfilePic,
            };
            profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
          } catch (err) {
            console.error(`Error retrieving image for ${student.ProfilePic}:`, err);
          }
        }

        return {
          Regno: student.Regno,
          Name: student.Name,
          Id:student.Id,
          ProfilePic: profilepic,
        };
      })
    );

    return res.status(200).json(studentsWithSignedUrls);

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

router.get('/college/Admin/', async (req, res) => {

  let connection;
  
  try {
    const token = req.cookies.att2day;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

   
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
    const collegecode=req.query.collegecode
   
    const query = `SELECT Fullname AS Name, Profile AS ProfilePic, Regno 
FROM lecturer 
WHERE College_Code = ? 
  AND Role = "Admin" 
  AND (Desigination != "Principal" OR Desigination IS NULL);
`;

    connection = await pool.getConnection();

    const [rows] = await connection.query(query, [collegecode]);
  
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No Admins were found under your college' });
    }
      const studentsWithSignedUrls = await Promise.all(
      rows.map(async (student) => {
        let profilepic = '';
        if (student.ProfilePic) {
          try {
            const profileParams = {
              Bucket: 'add-imag',
              Key: student.ProfilePic,
            };
            profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
          } catch (err) {
            console.error(`Error retrieving image for ${student.ProfilePic}:`, err);
          }
        }

        return {
          Regno: student.Regno,
          Name: student.Name,
          Id:student.Id,
          ProfilePic: profilepic,
        };
      })
    );
  
    return res.status(200).json(studentsWithSignedUrls);

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


router.get("/classes/", async (req, res) => {
  let connection;

  try {
    const token = req.cookies.att2day;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = req.query;
  
    
    connection = await pool.getConnection();

    // Query to get classes for the lecturer
    const attendanceQuery = `
      SELECT Id, Name, Year, Sem, Course, Role, Section 
      FROM lect_classes 
      WHERE Leact_Id = ?;
    `;

    // Execute the query and retrieve the result
    const [rows] = await connection.query(attendanceQuery, [Id]);

    // If no classes are found, return an empty array with success message
    if (rows.length === 0) {
      return res.status(200).json({ success: true, message: "No classes found", classes: [] });
    }
     
    // Send response with retrieved data
    res.status(200).json(rows);

  } catch (error) {
    console.error("Error retrieving class data:", error);

    // Handle JWT-specific errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } 

    // Handle SQL errors
    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({ success: false, message: "Invalid database field in query" });
    } else if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "Database table not found" });
    }

    // Handle other server errors
    res.status(500).json({ success: false, message: "Failed to retrieve classes" });

  } finally {
    if (connection) connection.release(); // Ensure connection is always released
  }
});



router.get("/get/lect/subjects/", async (req, res) => {
  let connection;

  try {
    const token = req.cookies.att2day;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = req.query;

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Query to get classes for the lecturer
    const attendanceQuery = `
SELECT 
    ls.subject_name,
    ls.class_id,
    lc.year,
    lc.section,
    lc.sem,
    lc.course
FROM 
    lecturer_subjects ls
JOIN 
    lect_classes lc ON ls.class_id = lc.id
WHERE 
    ls.Lecturer_Id = ?;
    `;

    // Execute the query and retrieve the result
    const [rows] = await connection.query(attendanceQuery, [Id]);

    // If no classes are found, return an empty array with success message
    if (rows.length === 0) {
      return res.status(200).json({  success: true, message: "No subjects found", classes: [] });
    }
    
    // Send response with retrieved data
    res.status(200).json({success: true, message: rows});

  } catch (error) {
    console.error("Error retrieving class data:", error);

    // Handle JWT-specific errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } 

    // Handle SQL errors
    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({ success: false, message: "Invalid database field in query" });
    } else if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "Database table not found" });
    }

    // Handle other server errors
    res.status(500).json({ success: false, message: "Failed to retrieve classes" });

  } finally {
    if (connection) connection.release(); // Ensure connection is always released
  }
});

router.get("/lec/taken", async (req, res) => {
  let connection;

  try {
    
     const token = req.cookies.att2day;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = req.query;
  
    // Get a connection from the pool
  
    connection = await pool.getConnection();

    // Query to get classes for the lecturer
    const attendanceQuery = `
      SELECT 
  a.Subject,
  a.Year,
  a.Section,
  a.Sem,
  a.Course,
  COUNT(d.id) AS Count
FROM 
  lect_attendancesheet a
JOIN 
 lecturer_attendance_log d ON a.Id = d.attendance_sheet_id
WHERE 
  a.Lect_Id = ?
GROUP BY 
  a.Id, a.Name, a.Subject, a.Year, a.Section, a.Sem, a.Course, a.Lect_Id;
    `;

    // Execute the query and retrieve the result
    const [rows] = await connection.query(attendanceQuery, [Id]);

    // If no classes are found, return an empty array with success message
    if (rows.length === 0) {
      return res.status(200).json({ success: true, message: "No classes found", classes: [] });
    }
     
    // Send response with retrieved data
    res.status(200).json(rows);

  } catch (error) {
    console.error("Error retrieving class data:", error);

    // Handle JWT-specific errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } 

    // Handle SQL errors
    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({ success: false, message: "Invalid database field in query" });
    } else if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "Database table not found" });
    }

    // Handle other server errors
    res.status(500).json({ success: false, message: "Failed to retrieve classes" });

  } finally {
    if (connection) connection.release(); // Ensure connection is always released
  }
});



router.get('/student/results/', async (req, res) => {
  const token = req.cookies.att2day;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token missing' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
    });
  }

  const { Regno } = req.query;
  if (!Regno) {
    return res.status(400).json({ success: false, message: 'Missing class_id in query parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `SELECT  Regno, subject_name as SubjectName,marks_obtained as marks,max_marks as totalmarks ,exam_name as examname
  FROM Internal_results  
  WHERE Regno=?
    AND status = 'approved'`;
    const [rows] = await connection.query(query, [Regno]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error executing query:', error);
    if (error.code === 'ER_PARSE_ERROR') {
      res.status(400).json({ success: false, message: 'SQL syntax error' });
    } else {
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } finally {
    if (connection) connection.release();
  }
});


router.get('/getattendance/lect/single/', async (req, res) => {
  let connection;
  try {
    const token = req.cookies.att2day;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

    const decoded = jwt.verify(token, secretKey);
    const Id  = req.query.Id;
   
    const query = "SELECT is_present FROM attendance WHERE student_id = ?";
    
    connection = await pool.getConnection();
    const [result] = await connection.query(query, [Id]);
    connection.release();

    if (!result.length) {
      return res.status(200).json({ success: true, message: { total_classes: 0, attended_classes: 0 } });
    }

    const totalClasses = result.length;
    const attendedClasses = result.filter(row => row.is_present === 1).length;

    res.status(200).json({
      success: true,
      message: {
        total_classes: totalClasses,
        attended_classes: attendedClasses
      }
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
    } else {
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
});

router.get('/collegefeedue/list/', async (req, res) => {
    const token = req.cookies.att2day;
     const {regno}=req.query
    if (!token) {
        return res.status(401).json({ success: false, message: 'Authorization token missing' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
        }
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', error: error.message });
    }

    const { Regno } = decoded;
    let connection;

    try {
        connection = await pool.getConnection();

        const query = `SELECT Fee_type, Fee_year, Fee_due FROM yearly_fees WHERE regno = ?`;
        const [fees] = await connection.query(query, [regno]); // Extract rows properly

        res.status(200).json({ success: true, message: fees });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
});

    module.exports = router;