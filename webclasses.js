const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const s3 = require('./awsConfig');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY
const multer = require('multer')
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });
const pool = require('./config.js');



router.post("/classes/new/incharge/", async (req, res) => {
  let connection;
  try {
   const token = req.cookies.att2day;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    const { Course, Year, Section, Sem, Name, Role, college_name,regulation } = req.body;

    if (!Course || !Year || !Section || !Sem || !Name || !Role ||!regulation) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    connection = await pool.getConnection();

    // Start transaction
    await connection.beginTransaction();

    // Check for duplicates
    const checkDuplicateQuery = `
      SELECT COUNT(*) AS count FROM lect_classes 
      WHERE Leact_Id = ? AND name = ? And Section=?
    `;
    const [duplicateResult] = await connection.query(checkDuplicateQuery, [Id, Name,Section]);

    if (duplicateResult[0].count > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ success: false, message: "Class with this name already exists for this lecturer" });
    }

    // Insert into lect_classes
    const insertClassQuery = `
      INSERT INTO lect_classes (Leact_Id, name, year, course, sem, Role, section,regulation)
      VALUES (?, ?, ?, ?, ?, ?, ?,?)
    `;
    const [insertResult] = await connection.query(insertClassQuery, [Id, Name, Year, Course, Sem, Role, Section,regulation]);
    const classId = insertResult.insertId;
     
    const updateQuery = `
      UPDATE students
      SET class_id = ?
      WHERE College_Name = ?
      And year=?
      And sem=?
      And course=?
      And section=?
    `;
    const [updateResult] = await connection.query(updateQuery, [classId, college_name, Year, Sem,  Course, Section]);

    // Commit transaction if all queries succeeded
    await connection.commit();
    connection.release();

    res.status(200).json({ success: true, message: "Class created successfully" });

  } catch (error) {
    console.error("Transaction failed:", error);

    if (connection) {
      await connection.rollback();
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Duplicate entry: Class already exists" });
    } else {
      return res.status(500).json({ success: false, message: "Transaction failed. Internal Server Error" });
    }
  }
});


