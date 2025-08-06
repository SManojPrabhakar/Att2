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
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
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
     
      return res.status(404).json({ success: false, message: 'No students under your college' });
    }

    // Map through all students and get signed URLs
    const studentsWithSignedUrls = await Promise.all(
      rows.map(async (student) => {
        let profilepic = '';
        if (student.ProfilePic) {
          try {
            const profileParams = {
              Bucket: process.env.Bucket,
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
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
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
              Bucket: process.env.Bucket,
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


router.get('/college/admin/', async (req, res) => {

  let connection;
  
  try {
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
   
    let decoded;
   
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Unauthorized:Token expired" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ success: false, message: "Unauthorized:Invalid token" });
      } else {
        return res.status(401).json({ success: false, message: "Unauthorized access" });
      }
    }

    const fondid = decoded.Id; 
    const collegecode= req.query.collegename;

    const query = `SELECT Fullname as Name, Profile as ProfilePic,Regno FROM lecturer WHERE College_Code =? And Role="Admin"`;

    connection = await pool.getConnection();

    const [rows] = await connection.query(query, [collegecode]);

    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No Admins  under your college' });
    }
   
      // Map through all students and get signed URLs
    const studentsWithSignedUrls = await Promise.all(
      rows.map(async (student) => {
        let profilepic = '';
        if (student.ProfilePic) {
          try {
            const profileParams = {
              Bucket: process.env.Bucket,
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



router.get('/student/results/', async (req, res) => {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
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

    const query = `SELECT Regno, subject_name as SubjectName,marks_obtained as marks,max_marks as totalmarks ,exam_name as examname
  FROM internal_results 
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



router.get("/classes/", async (req, res) => {
  let connection;

  try {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
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
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const { Id } = req.query;

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Query to get classes for the lecturer
    const attendanceQuery = `
SELECT 
    ls.subject_name as subjectname,
    ls.subject_code as subjectcode,
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
      return res.status(200).json({ success: true, message:[] });
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


router.get('/student/external/', async (req, res) => {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

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
 const { regno} = req.query;
  if (!regno) {
    return res.status(400).json({ success: false, message: 'Missing required query parameters' });
  }
  
  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
    SELECT 
        Regno,
        Subject_Name AS SubjectName,
        exam_name AS examname,
        internalmarks ,
        internaltotal ,
        marks_obtained AS externalmarks,
        max_marks AS externaltotal,
        (IFNULL(internalmarks, 0) + IFNULL(marks_obtained, 0)) AS total_marks,
        (IFNULL(internaltotal, 0) + IFNULL(max_marks, 0)) AS total_max,
        CASE
          WHEN marks_obtained IS NULL THEN 'F'
          WHEN ((IFNULL(internalmarks, 0) + IFNULL(marks_obtained, 0)) * 100 /
                (IFNULL(internaltotal, 0) + IFNULL(max_marks, 0))) >= 90 THEN 'A'
          WHEN ((IFNULL(internalmarks, 0) + IFNULL(marks_obtained, 0)) * 100 /
                (IFNULL(internaltotal, 0) + IFNULL(max_marks, 0))) >= 80 THEN 'B'
          WHEN ((IFNULL(internalmarks, 0) + IFNULL(marks_obtained, 0)) * 100 /
                (IFNULL(internaltotal, 0) + IFNULL(max_marks, 0))) >= 70 THEN 'C'
          WHEN ((IFNULL(internalmarks, 0) + IFNULL(marks_obtained, 0)) * 100 /
                (IFNULL(internaltotal, 0) + IFNULL(max_marks, 0))) >= 60 THEN 'D'
          WHEN ((IFNULL(internalmarks, 0) + IFNULL(marks_obtained, 0)) * 100 /
                (IFNULL(internaltotal, 0) + IFNULL(max_marks, 0))) >= 40 THEN 'E'
          ELSE 'F'
        END AS grade
      FROM external_results
      WHERE Regno = ?
        AND status = 'approved';

    `;

    const values = [
       regno
      
    ];

    const [rows] = await connection.query(query, values);
    res.status(200).json(rows);

  } catch (error) {
    console.error('Error executing results query:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    if (connection) connection.release();
  }
});

router.get("/lec/taken", async (req, res) => {
  let connection;

  try {
    
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

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


    module.exports = router;


   