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


  let connection;

  try {
      connection = await pool.getConnection();

      const query = `SELECT id, examination_name,subject_name,starttime,endtime,exam_date  FROM exam_timetable 
        Where lecturer_id=?`
      const [fees] = await connection.query(query,[decoded.Id]); // Extract rows properly

      res.status(200).json(fees);
  } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release(); // Ensure connection is released
  }
});




router.get('/exam/subjects/list/', async (req, res) => {
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
const {course,year,sem,collegename,regulation}=req.query

  let connection;

  try {
      connection = await pool.getConnection();

      const query = `
SELECT DISTINCT 
    s.subject_name AS subjectname, 
    s.subject_code AS subjectcode
FROM subjects s
JOIN lect_classes c ON s.classid = c.id
JOIN lecturer l ON s.lecturer_id = l.id
WHERE c.regulation = ?
  AND c.year = ?
  AND c.course = ?
  AND c.sem = ?
  AND l.college_name = ?

  

`;
      const [fees] = await connection.query(query,[regulation,year,course,sem,collegename]); // Extract rows properly
  
      res.status(200).json(fees);
  } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release(); // Ensure connection is released
  }
});

router.get('/results/subjects/list/', async (req, res) => {
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
      message: error.name === 'TokenExpiredError' 
        ? 'Unauthorized: Token has expired' 
        : 'Unauthorized: Invalid token',
      error: error.message
    });
  }

  const { course, year, sem, collegename, regulation } = req.query;
  let connection;
  
  try {
    connection = await pool.getConnection();

    const query = `
    SELECT DISTINCT 
    et.subject_name AS subjectname, 
    et.subject_code AS subjectcode
FROM exam_timetable et
JOIN lecturer l ON et.lecturer_id = l.id
WHERE et.year = ?
  AND et.course = ?
  AND et.sem = ?
  AND et.regulation = ?
  AND l.college_name = ?

 
    `;
   

    const [subjects] = await connection.query(query, [year, course,sem, regulation, collegename]);
    console.log(subjects)
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    if (connection) connection.release();
  }
});