router.post("/attendance/new/", async (req, res) => {
  let connection;
  
  try {
    const token = req.cookies.att2day;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    // Extract required fields from request body
    const { Subject,  Course, Year, Section, Sem, Name } = req.body;

    if ( !Subject || !Course || !Year || !Section || !Sem || !Name) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
 
    // Get database connection
    connection = await pool.getConnection();

    // Check if an attendance sheet already exists
    const checkQuery = `
      SELECT * FROM lect_attendancesheet 
      WHERE Lect_Id = ? AND subject = ? AND year = ? AND course = ? AND sem = ? AND section = ?
    `;

    const [existing] = await connection.query(checkQuery, [Id, Subject, Year, Course, Sem, Section]);

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Attendance sheet already exists" });
    }

    // Insert attendance sheet
    const attendanceQuery = `
      INSERT INTO lect_attendancesheet (Lect_Id,Name, subject, year, course, sem, section)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.query(attendanceQuery, [ Id,Name,Subject, Year, Course, Sem, Section]);

    res.status(201).json({ success: true, message: "AttendanceSheet created successfully" });

  } catch (error) {
    console.error("Error inserting attendance data:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Duplicate entry found" });
    }

    res.status(500).json({ success: false, message: "Failed to insert attendance data" });

  } finally {
    if (connection) connection.release(); // Ensure connection is always released
  }
});



router.put("/timetable/", async (req, res) => {
  let connection;
  try {
    const token = req.cookies.att2day;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);

    
    const {id,  days} = req.body;
    console.log(id,days)
    const subjectsJSON = JSON.stringify(days);

if (!days) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    connection = await pool.getConnection();

  const attendanceQuery = `
     UPDATE lect_classes 
SET Timetable = ? 
WHERE Id = ?;

    `;

  await connection.query(attendanceQuery, [subjectsJSON,id]);

    connection.release();
    res.status(201).json({ success: true, message: "Timetable created successfully" });

  } catch (error) {
    console.error("Error inserting class data:", error);

    if (connection) {
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Duplicate entry: Class already exists" });
    } else {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
});
/*
router.put("/subjects/upload/", async (req, res) => {
  let connection;
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);

    
    const {classname,  subjects } = req.body;
   if (!subjects || !classname) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const subjectsJSON = JSON.stringify(subjects);

    
    connection = await pool.getConnection();

  const attendanceQuery = `
     UPDATE lect_classes 
SET subjects = ? 
WHERE Name = ?;

    `;

  await connection.query(attendanceQuery, [subjectsJSON,classname]);

    connection.release();
    res.status(201).json({ success: true, message: "Subjects added successfully" });

  } catch (error) {
    console.error("Error inserting class data:", error);

    if (connection) {
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Duplicate entry: Class already exists" });
    } else {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
});*/


router.post("/subjects/", async (req, res) => {
  let connection;

  try {
   const token = req.cookies.att2day;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    jwt.verify(token, secretKey); 

    const { classid,  subjects } = req.body;
   
    if (!classid || !Array.isArray(subjects)) {
      return res.status(400).json({ success: false, message: "Missing or invalid 'classid' or 'subjects'" });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    
    await connection.query(`DELETE FROM subjects WHERE classid = ?`, [classid]);

    
    const insertSubjectValues = subjects.map(subj => [
      classid,
      subj.code,
      subj.name,
      subj.lecturer,
      subj.lecturerId
    ]);

    if (insertSubjectValues.length > 0) {
      await connection.query(
        `INSERT INTO subjects (classid, subject_code, subject_name, lecturer_name, lecturer_id) VALUES ?`,
        [insertSubjectValues]
      );
    }

    // Prepare lecturer_subjects insert values
    const insertLecturerValues = subjects.map(subj => [
      classid,
      subj.code,
      subj.name,
      subj.lecturerId
    ]);

    if (insertLecturerValues.length > 0) {
      await connection.query(
        `INSERT INTO Lecturer_subjects (class_id,subject_code, subject_name, lecturer_id) VALUES ?`,
        [insertLecturerValues]
      );
    }

    await connection.commit();
    res.status(200).json({ success: true, message: "Subjects updated successfully" });

  } catch (error) {
    console.error("Error updating subjects:", error);

    if (connection) {
      await connection.rollback();
    }

    const jwtErrors = {
      TokenExpiredError: "Unauthorized: Token expired",
      JsonWebTokenError: "Unauthorized: Invalid token"
    };

    res.status(jwtErrors[error.name] ? 401 : 500).json({
      success: false,
      message: jwtErrors[error.name] || "Internal Server Error"
    });

  } finally {
    if (connection) connection.release();
  }
});



router.get('/lecturer/:college/', async (req, res) => {
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

  const { college } = req.params;

  // Validate route parameters
  if (!college) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      SELECT Fullname,Profile, Id 
      FROM lecturer 
      WHERE college_name = ? 
      AND (Active IS NULL OR Active = 'true')
    `;

    const [result] = await connection.query(query, [college]);
    
    connection.release(); // Release connection immediately after query

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found.' });
    }

    const formattedResult = await Promise.all(result.map(async (student) => {
      const { Profile, ...rest } = student;

      let profilepic = null;
      if (Profile) {
        try {
          const profileParams = { Bucket: 'add-imag', Key: Profile };
          profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
        } catch (err) {
          console.error(`Error retrieving image for ${Profile}:`, err);
        }
      }

      return { ...rest, profilepic };
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    if (connection) connection.release();
    
    console.error('Error executing query:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
  }
});



router.get("/classes/get/", async (req, res) => {
  let connection;

  try {
     const token = req.cookies.att2day;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    // Get a connection from the pool
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
      return res.status(200).json({ success: true, message:[] });
    }
  
    // Send response with retrieved data
    res.status(200).json({success:true,message:rows});

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



router.get("/attendancesheets/get/", async (req, res) => {
  let connection;

  try {
     const token = req.cookies.att2day;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Query to get classes for the lecturer
    const attendanceQuery = `
      SELECT Id, Name, Subject, Year, Sem, Course,  Section 
      FROM lect_attendancesheet
      WHERE Lect_Id = ?;
    `;

    // Execute the query and retrieve the result
    const [rows] = await connection.query(attendanceQuery, [Id]);

    // If no classes are found, return an empty array with success message
    if (rows.length === 0) {
      return res.status(200).json({ success: true, message: [] });
    }

    // Send response with retrieved data
    res.status(200).json({success:true,message:rows});

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


router.get('/subjects/list/', async (req, res) => {

 const token = req.cookies.att2day;
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

    const { Id } = decoded;

  let connection;

  try {
      connection = await pool.getConnection();

      const query = `SELECT 
  c.Name AS class_name,
  s.subject_code,
  s.subject_name,
  s.lecturer_name
FROM 
  subjects s
JOIN 
  lect_classes c ON s.classid = c.id
WHERE 
  c.leact_id = ?;

`;
      const [fees] = await connection.query(query, [Id]); // Extract rows properly
   
      res.status(200).json({success:true,message:fees});
  } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release(); // Ensure connection is released
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
    const { Id } = decoded;

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



router.get('/timetable/list/', async (req, res) => {
const token = req.cookies.att2day;
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
    const { Id } = decoded;

  let connection;

  try {
      connection = await pool.getConnection();

      const query = `SELECT name,id ,Timetable FROM lect_classes WHERE Leact_Id=?`;
      const [fees] = await connection.query(query, [Id]); // Extract rows properly
      
 if (fees.length === 0) {
      return res.status(200).json({ success: true, message:[] });
    }
      res.status(200).json({success:true,message:fees});
  } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release(); // Ensure connection is released
  }
});


router.get('/student/timetable/list/', async (req, res) => {
const token = req.cookies.att2day;
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
    const Id  = req.query.classid

  let connection;

  try {
      connection = await pool.getConnection();

      const query = `SELECT name,id ,Timetable FROM lect_classes WHERE id=?`;
      const fees = await connection.query(query, [Id]); // Extract rows properly

      res.status(200).json({success:true, message:fees[0]});
  } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release(); // Ensure connection is released
  }
});



router.get('/student/subjects/list/', async (req, res) => {

 const token = req.cookies.att2day;
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

    const Id  = req.query.classid
    
  let connection;

  try {
      connection = await pool.getConnection();

      const query = `SELECT subject_name,subject_code,lecturer_name FROM subjects WHERE classid=?`;
      const fees = await connection.query(query, [Id]); // Extract rows properly

      res.status(200).json({success: true, message:fees[0]});
  } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release(); // Ensure connection is released
  }
});

router.get("/collegetype/", async (req, res) => {
  let connection;
  try {
 const token = req.cookies.att2day;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { email, Regno } = decoded;

    const {college_name} = req.query // Extract from query parameters
    
    if (!college_name) {
      return res.status(400).json({ success: false, message: "College name is required" });
    }

    // Query to get collegetype from the register table
    const collegetypeQuery = `SELECT College_Type
    FROM register 
    WHERE Code =?`
  
    // Start database operations
    connection = await pool.getConnection();

    // Fetch collegetype
    const [rows] = await connection.query(collegetypeQuery, [college_name]);
  
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: "College not found in register table" });
    }
   
    
    connection.release();
     
    res.status(200).json({ success: true, collegetype: rows[0] });

  } catch (error) {
    console.error("Error fetching collegetype:", error);

    if (connection) {
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({ success: false, message: "Invalid database field name in query" });
    } else if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "Database table not found" });
    } else if (error.code === "ER_PARSE_ERROR") {
      return res.status(400).json({ success: false, message: "SQL syntax error in query" });
    } else {
      res.status(500).json({ success: false, message: "Failed to retrieve collegetype" });
    }
  }
});



