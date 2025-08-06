const express = require('express');
const router = express.Router();
const multer = require('multer')
const jwt = require('jsonwebtoken');
const s3 = require('./awsConfig');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY
const Buck =process.env.Bucket
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

const pool = require('./config.js');
  
function formatDate(dateStr) {
  const [day, month, year] = dateStr.split("-");
  return `${year}-${month}-${day}`;
}

router.post("/attendance/new/", async (req, res) => {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  let connection;  // Declare connection outside for proper rollback

 
try{
     
    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;
      const { subject_name, date, period, attendance,attendance_sheet_id,present} = req.body;
const formattedDate = formatDate(date);
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
          formattedDate,
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

 
router.get('/getattendance/new/single/', async (req, res) => {
  let connection;
  try {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

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


router.get('/getattendance/lect/single/', async (req, res) => {
  let connection;
  try {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const Id  = req.query.id;

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

router.put("/backup/attendance/update/", async (req, res) => {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

  const { Ids: studentIds, Year, Sem } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ success: false, message: "No student IDs provided" });
  }

  // Allow only Roman numerals for Year and Sem
  const romanYears = ["I", "II", "III", "IV","V"];
  const romanSems = ["I", "II"];

  if (!romanYears.includes(Year) || !romanSems.includes(Sem)) {
    return res.status(400).json({ success: false, message: "Year and Sem must be in Roman numerals" });
  }

  let connection;

  try {
    jwt.verify(token, secretKey);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const placeholders = studentIds.map(() => '?').join(',');

    const [backupData] = await connection.query(
      `
      SELECT 
        a.student_id,
        COUNT(*) AS total_classes,
        SUM(a.is_present) AS attended_classes,
        CURDATE() AS backup_date,
        UNIX_TIMESTAMP() AS backup_timestamp,
        s.Year,
        s.Sem
      FROM attendance a
      JOIN students s ON a.student_id = s.Id
      WHERE a.student_id IN (${placeholders})
      GROUP BY a.student_id, s.Year, s.Sem
      `,
      studentIds
    );

    if (backupData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "No attendance records found for backup" });
    }

    for (const row of backupData) {
      await connection.query(
        `INSERT INTO attendance_summary_backup 
         (student_id, total_classes, attended_classes, backup_date, backup_timestamp, Year, Sem)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          row.student_id,
          row.total_classes,
          row.attended_classes,
          row.backup_date,
          row.backup_timestamp,
          row.Year,
          row.Sem
        ]
      );
    }

    // Optional: delete attendance
    // await connection.query(`DELETE FROM attendance WHERE student_id IN (${placeholders})`, studentIds);

    await connection.query(
      `UPDATE students SET Year = ?, Sem = ? WHERE Id IN (${placeholders})`,
      [Year, Sem, ...studentIds]
    );

    await connection.commit();
    res.status(200).json({ success: true, message: "Attendance backed up and students promoted successfully" });

  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Error in backup & promotion:", error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Token has expired" });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "Invalid token" });
    } else {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  } finally {
    if (connection) connection.release();
  }
});


router.put("/Academic/lect/updateSemAndBackup", async (req, res) => {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

  const { Sem, Ids: studentIds } = req.body;

  
  if (!Sem || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ success: false, message: "Sem and student Ids are required" });
  }

  let connection;
  try {
    const decoded = jwt.verify(token, secretKey);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Fetch current semester for students
    const placeholders = studentIds.map(() => '?').join(',');
    const [currentData] = await connection.query(
      `SELECT Id, Sem FROM students WHERE Id IN (${placeholders})`,
      studentIds
    );

    if (currentData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "No students found with given Ids" });
    }

    // Check if new Sem is different for any student
    const needsUpdate = currentData.some(row => row.Sem !== Sem);

    if (!needsUpdate) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Semester is already set to the given value for all students" });
    }

    // Backup attendance summary for students
    const [backupData] = await connection.query(
      `SELECT 
          student_id,
          COUNT(*) AS total_classes,
          SUM(is_present) AS attended_classes,
          CURDATE() AS backup_date,
          UNIX_TIMESTAMP() AS backup_timestamp,
          Year,
          Sem
        FROM attendance a
        JOIN students s ON a.student_id = s.Id
        WHERE a.student_id IN (${placeholders})
        GROUP BY student_id, Year, Sem`,
      studentIds
    );

    if (backupData.length > 0) {
      for (const row of backupData) {
        await connection.query(
          `INSERT INTO attendance_summary_backup 
          (student_id, total_classes, attended_classes, backup_date, backup_timestamp, Year, Sem)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            row.student_id,
            row.total_classes,
            row.attended_classes,
            row.backup_date,
            row.backup_timestamp,
            row.Year,
            row.Sem,
          ]
        );
      }
    }

    // Delete backed-up attendance
    await connection.query(
      `DELETE FROM attendance WHERE student_id IN (${placeholders})`,
      studentIds
    );

    // Update semester only (Year unchanged)
    await connection.query(
      `UPDATE students SET Sem = ? WHERE Id IN (${placeholders})`,
      [Sem, ...studentIds]
    );

    await connection.commit();

    res.status(200).json({ success: true, message: "Attendance backed up and semester updated successfully" });

  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Error:", error);

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


    module.exports = router;