router.post("/exam/timetable/", async (req, res) => {
  let connection;
  try {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const { timetable } = req.body;
  
    if (
      !timetable?.examname ||
      !Array.isArray(timetable.subjects) ||
      !timetable.course ||
      !timetable.year ||
      !timetable.sem ||
      !timetable.regulation
    ) {
      return res.status(400).json({ success: false, message: "Missing required timetable fields" });
    }

    connection = await pool.getConnection();

    // Check if any timetable already exists with the same exam name and subject
    const [existing] = await connection.query(
      `SELECT 1 FROM exam_timetable 
       WHERE examination_name = ? AND course = ? AND year = ? AND sem = ? AND regulation = ? LIMIT 1`,
      [timetable.examname, timetable.course, timetable.year, timetable.sem, timetable.regulation]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Exam timetable '${timetable.examname}' already exists for this batch`
      });
    }

    // Proceed with insertion
    await connection.beginTransaction();

    const insertValues = timetable.subjects.map(entry => [
      timetable.examname,
      decoded.Id,
      timetable.regulation,
      entry.subjectCode,
      entry.subjectName,
      timetable.course,
      timetable.year,
      timetable.sem,
      entry.startTime,
      entry.endTime,
      entry.date
    ]);

    await connection.query(
      `INSERT INTO exam_timetable 
       (examination_name,lecturer_id, regulation,subject_code, subject_name, course, year, sem, starttime, endtime, exam_date) 
       VALUES ?`,
      [insertValues]
    );

    await connection.commit();
    res.status(201).json({ success: true, message: "Exam timetable added successfully" });

  } catch (error) {
    console.error("Error inserting exam timetable:", error);
    if (connection) {
      await connection.rollback();
      connection.release();
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




router.get('/student/', async (req, res) => {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized', errorMessage: error.message });
  }

  const { course, sem, year, collegename, regulation, section } = req.query;

  if (!course || !sem || !year || !collegename || !regulation) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Prepare conditionally filtered query
    const useSection = section !== undefined && section !== null && section !== '';

    const query = `
     SELECT *
FROM (
  SELECT 
    *,
    ROW_NUMBER() OVER (PARTITION BY Regno ORDER BY attempt_type) AS rn
  FROM (
    SELECT DISTINCT
      s.Fullname,
      s.Year AS Year,
      s.Course,
      s.Section,
      s.Sem AS Sem,
      s.Regno,
      s.Profile,
      s.Id,
      'regular' AS attempt_type
    FROM students s
    WHERE s.College_name = ?
      AND s.Course = ?
      AND s.Year = ?
      AND s.Sem = ?
      AND s.Regulation = ?
      ${useSection ? 'AND s.Section = ?' : ''}
      AND (s.Active IS NULL OR s.Active = 'true')

    UNION ALL

    SELECT DISTINCT
      s.Fullname,
      br.original_year AS Year,
      s.Course,
      s.Section,
      br.original_sem AS Sem,
      s.Regno,
      s.Profile,
      s.Id,
      'backlog' AS attempt_type
    FROM students s
    JOIN backlog_results br ON s.Regno = br.Regno
    WHERE s.College_name = ?
      AND s.Course = ?
      AND br.original_year = ?
      AND br.original_sem = ?
      AND br.Regulation = ?
      ${useSection ? 'AND s.Section = ?' : ''}
      AND br.result_status = 'fail'
      AND (s.Active IS NULL OR s.Active = 'true')
  ) AS combined
) AS ranked
WHERE rn = 1;

    `;

    // Build parameter list dynamically based on presence of `section`
    const values = useSection
      ? [collegename, course, year, sem, regulation, section, collegename, course, year, sem, regulation, section]
      : [collegename, course, year, sem, regulation, collegename, course, year, sem, regulation];

    const [result] = await connection.query(query, values);
    connection.release();

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






router.get("/exam/type/", async (req, res) => {
  let connection;
  try {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secretKey);
   

    const { collegename,regulation,course,year,sem } = req.query;

    if (!collegename) {
      return res.status(400).json({ success: false, message: "Collegename is required" });
    }

    const examQuery = `
SELECT DISTINCT et.examination_name 
FROM exam_timetable et
JOIN lecturer l ON et.lecturer_id = l.id
WHERE l.college_name = ?
  AND et.regulation = ?
  AND et.year = ?
  AND et.sem = ?
  AND et.course=?;
`;

    connection = await pool.getConnection();

    const [rows] = await connection.query(examQuery, [collegename,regulation,year,sem,course]);
  
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No exam types found for the given class ID" });
    }

    
    try {

    } catch (parseError) {
      return res.status(500).json({ success: false, message: "Failed to parse exam timetable JSON" });
    }

    res.status(200).json({ success: true, examTypes: rows });

  } catch (error) {
    console.error("Error fetching exam types:", error);

    if (connection) {
      connection.release();
    }

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



router.get("/exam/regulation/", async (req, res) => {
  let connection;
  try {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secretKey);
   

    const { collegename } = req.query;

    if (!collegename) {
      return res.status(400).json({ success: false, message: "Collegename is required" });
    }

    const examQuery = `
     SELECT DISTINCT s.regulation
FROM students s
WHERE s.college_name = ?;


    `;

    connection = await pool.getConnection();

    const [rows] = await connection.query(examQuery, [collegename]);
   
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No exam types found for the given class ID" });
    }

    
    try {

    } catch (parseError) {
      return res.status(500).json({ success: false, message: "Failed to parse exam timetable JSON" });
    }

    res.status(200).json(rows);

  } catch (error) {
    console.error("Error fetching exam types:", error);

    if (connection) {
      connection.release();
    }

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
/*
router.post("/upload/subjectmarks/", async (req, res) => {
  let connection;

  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const added_by = decoded.Id;

    const {
      subjectName,
      subjectcode,
      year,
      sem,
      regulation,
      examName,
      totalMarks,
      result_status = 'fail',
      status = 'submitted',
      marks
    } = req.body;

    if (!subjectName || !subjectcode || !year || !sem || !regulation || !examName || !totalMarks) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: subjectName, subjectcode, year, sem, regulation, examName, totalMarks" 
      });
    }

    if (!Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Marks must be provided as a non-empty array of { regno, marksObtained } objects" 
      });
    }

    for (const mark of marks) {
      if (!mark.regno || mark.marksObtained === undefined || mark.marksObtained === null) {
        return res.status(400).json({ 
          success: false, 
          message: "Each mark entry must contain regno and marksObtained" 
        });
      }
      if (mark.marksObtained < 0 || mark.marksObtained > totalMarks) {
        return res.status(400).json({ 
          success: false, 
          message: `Marks for student ${mark.regno} must be between 0 and ${totalMarks}` 
        });
      }
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Insert into external_results
      const externalResultsQuery = `
        INSERT INTO external_results (
          regno, subject_name, subject_code,
          year, sem, regulation, exam_name,
          marks_obtained, max_marks, result_status,
          status, added_by
        ) VALUES ?`;

      const externalValues = marks.map(mark => [
        mark.regno,
        subjectName,
        subjectcode,
        year,
        sem,
        regulation,
        examName,
        mark.marksObtained,
        totalMarks,
        mark.marksObtained >= (totalMarks * 0.4) ? 'pass' : 'fail',
        status,
        added_by
      ]);

      await connection.query(externalResultsQuery, [externalValues]);

      // 2. Insert into backlog_results for failed students
      const failedStudents = marks.filter(mark => mark.marksObtained < (totalMarks * 0.4));

      if (failedStudents.length > 0) {
        const [attemptNumbers] = await connection.query(`
          SELECT regno, MAX(attempt_number) as max_attempt
          FROM backlog_results
          WHERE subject_code = ? AND regno IN (?)
          GROUP BY regno
        `, [subjectcode, failedStudents.map(s => s.regno)]);

        const attemptMap = new Map(attemptNumbers.map(row => [row.regno, row.max_attempt]));

        const backlogQuery = `
          INSERT INTO backlog_results (
            regno, subject_name, subject_code,
            original_year, original_sem, regulation, exam_name,
            attempt_number, marks_obtained, max_marks,
            result_status, status, added_by
          ) VALUES ?`;

        const backlogValues = failedStudents.map(mark => [
          mark.regno,
          subjectName,
          subjectcode,
          year,
          sem,
          regulation,
          examName,
          (attemptMap.get(mark.regno) || 0) + 1,
          mark.marksObtained,
          totalMarks,
          'fail',
          'submitted',
          added_by
        ]);

        await connection.query(backlogQuery, [backlogValues]);
      }

      // 3. Update backlog_results for passed backlog students
      const passedBacklogStudents = marks.filter(mark => mark.marksObtained >= (totalMarks * 0.4));

      if (passedBacklogStudents.length > 0) {
        await connection.query(`
          UPDATE backlog_results 
          SET result_status = 'pass', status = 'submitted'
          WHERE subject_code = ? 
            AND regno IN (?) 
            AND result_status = 'fail'
        `, [subjectcode, passedBacklogStudents.map(s => s.regno)]);
      }

      await connection.commit();

      res.status(201).json({ 
        success: true, 
        message: `Successfully processed marks for ${marks.length} students. ${failedStudents.length} added to backlog.`,
        details: {
          totalProcessed: marks.length,
          passed: passedBacklogStudents.length,
          failed: failedStudents.length
        }
      });

    } catch (err) {
      await connection.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: "Duplicate entry detected. Some records may already exist."
        });
      }
      throw err;
    }

  } catch (err) {
    console.error("Error in /upload/subjectmarks:", err);
    const msg = err.name === "TokenExpiredError" ? "Token expired" :
                err.name === "JsonWebTokenError" ? "Invalid token" :
                "Internal server error";
    res.status(500).json({ success: false, message: msg });
  } finally {
    if (connection) connection.release();
  }
});
*/

router.post("/upload/subjectmarks/", async (req, res) => {
  let connection;

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secretKey);
    const added_by = decoded.Id;

    const {
      subjectName,
      subjectcode,
      year,
      sem,
      regulation,
      examName,
      totalMarks,
      result_status = 'fail',
      status = 'submitted',
      marks
    } = req.body;

    if (!subjectName || !subjectcode || !year || !sem || !regulation || !examName || !totalMarks) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: subjectName, subjectcode, year, sem, regulation, examName, totalMarks"
      });
    }

    if (!Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Marks must be provided as a non-empty array of { regno, marksObtained } objects"
      });
    }

    for (const mark of marks) {
      if (!mark.regno || mark.marksObtained === undefined || mark.marksObtained === null) {
        return res.status(400).json({
          success: false,
          message: "Each mark entry must contain regno and marksObtained"
        });
      }
      if (mark.marksObtained < 0 || mark.marksObtained > totalMarks) {
        return res.status(400).json({
          success: false,
          message: `Marks for student ${mark.regno} must be between 0 and ${totalMarks}`
        });
      }
    }

    connection = await pool.getConnection();

    // ✅ PRE-VALIDATION: Check for already submitted marks
    const regnos = marks.map(m => m.regno);
    const [existingMarks] = await connection.query(`
      SELECT regno FROM external_results
      WHERE subject_code = ? AND year = ? AND sem = ? AND regulation = ?
        AND regno IN (?) AND marks_obtained IS NOT NULL AND max_marks IS NOT NULL
    `, [subjectcode, year, sem, regulation, regnos]);

    if (existingMarks.length > 0) {
      const alreadySubmitted = existingMarks.map(e => e.regno);
      return res.status(400).json({
        success: false,
        message: "Oops! It looks like marks have already been submitted !",
        alreadySubmitted
      });
    }

    // ✅ Start transaction only after passing validation
    await connection.beginTransaction();

    // 1. UPDATE marks
    for (const mark of marks) {
      const result_status = mark.marksObtained >= (totalMarks * 0.35) ? 'pass' : 'fail';

      await connection.query(`
        UPDATE external_results
        SET 
          exam_name = ?, 
          marks_obtained = ?, 
          max_marks = ?, 
          result_status = ?, 
          status = ?, 
          added_by = ?
        WHERE 
          regno = ? AND subject_code = ? AND year = ? AND sem = ? AND regulation = ?
      `, [
        examName,
        mark.marksObtained,
        totalMarks,
        result_status,
        status,
        added_by,
        mark.regno,
        subjectcode,
        year,
        sem,
        regulation
      ]);
    }

    // 2. Insert failed students into backlog_results
    const failedStudents = marks.filter(mark => mark.marksObtained < (totalMarks * 0.4));

    if (failedStudents.length > 0) {
      const [attemptNumbers] = await connection.query(`
        SELECT regno, MAX(attempt_number) as max_attempt
        FROM backlog_results
        WHERE subject_code = ? AND regno IN (?)
        GROUP BY regno
      `, [subjectcode, failedStudents.map(s => s.regno)]);

      const attemptMap = new Map(attemptNumbers.map(row => [row.regno, row.max_attempt]));

      const backlogQuery = `
        INSERT INTO backlog_results (
          regno, subject_name, subject_code,
          original_year, original_sem, regulation, exam_name,
          attempt_number, marks_obtained, max_marks,
          result_status, status, added_by, added_on
        ) VALUES ?`;

      const backlogValues = failedStudents.map(mark => [
        mark.regno,
        subjectName,
        subjectcode,
        year,
        sem,
        regulation,
        examName,
        (attemptMap.get(mark.regno) || 0) + 1,
        mark.marksObtained,
        totalMarks,
        'fail',
        'submitted',
        added_by,
        new Date()
      ]);

      await connection.query(backlogQuery, [backlogValues]);
    }

    // 3. Clean up passed students from backlog
    const passedBacklogStudents = marks.filter(mark => mark.marksObtained >= (totalMarks * 0.4));

    if (passedBacklogStudents.length > 0) {
      await connection.query(`
        DELETE FROM backlog_results
        WHERE subject_code = ? 
          AND regno IN (?)
          AND result_status = 'fail'
      `, [subjectcode, passedBacklogStudents.map(s => s.regno)]);
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: `Updated marks for ${marks.length} students. ${failedStudents.length} added to backlog.`,
      details: {
        totalUpdated: marks.length,
        passed: passedBacklogStudents.length,
        failed: failedStudents.length
      }
    });

  } catch (err) {
    console.error("Error in /upload/subjectmarks:", err);
    const msg = err.name === "TokenExpiredError" ? "Token expired" :
      err.name === "JsonWebTokenError" ? "Invalid token" :
        "Internal server error";
    res.status(500).json({ success: false, message: msg });
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

  const { collegename, course, year, sem, subjectName, examName, regulation } = req.query;

  if (!collegename || !course || !year || !sem || !subjectName || !examName || !regulation) {
    return res.status(400).json({ success: false, message: 'Missing required query parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      (
        SELECT 
          er.regno as Regno,
          er.subject_name AS SubjectName,
        
          er.exam_name AS examName,
          er.marks_obtained AS marks,
          er.max_marks AS totalmarks
        FROM external_results er
        JOIN students s ON er.regno = s.Regno
        WHERE s.College_name = ?
          AND s.Course = ?
          AND er.year = ?
          AND er.sem = ?
          AND er.subject_name = ?
          AND er.exam_name = ?
          AND er.regulation = ?
          AND er.status != 'approved'
      )
      UNION
      (
        SELECT 
          br.regno as Regno,
          br.subject_name AS SubjectName,
        
          br.exam_name AS examName,
          br.marks_obtained AS marks,
          br.max_marks AS totalmarks
        FROM backlog_results br
        JOIN students s ON br.regno = s.Regno
        WHERE s.College_name = ?
          AND s.Course = ?
          AND br.original_year = ?
          AND br.original_sem = ?
          AND br.subject_name = ?
          AND br.exam_name = ?
          AND br.regulation = ?
          AND br.status != 'approved'
          And br.result_status !='pass'
      )
    `;

    const [rows] = await connection.query(query, [
      collegename, course, year, sem, subjectName, examName, regulation,
      collegename, course, year, sem, subjectName, examName, regulation
    ]);
   console.log(rows)
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    if (connection) connection.release();
  }
});

/*
router.get('/edit/results/', async (req, res) => {
  const token = req.headers.authorization;
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

  const { collegename, course, year, sem, subjectName, examName, regulation } = req.query;

  if (!collegename || !course || !year || !sem || !subjectName || !examName || !regulation) {
    return res.status(400).json({ success: false, message: 'Missing required query parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      (
        SELECT 
          er.regno as Regno,
          er.subject_name AS SubjectName,
        
          er.exam_name AS examName,
          er.marks_obtained AS marks,
          er.max_marks AS totalmarks
        FROM external_results er
        JOIN students s ON er.regno = s.Regno
        WHERE s.College_name = ?
          AND s.Course = ?
          AND er.year = ?
          AND er.sem = ?
          AND er.subject_name = ?
          AND er.exam_name = ?
          AND er.regulation = ?
          AND er.status != 'approved'
      )
      UNION
      (
        SELECT 
          br.regno as Regno,
          br.subject_name AS SubjectName,
        
          br.exam_name AS examName,
          br.marks_obtained AS marks,
          br.max_marks AS totalmarks
        FROM backlog_results br
        JOIN students s ON br.regno = s.Regno
        WHERE s.College_name = ?
          AND s.Course = ?
          AND br.original_year = ?
          AND br.original_sem = ?
          AND br.subject_name = ?
          AND br.exam_name = ?
          AND br.regulation = ?
          AND br.status != 'approved'
      )
    `;

    const [rows] = await connection.query(query, [
      collegename, course, year, sem, subjectName, examName, regulation,
      collegename, course, year, sem, subjectName, examName, regulation
    ]);
 
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    if (connection) connection.release();
  }
});
*/
router.put("/marks/updated/", async (req, res) => {
  let connection;

  try {
    // 1. JWT Verification
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (error) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }

    const result = req.body; // ✅ no 'results', direct object

    const {
      regno,
      subjectName,
      newMarks,
      examname,
      regulation,
      semester,
      year,
      totalMarks,
      subjectCode
    } = result;
   
    connection = await pool.getConnection();

    const [existingExternal] = await connection.query(
      `SELECT 1 FROM external_results
       WHERE regno = ? AND subject_name = ? AND subject_code = ? AND exam_name = ?
         AND year = ? AND sem = ? AND regulation = ?`,
      [regno, subjectName, subjectCode, examname, year, semester, regulation]
    );

    if (existingExternal.length > 0) {
      const passMark = Math.floor(totalMarks * 0.4);
      const resultStatus = newMarks >= passMark ? "pass" : "fail";

      // Update external_results
      await connection.query(
        `UPDATE external_results
         SET marks_obtained = ?, result_status = ?, status = 'submitted'
         WHERE regno = ? AND subject_name = ? AND subject_code = ? AND exam_name = ?
           AND year = ? AND sem = ? AND regulation = ?`,
        [newMarks, resultStatus, regno, subjectName, subjectCode, examname, year, semester, regulation]
      );

      if (resultStatus === "pass") {
        await connection.query(
          `DELETE FROM backlog_results
           WHERE regno = ? AND subject_name = ? AND subject_code = ? AND exam_name = ?
             AND original_year = ? AND original_sem = ? AND regulation = ?`,
          [regno, subjectName, subjectCode, examname, year, semester, regulation]
        );
      } else {
        await connection.query(
          `UPDATE backlog_results
           SET marks_obtained = ?, result_status = ?
           WHERE regno = ? AND subject_name = ? AND subject_code = ? AND exam_name = ?
             AND original_year = ? AND original_sem = ? AND regulation = ?`,
          [newMarks, resultStatus, regno, subjectName, subjectCode, examname, year, semester, regulation]
        );
      }
    }

    res.status(200).json({ success: true, message: "Revaluation mark updated successfully." });

  } catch (err) {
    console.error("Revaluation update error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  } finally {
    if (connection) connection.release();
  }
});



router.post("/external/internal/", async (req, res) => {
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
      marks 
    } = req.body;

    if (
      !classid || !subjectName || !subjectCode ||
      !Array.isArray(marks) || marks.length === 0
    ) {
      return res.status(400).json({ success: false, message: "Missing or invalid input data" });
    }

    connection = await pool.getConnection();

    // Get year, sem, course, regulation from class ID
    const [classRows] = await connection.query(
      `SELECT year, sem, course, regulation FROM lect_classes WHERE id = ? LIMIT 1`,
      [classid]
    );

    if (classRows.length === 0) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const { year, sem, course, regulation } = classRows[0];

    // Optional: prevent duplicate uploads
    const [existing] = await connection.query(
      `SELECT COUNT(*) AS count FROM external_results 
       WHERE subject_name = ? AND year = ? AND sem = ? AND regulation = ?`,
      [subjectName, year, sem, regulation, course]
    );

    if (existing[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `Internal marks for subject '${subjectName}' already uploaded for this class.`
      });
    }

    // Prepare values for bulk insert
    const values = marks.map(m => [
      m.regno,
      subjectName,
      subjectCode,
      year,
      sem,
      regulation,
      m.internal_marks,
      m.internal_total
    ]);

    const insertQuery = `
      INSERT INTO external_results (
        regno, subject_name, subject_code,
        year, sem,  regulation,
        internalmarks, internaltotal
     ) VALUES ?
    `;

    await connection.query(insertQuery, [values]);

    res.status(200).json({ success: true, message: "Internal marks inserted into external_results successfully" });

  } catch (err) {
    console.error("Upload error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    res.status(500).json({ success: false, message: "Internal server error" });

  } finally {
    if (connection) connection.release();
  }
});