router.get("/classes/without/subjects/", async (req, res) => {
  let connection;
  try {
    const token = req.cookies.att2day;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;


    const query = `
    SELECT c.Name, c.id
FROM lect_classes c
LEFT JOIN subjects s ON c.id = s.classid
WHERE s.id IS NULL  And c.Role="Class-Incharge" AND c.Leact_Id = ?
    `;

    connection = await pool.getConnection();
    const [rows] = await connection.query(query, [Id]);
    connection.release();

    res.status(200).json({ success: true, classesWithoutSubjects: rows });
  } catch (error) {
    console.error("Error fetching classes without subjects:", error);
    if (connection) connection.release();

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else {
      return res.status(500).json({ success: false, message: "Failed to retrieve classes without subjects" });
    }
  }
});

router.get("/classes/without/timetable/", async (req, res) => {
  let connection;
  try {
    const token = req.cookies.att2day;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;


    const query = `
      SELECT Name,id
      FROM lect_classes
      WHERE (timetable IS NULL OR timetable = '')
      And Role="Class-Incharge"
        AND Leact_Id = ?
    `;

    connection = await pool.getConnection();
    const [rows] = await connection.query(query, [Id]);
    connection.release();

    res.status(200).json({ success: true, classesWithoutTimetable: rows });
  } catch (error) {
    console.error("Error fetching classes without subjects:", error);
    if (connection) connection.release();

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else {
      return res.status(500).json({ success: false, message: "Failed to retrieve classes without subjects" });
    }
  }
});



