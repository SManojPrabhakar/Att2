const express = require('express');
const router = express.Router();
const s3 = require('./awsConfig.js');
const jwt = require('jsonwebtoken');
const pool = require('./config.js');

require('dotenv').config();
const secretKey =process.env.SECRET_KEY


router.get('/search/students/', async (req, res) => {
    try {
        const query = `DELETE student_attendance, lecturer_attendance, students, lecturer
        FROM student_attendance
        INNER JOIN students ON student_attendance.student_id = students.id
        INNER JOIN lecturer_attendance ON student_attendance.lecturer_attendance_id = lecturer_attendance.id
        INNER JOIN lecturer ON lecturer_attendance.lecturer_id = lecturer.id
        WHERE students.college_name = 'Ciet'
        And students_attedance.college_name="",
        And lecturer_attedance.college_name="",
        And lecturer.college_name="",
        `;
  
        // Use the connection pool to get a connection
        const connection = await pool.getConnection();
  
        // Execute the query using the connection
        const [result] = await connection.query(query); // Destructuring the result to access rows directly
  
        // Release the connection back to the pool
        connection.release();
  
     
      
            res.send(result); // Sending rows
        
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });




  

  
  router.patch("/user/delete/", async (req, res) => {
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (err) {
        return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    }

    const { Regno } = decoded;
    const isExpired = Date.now() >= decoded.exp * 1000;
    
    if (isExpired) {
        const errorMessage = 'Your session has expired. Please log in again.';
        return res.status(401).json({ success: false, message: errorMessage });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction(); // Start the transaction

        // Deleting from multiple tables for students
        const [result] = await connection.query(`
            DELETE student_attedance, students, posts 
            FROM students
            LEFT JOIN student_attedance ON student_attedance.Regno = students.Regno
            LEFT JOIN posts ON posts.Regno = students.Regno
            WHERE students.Regno = ?`, 
            [Regno]
        );

        // Check if rows were affected
        if (result.affectedRows === 0) {
            // No rows were affected, meaning Regno not found, execute an alternative query
            console.log("Regno not found in student-related tables, checking lecturer...");

            // Execute your alternative query here
            const [lecturerResult] = await connection.query(`
                DELETE lecturer_attendance, lecturer, posts 
                FROM lecturer
                LEFT JOIN lecturer_attendance ON lecturer_attendance.Regno = lecturer.Regno
                LEFT JOIN posts ON posts.Regno = lecturer.Regno
                WHERE lecturer.Regno = ?`, 
                [Regno]
            );

            if (lecturerResult.affectedRows > 0) {
                await connection.commit(); // Commit the transaction if lecturer record deleted
                return res.status(200).json({ Success: "true", Message: "Lecturer deleted successfully." });
            } else {
                await connection.rollback(); // Rollback in case of no deletion
                return res.status(404).json({ Success: "false", Message: "No records found to delete." });
            }
        }

        await connection.commit(); // Commit the transaction if students or related tables were deleted
        res.status(200).json({ Success: "true", Message: "Deleted successfully from students and related tables." });
    } catch (error) {
        await connection.rollback(); // Rollback in case of error
        return res.status(500).json({ Success: "false", error: error.message });
    } finally {
        if (connection) {
            connection.release(); // Ensure the connection is always released
        }
    }
});




  router.delete('/deletel/', async (req, res) => {
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

      const query = `DELETE FROM lecturer WHERE Regno = ?`;
      const [result] = await connection.query(query, [decoded.Regno]);
      console.log(result)
      if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'No student found with the given ID' });
      }

      res.status(200).json({ success: true, message: 'Student deactivated successfully' });
  } catch (error) {
      console.error('Error executing delete query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release();
  }
});


  module.exports = router;