router.delete("/timetable/delete/:id/", async (req, res) => {
  let connection;

  try {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    jwt.verify(token, secretKey); // Just verifying token; no need to extract anything here

    const { id } = req.params;
   
    connection = await pool.getConnection();

    const [existingClass] = await connection.query(
      `SELECT Id FROM exam_timetable WHERE Id = ?`,
      [id]
    );

    if (existingClass.length === 0) {
      return res.status(404).json({ success: false, message: "Exam timetable not found" });
    }

    await connection.query(`DELETE FROM exam_timetable WHERE Id = ?`, [id]);

    res.status(200).json({ success: true, message: "Exam timetable deleted successfully" });

  } catch (error) {
    console.error("Error deleting exam timetable:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token has expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    res.status(500).json({ success: false, message: "Failed to delete exam timetable" });

  } finally {
    if (connection) connection.release();
  }
});




router.get("/revaluation/students", async (req, res) => {
  let connection;

  try {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secretKey);

    const {
      collegename,
      course,
      regulation,
      year,
      sem,
      subjectName,
      examname
    } = req.query;
  console.log(collegename,
      course,
      regulation,
      year,
      sem,
      subjectName,
      examname)
    // Validate all required parameters
    if (
      !collegename || !course || !regulation || !year || !sem ||
      !subjectName || !examname
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters: college_name, course, regulation, year, sem, subject_name, exam_name"
      });
    }

    connection = await pool.getConnection();

    const [results] = await connection.query(
      `SELECT br.regno as Regno, br.subject_name as SubjectName,
       br.exam_name as examname, br.marks_obtained as marks,
              br.max_marks as totalmarks
       FROM backlog_results br
       JOIN students s ON br.regno = s.Regno
       WHERE br.result_status = 'fail'
         AND br.status = 'submitted'
         AND s.college_name = ?
         AND s.course = ?
         AND br.regulation = ?
         AND br.original_year = ?
         AND br.original_sem = ?
         AND br.subject_name = ?
         AND br.exam_name = ?`,
      [collegename, course, regulation, year, sem, subjectName, examname]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No failed students found matching the provided filters"
      });
    }

    res.status(200).json(results);

  } catch (error) {
    console.error("Error fetching revaluation students:", error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Token has expired" });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "Invalid token" });
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(400).json({ success: false, message: "Invalid field in query" });
    } else if (error.code === 'ER_PARSE_ERROR') {
      return res.status(400).json({ success: false, message: "SQL syntax error" });
    } else {
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }

  } finally {
    if (connection) connection.release();
  }
});
/*
router.post("/revaluation/submit", async (req, res) => {
  let connection;

  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const revalList = req.body;
    console.log("Received Revaluation List:", revalList);

    if (!Array.isArray(revalList) || revalList.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or empty revaluation data" });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const mark of revalList) {
      // Mapping from frontend structure to expected fields
      const regno = mark.regno;
      const subject_name = mark.subjectName;
      const subject_code = mark.subject_code || ""; // Optional: default to empty string
      const original_year = mark.year;
      const original_sem = mark.semester;
      const regulation = mark.regulation;
      const exam_name = mark.examname;
      const marksObtained = mark.newMarks;
     const oldMarks = mark.oldMarks;
      const maxMarks = mark.totalMarks;

      // Validate
      if (!regno || !subject_name || !original_year || !original_sem || !regulation ||
          !exam_name || typeof marksObtained !== 'number' || typeof maxMarks !== 'number') {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Missing required fields in one or more entries" });
      }

      const resultStatus = marksObtained >= (maxMarks * 0.4) ? 'pass' : 'fail';

      // 1. Insert into revaluation_results
     await connection.query(
  `INSERT INTO revaluation_results
   (regno, subject_name, subject_code, year, sem, regulation, exam_name, original_marks,
    revaluated_marks, max_marks, result_status, status, added_by)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    regno,
    subject_name,
    subject_code,
    original_year,
    original_sem,
    regulation,
    exam_name,
    oldMarks,
    marksObtained,
    maxMarks,
    resultStatus,       // dynamic value
    'submitted',        // now passed as a value
    decoded.Id
  ]
);


      // 2. If passed, update backlog_results
      if (resultStatus === 'pass') {
        await connection.query(
          `UPDATE backlog_results
           SET result_status = 'pass', status = 'approved'
           WHERE regno = ? AND subject_name = ? AND exam_name = ?
             AND original_year = ? AND original_sem = ? AND regulation = ?`,
          [regno, subject_name, exam_name, original_year, original_sem, regulation]
        );

        // 3. Check if external_results entry exists
        const [exists] = await connection.query(
          `SELECT id, result_status FROM external_results
           WHERE regno = ? AND subject_name = ? AND exam_name = ?
             AND year = ? AND sem = ? AND regulation = ?`,
          [regno, subject_name, exam_name, original_year, original_sem, regulation]
        );

        if (exists.length > 0) {
          const existing = exists[0];
          if (existing.result_status === 'fail') {
            await connection.query(
              `UPDATE external_results
               SET marks_obtained = ?, result_status = 'pass', status = 'submitted'
               WHERE id = ?`,
              [marksObtained, existing.id]
            );
          }
        } else {
          await connection.query(
            `INSERT INTO external_results
             (regno, subject_name, subject_code, year, sem, regulation, exam_name,
              marks_obtained, max_marks, result_status, status, added_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pass', 'submitted', ?)`,
            [regno, subject_name, subject_code, original_year, original_sem,
             regulation, exam_name, marksObtained, maxMarks, decoded.username]
          );
        }
      }
    }

    await connection.commit();
    return res.status(200).json({ success: true, message: "Revaluation submitted successfully" });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error in revaluation submission:", error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Token has expired" });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "Invalid token" });
    } else {
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }

  } finally {
    if (connection) connection.release();
  }
});*/