router.get("/classes/assignments/", async (req, res) => {
  let connection;
  try {
    const token = req.cookies.att2day;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;


    const query = `
      SELECT Name,id
      FROM lect_classes
        where Leact_Id = ?
    `;

    connection = await pool.getConnection();
    const [rows] = await connection.query(query, [Id]);
    connection.release();

    res.status(200).json({ success: true, classes: rows });
  } catch (error) {
    console.error("Error fetching assignment classes:", error);
    if (connection) connection.release();

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else {
      return res.status(500).json({ success: false, message: "Failed to retrieve classes without subjects" });
    }
  }
});

router.get('/students/:classid/', async (req, res) => {
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

  const {classid } = req.params
  console.log(classid)
  // Validate route parameters
  if (!classid) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      SELECT Fullname, Year, Course, Section, Sem, Regno, Profile, Id 
      FROM students 
      WHERE class_id = ? 
      
    `;

    const [result] = await connection.query(query, [classid]);
   
    connection.release(); // Release connection immediately after query

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found.' });
    }

    const formattedResult = await Promise.all(result.map(async (student) => {
      const { Profile, ...rest } = student;

      let profilepic = null;
      if (Profile) {
        try {
          const profileParams = { Bucket: 'add-imag', Key: Profile };
          profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
        } catch (err) {
          console.error(`Error retrieving image for ${Profile}:`, err);
        }
      }

      return { ...rest, profilepic };
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    if (connection) connection.release();
    
    console.error('Error executing query:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
  }
});


router.get('/students/:college/:course/:section/:year/:sem', async (req, res) => {
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

  const { college, course, section, year, sem } = req.params;
 
  // Validate route parameters
  if (!college || !course || !section || !year || !sem) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      SELECT Fullname, Year, Course, Section, Sem, Regno, Profile, Id 
      FROM students 
      WHERE college_name = ? 
      AND Course = ? 
      AND Section = ? 
      AND Year = ? 
      AND Sem = ? 
      AND (Active IS NULL OR Active = 'true')
    `;

    const [result] = await connection.query(query, [college, course, section, year, sem]);
    console.log(college)
    connection.release(); // Release connection immediately after query

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found.' });
    }

    const formattedResult = await Promise.all(result.map(async (student) => {
      const { Profile, ...rest } = student;

      let profilepic = null;
      if (Profile) {
        try {
          const profileParams = { Bucket: 'add-imag', Key: Profile };
          profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
        } catch (err) {
          console.error(`Error retrieving image for ${Profile}:`, err);
        }
      }

      return { ...rest, profilepic };
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    if (connection) connection.release();
    
    console.error('Error executing query:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
  }
});


router.put("/timetable/upload/", async (req, res) => {
  let connection;
  try {
    const token = req.cookies.att2day;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);

    
    const {classname,  timetable} = req.body;
   
    if (!classname && !timetable) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const subjectsJSON = JSON.stringify(timetable);



    connection = await pool.getConnection();

  const attendanceQuery = `
     UPDATE lect_classes 
SET Timetable = ? 
WHERE Name = ?;

    `;

  await connection.query(attendanceQuery, [subjectsJSON,classname]);

    connection.release();
    res.status(200).json({ success: true, message: "Timetable created successfully" });

  } catch (error) {
    console.error("Error inserting class data:", error);

    if (connection) {
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Duplicate entry: Class already exists" });
    } else {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
});



router.post("/uploadassignment/", upload.single('file'), async (req, res) => {
  let connection;

  try {
    // ✅ 1. Verify Token
    const token = req.cookies.att2day;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired' });
      } else {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
      }
    }

    // ✅ 2. Get Data
    const { classid, subjectname, due_date } = req.body;
    const file = req.file;

    if (!classid || !subjectname || !due_date || !file) {
      return res.status(400).json({ success: false, message: 'Missing required fields or file' });
    }

    // ✅ 3. Upload to S3
    const key = `assignments/${file.originalname}`;
    const params = {
      Bucket: 'add-imag',
      Key: key,
      Body: file.buffer,
      ContentType:'application/pdf',
    };

    await s3.putObject(params).promise();

    // ✅ 4. Insert into DB
    connection = await pool.getConnection();
    const insertQuery = `
      INSERT INTO assignments (classid, subjectname, assimage, Deadline, timestamp)
      VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())
    `;

    await connection.execute(insertQuery, [
      classid,
      subjectname,
      key, // Store single string instead of JSON array
      due_date,
    ]);

    res.status(200).json({
      success: true,
      message: 'Assignment uploaded and saved successfully',
    });
  } catch (error) {
    console.error('Error during assignment upload:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});


router.get('/students/assignments/list/', async (req, res) => {
  const token = req.cookies.att2day;
 const Id  = req.query.classid

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({ message: 'Failed to verify token' });
  }

  try {
    const connection = await pool.getConnection();

    const [results] = await connection.execute(
      'SELECT subjectname, assimage, Deadline, timestamp FROM assignments WHERE classid = ?',
      [Id]
    );

    connection.release();

    const assignmentsWithUrls = await Promise.all(
      results.map(async (assignment) => {
        let imageKey = '';

        try {
          const rawImage = assignment.assimage;

          if (Array.isArray(rawImage)) {
            imageKey = rawImage[0];
          } else if (typeof rawImage === 'string') {
            if (rawImage.trim().startsWith('[')) {
              const parsed = JSON.parse(rawImage);
              imageKey = parsed[0];
            } else {
              imageKey = rawImage.split(',')[0].trim(); // handle comma-separated fallback
            }
          }

        } catch (err) {
          console.error('Error parsing assimage field:', err);
        }

        let signedUrl = '';
        try {
          if (imageKey) {
            signedUrl = await s3.getSignedUrlPromise('getObject', {
              Bucket: process.env.Bucket,
              Key: imageKey,
              Expires: 60 * 60, // 1 hour
            });
          }
        } catch (err) {
          console.error('Error generating signed URL:', err);
        }

        return {
          subjectname: assignment.subjectname,
          assimages: signedUrl || null,
          deadline: assignment.Deadline,
          timestamp: assignment.timestamp
        };
      })
    );

    res.status(200).json({ success: true, message: assignmentsWithUrls });

  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;