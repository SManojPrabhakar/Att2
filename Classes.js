const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const s3 = require('./awsConfig');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY
const Buck =process.env.Bucket
const multer = require('multer')
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });
const pool = require('./config.js');


router.post("/classes/new/incharge/", async (req, res) => {
  let connection;
  try {
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    const { Course, Year, Section, Sem, Name, Role, college_name, Regulation } = req.body;

    if (!Course || !Year || !Section || !Sem || !Name || !Role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Updated duplicate check: include Section
    const checkDuplicateQuery = `
      SELECT COUNT(*) AS count FROM lect_classes 
      WHERE Leact_Id = ? AND name = ? AND section = ?
    `;
    const [duplicateResult] = await connection.query(checkDuplicateQuery, [Id, Name, Section]);

    if (duplicateResult[0].count > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({
        success: false,
        message: "Class with this name and section already exists for this lecturer"
      });
    }

    // Insert into lect_classes
    const insertClassQuery = `
      INSERT INTO lect_classes (Leact_Id, name, year, course, sem, Role, section, regulation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [insertResult] = await connection.query(insertClassQuery, [
      Id, Name, Year, Course, Sem, Role, Section, Regulation
    ]);

    const classId = insertResult.insertId;

    // Update students table
    const updateQuery = `
      UPDATE students
      SET class_id = ?
      WHERE College_Name = ?
        AND year = ?
        AND sem = ?
        AND course = ?
        AND section = ?
    `;
    await connection.query(updateQuery, [
      classId, college_name, Year, Sem, Course, Section
    ]);

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


router.post("/classes/new/mentor/", async (req, res) => {
  let connection;
  try {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    const { Course, Year, Section, Sem, Name, Role } = req.body;

    if (!Course || !Year || !Section || !Sem || !Name || !Role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    connection = await pool.getConnection();

 
    const checkDuplicateQuery =` 
      SELECT COUNT(*) AS count FROM lect_classes 
      WHERE Leact_Id = ? AND name = ?`
    ;
    const [result] = await connection.query(checkDuplicateQuery, [Id, Name]);

    if (result.count > 0) {
      connection.release();
      return res.status(409).json({ success: false, message: "Class with this name already exists for this lecturer" });
    }

    
    const attendanceQuery = `
      INSERT INTO lect_classes (Leact_Id, name, year, course, sem, Role, section)
      VALUES (?, ?, ?, ?, ?, ?, ?)`
    ;

    await connection.query(attendanceQuery, [Id, Name, Year, Course, Sem, Role, Section]);

    connection.release();
    res.status(201).json({ success: true, message: "Class created successfully" });

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

router.put("/timetable/", async (req, res) => {
  let connection;
  try {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);

    
    const {id,  days} = req.body;
   
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


router.post("/subjects/", async (req, res) => {
  let connection;

  try {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    jwt.verify(token, secretKey); // Validate token

    const { id: classid, subjects } = req.body;

    if (!classid || !Array.isArray(subjects)) {
      return res.status(400).json({ success: false, message: "Missing or invalid 'classid' or 'subjects'" });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Step 1: Delete old subjects for this class
    await connection.query(`DELETE FROM subjects WHERE classid = ?`, [classid]);

    // Step 2: Insert new subjects into subjects table
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

    // Step 3: Insert into lecturer_subjects
    const insertLecturerValues = subjects.map(subj => [
      classid,
      subj.code,
      subj.name,
      subj.lecturerId
    ]);

    if (insertLecturerValues.length > 0) {
      await connection.query(
        `INSERT INTO lecturer_subjects (class_id,subject_code, subject_name, lecturer_id) VALUES ?`,
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



router.get("/collegetype/", async (req, res) => {
  let connection;
  try {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const { email, Regno } = decoded;

    const {college_name} = req.query // Extract from query parameters
   
    if (!college_name) {
      return res.status(400).json({ success: false, message: "College name is required" });
    }

    // Query to get collegetype from the register table
    const collegetypeQuery = `SELECT college_type 
    FROM register 
    WHERE College_Code =?`
  
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



router.get("/exam/type/", async (req, res) => {
  let connection;
  try {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const { classid, collegeName } = req.query;

    if (!collegeName || !classid) {
      return res.status(400).json({ success: false, message: "classid and collegeName are required" });
    }

    const examQuery = `
      SELECT DISTINCT et.examination_name
      FROM exam_timetable et
      JOIN lect_classes lc
        ON et.year = lc.year
        AND et.sem = lc.sem
        AND et.course = lc.course
        AND et.regulation = lc.regulation
      JOIN lecturer l ON et.lecturer_id = l.id
      WHERE lc.id = ?
        AND et.lecturer_id = ?
        AND l.college_name = ?;
    `;

    connection = await pool.getConnection();
    const [rows] = await connection.query(examQuery, [classid, decoded.Id, collegeName]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No exam types found for the given class ID" });
    }

    return res.status(200).json({ success: true, examTypes: rows });

  } catch (error) {
    console.error("Error fetching exam types:", error);

    if (connection) connection.release();

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({ success: false, message: "Invalid field in SQL query" });
    } else if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "Database table not found" });
    } else if (error.code === "ER_PARSE_ERROR") {
      return res.status(400).json({ success: false, message: "SQL syntax error" });
    } else {
      return res.status(500).json({ success: false, message: "Failed to retrieve exam types" });
    }
  }
});



router.get("/classes/get/", async (req, res) => {
  let connection;

  try {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Query to get classes for the lecturer
    const attendanceQuery = `
      SELECT Id, Name, Year, Sem, Course, Role, Section ,Regulation
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
    const { Id } = decoded;
 
    // Get a connection from the pool
    connection = await pool.getConnection();

    // Query to get classes for the lecturer
    const attendanceQuery = `
SELECT 
    ls.subject_name as subjectname,
    ls.subject_code as subjectcode,
    ls.class_id as classid,
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


router.get('/subjects/list/', async (req, res) => {
 const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

  let decoded;
  try {
      decoded = jwt.verify(token, secretKey);
  } catch (error) {
      if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
      }
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', error: error.message });
  }
const {id}=req.query

  let connection;

  try {
      connection = await pool.getConnection();

      const query = `SELECT subject_code,subject_name,lecturer_name FROM subjects WHERE classid=?`;
      const [fees] = await connection.query(query,[id]); // Extract rows properly

      res.status(200).json(fees);
  } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release(); // Ensure connection is released
  }
});

router.get('/incharge/results/', async (req, res) => {
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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Missing class_id in query parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      SELECT ir.regno AS Regno,
             ir.subject_name AS SubjectName,
             ir.marks_obtained AS marks,
             ir.max_marks AS totalmarks,
             ir.exam_name AS examname
      FROM internal_results ir
      JOIN students s ON ir.regno = s.regno
      WHERE s.class_id = ?
        AND ir.status = 'submitted'
    `;

    const [rows] = await connection.query(query, [id]);

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


router.get('/edit/results/', async (req, res) => {
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

  const { Id } = decoded; // Lecturer ID from token
  const { classId, subjectName, examname } = req.query;

  if (!classId || !subjectName || !examname) {
    return res.status(400).json({ success: false, message: 'Missing required query parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Step 1: Get college name of the lecturer
    const [lecturerRow] = await connection.query(
      `SELECT college_name FROM lecturer WHERE Id = ?`,
      [Id]
    );

    if (!lecturerRow.length) {
      return res.status(404).json({ success: false, message: 'Lecturer not found' });
    }

    const collegeName = lecturerRow[0].college_name;

    // Step 2: Query filtered internal results
    const [rows] = await connection.query(
      `SELECT ir.regno AS Regno,
              ir.subject_name AS SubjectName,
              ir.marks_obtained AS marks,
              ir.max_marks AS totalmarks
       FROM internal_results ir
       JOIN lecturer l ON ir.added_by = l.Id
       WHERE ir.subject_name = ?
         AND ir.exam_name = ?
         AND ir.status != 'approved'
         AND ir.regno IN (
             SELECT s.regno FROM students s WHERE s.class_id = ?
         )
         AND l.college_name = ?`,
      [subjectName, examname, classId, collegeName]
    );
  
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    if (connection) connection.release();
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
  let connection;
  try {
    connection = await pool.getConnection();

    const query = `SELECT Regno, Subject_Name as SubjectName,marks_obtained as marks, max_marks as totalmarks,
    exam_name as examname
  FROM internal_results 
  WHERE Regno=?
    AND status = 'approved'`;
    const [rows] = await connection.query(query, [decoded.Regno]);
  
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

  const { year, sem } = req.query;

  if (!year || !sem) {
    return res.status(400).json({ success: false, message: 'Missing year or semester' });
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
        AND year = ?
        AND sem = ?
        AND status = 'approved';
    `;

    const [rows] = await connection.query(query, [decoded.Regno, year, sem]);
    res.status(200).json(rows);

  } catch (error) {
    console.error('Error executing results query:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    if (connection) connection.release();
  }
});


router.put("/marks/submitted/", async (req, res) => {
  let connection;

  try {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);

    let marksList = req.body;

    // Normalize to array if single object is sent
    if (!Array.isArray(marksList)) {
      marksList = [marksList];
    }

    if (marksList.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or empty marks list" });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const { classid, examname } of marksList) {
      if (!classid || !examname) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Each entry must include classid and examname"
        });
      }

      const [result] = await connection.query(`
        UPDATE internal_results ir
JOIN lect_classes lc
  ON ir.sem = lc.sem
  AND ir.year = lc.year
  AND ir.regulation = lc.regulation
SET ir.status = 'approved',
    ir.approved_by = ?,
    ir.approved_at = NOW()
WHERE lc.id = ? AND ir.exam_name = ?`
,
        [decoded.Id, classid, examname]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: `No records found for Class ID: ${classid}, Exam: ${examname}`
        });
      }
    }

    await connection.commit();
    res.status(200).json({ success: true, message: "Marks status updated to approved" });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error approving marks:", error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Token has expired" });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "Invalid token" });
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(400).json({ success: false, message: "Database field error" });
    } else if (error.code === 'ER_PARSE_ERROR') {
      return res.status(400).json({ success: false, message: "SQL syntax error" });
    } else {
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }

  } finally {
    if (connection) connection.release();
  }
});


router.put("/marks/updated/", async (req, res) => {
  let connection;

  try {
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const marksList = req.body;
   
     

    if (!Array.isArray(marksList) || marksList.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or empty marks list" });
    }

    const classid = marksList[0]?.classid;
    const subjectName = marksList[0]?.subjectName;
    const examname = marksList[0]?.examname;

    if (!classid || !subjectName || !examname) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Fetch class info
    const [classData] = await connection.query(
      `SELECT course, sem, year, regulation FROM lect_classes WHERE id = ?`,
      [classid]
    );

    if (!classData.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const { course, sem, year, regulation } = classData[0];

    for (const entry of marksList) {
      const { regno, marks } = entry;

      if (!regno || typeof marks !== 'number') {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Each entry must include regno and numeric marks" });
      }

      // Check if record exists
      const [existing] = await connection.query(
        `SELECT id, max_marks, status FROM internal_results 
         WHERE regno = ? AND subject_name = ? AND exam_name = ?
            AND sem = ? AND year = ? AND regulation = ?`,
        [regno, subjectName, examname,sem, year, regulation]
      );


      if (!existing.length) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: `Result not found for ${regno}` });
      }

      const { id, max_marks, status } = existing[0];

      if (status === 'approved') {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: `Marks already submitted or approved for Regno: ${regno}`
        });
      }

      const resultStatus = marks >= max_marks * 0.4 ? 'pass' : 'fail';

      await connection.query(
        `UPDATE internal_results 
         SET marks_obtained = ?, result_status = ?, status = 'submitted', added_by = ?, added_on = NOW()
         WHERE id = ?`,
        [marks, resultStatus, decoded.Id, id]
      );
    }

    await connection.commit();
    res.status(200).json({ success: true, message: "Marks updated successfully" });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error:", error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Token expired" });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    res.status(500).json({ success: false, message: "Internal server error" });

  } finally {
    if (connection) connection.release();
  }
});

router.get('/subject-time', async (req, res) => {
  let connection;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token', error: error.message });
  }

  const { subject, id } = req.query;
  if (!subject) {
    return res.status(400).json({ message: 'Subject query param is required' });
  }

  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT timetable FROM lect_classes WHERE id = ?', [id]);

    const result = [];

    for (const row of rows) {
      const timetable = row.timetable; // ❌ no JSON.parse()
      for (const dayObj of timetable) {
        const matches = dayObj.periods.filter(p => p.name === subject);
        matches.forEach(match => {
          result.push({
            day: dayObj.day,
            startTime: match.startTime,
            endTime: match.endTime
          });
        });
      }
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Subject not found in any timetable' });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
});




router.get('/timetable/list/', async (req, res) => {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  let decoded;
  try {
      decoded = jwt.verify(token, secretKey);
  } catch (error) {
      if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
      }
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', error: error.message });
  }
const {id}=req.query
  let connection;

  try {
      connection = await pool.getConnection();

      const query = `SELECT  timetable FROM lect_classes 
        Where Id = ?;`
      const [fees] = await connection.query(query, [id]); // Extract rows properly

      res.status(200).json(fees[0]);
  } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release(); // Ensure connection is released
  }
});




router.get('/examtimetable/list/', async (req, res) => {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  let decoded;
  try {
      decoded = jwt.verify(token, secretKey);
  } catch (error) {
      if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
      }
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', error: error.message });
  }
const {year,sem,course,regulation}=req.query

  let connection;

  try {
      connection = await pool.getConnection();

      const query = `SELECT examination_name,subject_name,starttime,endtime,exam_date  FROM exam_timetable 
        Where year=?
        AND course=?
        and sem=?
        and regulation=?`
      const [fees] = await connection.query(query,[year,course,sem,regulation]); // Extract rows properly

      res.status(200).json(fees);
  } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release(); // Ensure connection is released
  }
});



router.delete('/timetable/delete/', async (req, res) => {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  let decoded;
  try {
      decoded = jwt.verify(token, secretKey);
  } catch (error) {
      if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
      }
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', error: error.message });
  }

  const { id } = req.query; // Or req.body if sending in body
  if (!id) {
      return res.status(400).json({ success: false, message: 'Missing timetable ID' });
  }

  let connection;

  try {
      connection = await pool.getConnection();

      const query = `DELETE FROM lect_classes WHERE Id = ?`;
      const [result] = await connection.query(query, [id]);

      if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'No timetable found with the given ID' });
      }

      res.status(200).json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
      console.error('Error executing delete query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release();
  }
});



router.patch('/classeid/delete', async (req, res) => {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

  let decoded;
  try {
      decoded = jwt.verify(token, secretKey);
  } catch (error) {
      if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
      }
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', error: error.message });
  }

  const { Regno } = req.query; // Or req.body if sending in body

  if (!Regno) {
      return res.status(400).json({ success: false, message: 'Missing timetable ID' });
  }

  let connection;

  try {
      connection = await pool.getConnection();

      const query = `UPDATE students SET class_id = NULL WHERE regno = ?`;
      const [result] = await connection.query(query, [Regno]);

      if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'No timetable found with the given ID' });
      }

      res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
      console.error('Error executing delete query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release();
  }
});


router.delete("/classes/delete/:className/", async (req, res) => {
  let connection;

  try {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    const { className } = req.params;

    connection = await pool.getConnection();

    // Check if class exists
    const checkQuery = `SELECT Id FROM lect_classes WHERE Id = ?`;
    const [existingClass] = await connection.query(checkQuery, [className]);

    if (existingClass.length === 0) {
      return res.status(404).json({ success: false, message: "Class not found or unauthorized" });
    }

    // Start transaction
    await connection.beginTransaction();

    // Delete related entries from student_subjects
    await connection.query(`DELETE FROM subjects WHERE classid = ?`, [className]);

    // Delete related entries from lecturer_subjects
    await connection.query(`DELETE FROM lecturer_subjects WHERE class_id = ?`, [className]);

    // Now delete the class itself
    await connection.query(`DELETE FROM lect_classes WHERE Id = ?`, [className]);

    // Commit the transaction
    await connection.commit();

    res.status(200).json({ success: true, message: "Class and related subjects deleted successfully" });

  } catch (error) {
    if (connection) await connection.rollback(); // Rollback on error
    console.error("Error deleting class:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    res.status(500).json({ success: false, message: "Failed to delete class and related data" });

  } finally {
    if (connection) connection.release();
  }
});




router.get("/attendancesheets/get/", async (req, res) => {
  let connection;

  try {
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

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




router.post("/attendance/new/", async (req, res) => {
  let connection;
  
  try {
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

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

    res.status(201).json({ success: true, message: "Class created successfully" });

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

router.delete("/attendancesheets/delete/:className/", async (req, res) => {
  let connection;

  try {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded; // Lecturer ID

    const { className } = req.params; // Class name from the request

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Check if the class exists and belongs to the lecturer
    const checkQuery = `SELECT Id FROM lect_attendancesheet WHERE Id = ?`;
    const [existingClass] = await connection.query(checkQuery, [className]);

    if (existingClass.length === 0) {
      return res.status(404).json({ success: false, message: "Attendancesheet not found or unauthorized" });
    }

    // Delete the class
    const deleteQuery = `DELETE FROM lect_attendancesheet WHERE Id = ?`;
    await connection.query(deleteQuery, [className]);

    res.status(200).json({ success: true, message: "Attendancesheet deleted successfully" });

  } catch (error) {
    console.error("Error deleting class:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    res.status(500).json({ success: false, message: "Failed to delete class" });

  } finally {
    if (connection) connection.release(); // Ensure connection is always released
  }
});

router.get("/search/get/", async (req, res) => {
  let connection;

  try {
    // Check for authorization token
    const authHeader = req.headers.authorization;
   console.log(authHeader)
if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    // Verify token
    try {
      jwt.verify(token, secretKey);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
      }
    }

    // Get college name from query parameters
    const collegeName = req.query.college_name;
    console.log(collegeName)
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "Bad Request: college_name is required" });
    }

    // Database query to fetch student details
    const attendanceQuery = `
      SELECT Regno, Fullname, Profile, Year, Sem, Section, Course
      FROM students 
      WHERE college_name = ?;
    `;

    // Get database connection
    connection = await pool.getConnection();
    const [rows] = await connection.query(attendanceQuery, [collegeName]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No students found for this college" });
    }

    // Generate pre-signed URLs for profile images
    const studentsWithProfileUrls = await Promise.all(
      rows.map(async ({ Regno, Fullname, Year, Sem,Section,Course, Profile }) => {
        let profileUrl = null;
        if (Profile) {
          try {
            profileUrl = s3.getSignedUrl("getObject", {
              Bucket:process.env.Bucket,
              Key: Profile,
              Expires: 3600, // 1 hour expiration
            });
          } catch (s3Error) {
            console.error("Error generating S3 URL:", s3Error);
          }
        }
        return { Regno, Fullname, Year, Sem,Section,Course, Profilepic: profileUrl };
      })
    );
   console.log(studentsWithProfileUrls)
    res.status(200).json(studentsWithProfileUrls);
  } catch (error) {
    console.error("Error retrieving student data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
});


router.post("/uploadassignment/", upload.single('file'), async (req, res) => {
  let connection;

  try {
    // ✅ 1. Verify Token
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

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
      Bucket: Buck,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
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



router.get("/search/home/", async (req, res) => {
  let connection;

  try {
    // Check for authorization token
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    // Verify token
    try {
      jwt.verify(token, secretKey);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
      }
    }

    // Database query to fetch student and lecturer details
    const attendanceQuery = `
   SELECT Fullname, Profile, regno,  Role FROM students
UNION
SELECT Fullname, Profile, regno,  Role FROM lecturer
UNION
SELECT Fullname, Profile, Id AS regno, Role FROM fond;




    `;

    // Get database connection
    connection = await pool.getConnection();
    const [rows] = await connection.query(attendanceQuery);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No students or lecturers found" });
    }

    // Generate pre-signed URLs for profile images
    const profilesWithUrls = await Promise.all(
      rows.map(async ({ Fullname,regno, Profile,Role }) => {
        let profileUrl = null;
        if (Profile) {
          try {
            profileUrl = s3.getSignedUrl("getObject", {
              Bucket: Buck,
              Key: Profile,
              Expires: 3600, // 1 hour expiration
            });
          } catch (s3Error) {
            
          }
        }
        return { Fullname, regno,Profilepic: profileUrl,Role };
      })
    );
  
    res.status(200).json(profilesWithUrls);
  } catch (error) {
    console.error("Error retrieving student and lecturer data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/assignments/', async (req, res) => {
 

   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  const { id } = req.query;

  

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
      [id]
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
              Bucket: Buck,
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

    res.status(200).json({ success: true, assignments: assignmentsWithUrls });

  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/upload/subjectmarks/", async (req, res) => {
  let connection;

  try {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const lecturerId = decoded.Id;

    const {
      classid,
      subjectName,
      subjectCode,
      totalMarks,
      examName,
      marks
    } = req.body;

    if (
      !classid || !subjectName || !subjectCode || !totalMarks ||
      !examName || !Array.isArray(marks) || marks.length === 0
    ) {
      return res.status(400).json({ success: false, message: "Missing or invalid input data" });
    }

    connection = await pool.getConnection();

    // Get year, sem, regulation from class_id
    const [classRows] = await connection.query(
      `SELECT year, sem, regulation FROM lect_classes WHERE id = ? LIMIT 1`,
      [classid]
    );

    if (classRows.length === 0) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const { year, sem, regulation } = classRows[0];

    // ❗ Check for existing records to prevent duplicates
    const [existing] = await connection.query(
      `SELECT COUNT(*) as count FROM internal_results 
       WHERE subject_name = ? AND exam_name = ? AND year = ? AND sem = ? AND regulation = ?`,
      [subjectName, examName, year, sem, regulation]
    );

    if (existing[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `Marks for subject '${subjectName}' and exam '${examName}' already uploaded for this class.`
      });
    }

    // Prepare values with pass/fail logic
    const values = marks.map(m => {
      const resultStatus = m.marks >= totalMarks * 0.4 ? 'pass' : 'fail'; // 40% rule
      return [
        m.regno,
        subjectName,
        subjectCode,
        year,
        sem,
        regulation,
        examName,
        m.marks,
        totalMarks,
        'submitted',
        lecturerId,
        new Date(),
        resultStatus
      ];
    });

    const insertQuery = `
      INSERT INTO internal_results (
        regno, subject_name, subject_code,
        year, sem, regulation, exam_name,
        marks_obtained, max_marks, status,
        added_by, added_on, result_status
      ) VALUES ?
    `;

    await connection.query(insertQuery, [values]);

    res.status(200).json({ success: true, message: "Internal marks uploaded successfully" });

  } catch (err) {
    console.error("Error uploading internal marks:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    } else if (err.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({ success: false, message: "Invalid field in query" });
    } else if (err.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "Database table not found" });
    }

    res.status(500).json({ success: false, message: "Internal server error" });

  } finally {
    if (connection) connection.release();
  }
});



module.exports = router;