router.post("/revaluation/submit", async (req, res) => {
  let connection;

  try {
    // 1. JWT Verification
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (error) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }

    const result = req.body; // ✅ no 'results', direct object

    const {
      regno,
      subjectName,
      newMarks,
      examname,
      regulation,
      semester,
      year,
      totalMarks,
      subjectCode
    } = result;
   
    connection = await pool.getConnection();

    const [existingExternal] = await connection.query(
      `SELECT 1 FROM external_results
       WHERE regno = ? AND subject_name = ? AND subject_code = ? AND exam_name = ?
         AND year = ? AND sem = ? AND regulation = ?`,
      [regno, subjectName, subjectCode, examname, year, semester, regulation]
    );

    if (existingExternal.length > 0) {
      const passMark = Math.floor(totalMarks * 0.4);
      const resultStatus = newMarks >= passMark ? "pass" : "fail";

      // Update external_results
      await connection.query(
        `UPDATE external_results
         SET marks_obtained = ?, result_status = ?, status = 'submitted'
         WHERE regno = ? AND subject_name = ? AND subject_code = ? AND exam_name = ?
           AND year = ? AND sem = ? AND regulation = ?`,
        [newMarks, resultStatus, regno, subjectName, subjectCode, examname, year, semester, regulation]
      );

      if (resultStatus === "pass") {
        await connection.query(
          `DELETE FROM backlog_results
           WHERE regno = ? AND subject_name = ? AND subject_code = ? AND exam_name = ?
             AND original_year = ? AND original_sem = ? AND regulation = ?`,
          [regno, subjectName, subjectCode, examname, year, semester, regulation]
        );
      } else {
        await connection.query(
          `UPDATE backlog_results
           SET marks_obtained = ?, result_status = ?
           WHERE regno = ? AND subject_name = ? AND subject_code = ? AND exam_name = ?
             AND original_year = ? AND original_sem = ? AND regulation = ?`,
          [newMarks, resultStatus, regno, subjectName, subjectCode, examname, year, semester, regulation]
        );
      }
    }

    res.status(200).json({ success: true, message: "Revaluation mark updated successfully." });

  } catch (err) {
    console.error("Revaluation update error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  } finally {
    if (connection) connection.release();
  }
});




router.put("/marks/approve", async (req, res) => {
  let connection;

  try {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const { year, sem, regulation, examname, collegename } = req.body;

    if (!year || !sem || !regulation || !examname || !collegename) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: year, sem, regulation, examname, collegename"
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Step 1: Approve external_results
    const [externalUpdate] = await connection.query(
      `UPDATE external_results em
       JOIN lecturer l ON em.added_by = l.id
       SET em.status = 'approved',
           em.approved_by = ?,
           em.approved_at = NOW()
       WHERE em.exam_name = ?
         AND em.year = ?
         AND em.sem = ?
         AND em.regulation = ?
         AND l.id = ?
         AND l.college_name = ?
         AND em.status != 'approved'`,
      [decoded.Id, examname, year, sem, regulation, decoded.Id, collegename]
    );

    // Step 2: Approve matching backlog_results (only for failed records)
    const [backlogUpdate] = await connection.query(
      `UPDATE backlog_results br
       JOIN external_results er ON 
         br.regno = er.regno AND
         br.subject_code = er.subject_name AND
         br.exam_name = er.exam_name
       JOIN lecturer l ON er.added_by = l.id
       SET br.status = 'approved'
       WHERE er.exam_name = ?
         AND er.year = ?
         AND er.sem = ?
         AND er.regulation = ?
         AND er.result_status = 'fail'
         AND er.status = 'approved'
         AND br.status != 'approved'
         AND l.id = ?
         AND l.college_name = ?`,
      [examname, year, sem, regulation, decoded.Id, collegename]
    );

    await connection.commit();

    if (externalUpdate.affectedRows === 0 && backlogUpdate.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No records updated. Marks may already be approved or filters do not match."
      });
    }

    res.status(200).json({
      success: true,
      message: `Approved ${externalUpdate.affectedRows} external result(s) and ${backlogUpdate.affectedRows} backlog record(s).`
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error approving marks:", error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Token has expired" });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "Invalid token" });
    } else {
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }

  } finally {
    if (connection) connection.release();
  }
});

router.get('/internal/avg/', async (req, res) => {

  const { subjectname, classid ,subjectcode} = req.query;
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

    const query = `
      SELECT 
        ir.Regno,
        s.subject_name AS SubjectName,
        ir.marks_obtained AS marks,
        ir.max_marks AS totalmarks,
        ir.exam_name AS examname
      FROM internal_results ir
      JOIN subjects s ON ir.Subject_Name = s.subject_name
      JOIN lect_classes c ON s.classid = c.id
      WHERE s.subject_name = ?
          AND  s.subject_code=?
        AND s.classid = ?
        AND ir.status = 'approved'
    `;

    const [rows] = await connection.query(query, [
      subjectname,
      subjectcode,
      classid,
    ]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    if (connection) connection.release();
  }
});


router.get('/approve/student/', async (req, res) => {
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
      return res.status(401).json({ success: false, message: 'Token has expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    } else {
      return res.status(401).json({ success: false, message: 'Unauthorized', errorMessage: error.message });
    }
  }

  const { course, sem, year, collegename, regulation, examname } = req.query;
  
  if (!course || !sem || !year || !collegename || !regulation || !examname) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      SELECT 
        er.regno AS Regno,
        er.subject_name AS SubjectName,
        er.exam_name AS examname,
        er.marks_obtained AS marks,
        er.max_marks AS totalmarks
      FROM external_results er
      JOIN students s ON er.regno = s.Regno
      WHERE s.College_name = ?
        AND s.Course = ?
        AND er.year = ?
        AND er.sem = ?
        AND er.exam_name = ?
        AND er.regulation = ?
        AND er.status = 'submitted'
    `;

    const values = [collegename, course, year, sem, examname, regulation];

    const [result] = await connection.query(query, values);
    connection.release();

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No results found.' });
    }

    res.status(200).json(result);

  } catch (error) {
    if (connection) connection.release();
    console.error('Error executing query:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
  }
});

 module.exports = router;