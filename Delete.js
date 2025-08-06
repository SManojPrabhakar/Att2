const express = require('express');
const router = express.Router();
const s3 = require('./awsConfig.js');
const jwt = require('jsonwebtoken');
const pool = require('./config.js');

require('dotenv').config();
const secretKey =process.env.SECRET_KEY

const Buck =process.env.Bucket

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
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: ' + (error.name === 'TokenExpiredError' ? 'Token has expired or is invalid' : 'Invalid token'),
            error: error.message
        });
    }

    const regno = decoded.Regno;
    const id=decoded.Id
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 🔍 Step 1: Extract classid from lect_classes
        const [classRows] = await connection.query(`SELECT id FROM lect_classes WHERE leact_id = ?`, [id]);
        const classIds = classRows.map(row => row.classid);

        // 🔍 Step 2: Extract image keys from posts
        const [postRows] = await connection.query(`SELECT Image FROM posts WHERE Regno = ?`, [regno]);
        const imageKeys = postRows.map(row => row.Image).filter(Boolean);

        // 🔍 Step 3: Extract profile key from lecturer
        const [lecturerRow] = await connection.query(`SELECT Profile FROM lecturer WHERE Regno = ?`, [regno]);
        const profileKey = lecturerRow[0]?.Profile;

        // 🔥 Step 4: Delete from dependent tables using classIds
        for (const classid of classIds) {
            await connection.query(`DELETE FROM lecturer_subjects WHERE class_id = ?`, [classid]);
            await connection.query(`DELETE FROM assignments WHERE classid = ?`, [classid]);
            await connection.query(`DELETE FROM subjects WHERE classid = ?`, [classid]);
        }

        // 🔥 Step 5: Delete from other related tables
        await connection.query(`DELETE FROM comments_posts WHERE Regno = ?`, [regno]);
        await connection.query(`DELETE FROM likes WHERE Regno = ?`, [regno]);
        await connection.query(`DELETE FROM notifications WHERE Regno = ?`, [regno]);
        await connection.query(`DELETE FROM lecturer_attendance_log WHERE lecturer_id = ?`, [id]);
        await connection.query(`DELETE FROM user_fcm_tokens WHERE Regno = ?`, [regno]);
        await connection.query(`DELETE FROM lect_classes WHERE leact_id = ?`, [id]);
        await connection.query(`DELETE FROM report WHERE Regno = ?`, [regno]);
        await connection.query(`DELETE FROM lect_attendancesheet WHERE Lect_id = ?`, [id]);
        await connection.query(`DELETE FROM posts WHERE Regno = ?`, [regno]);

        // 🔥 Step 6: Finally delete lecturer
        const [result] = await connection.query(`DELETE FROM lecturer WHERE Regno = ?`, [regno]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'No lecturer found with the given ID' });
        }

        await connection.commit();

        // 🧹 Step 7: Delete images from S3
        const keysToDelete = [
            ...imageKeys.map(key => ({ Key: key })),
            ...(profileKey ? [{ Key: profileKey }] : [])
        ];

        if (keysToDelete.length > 0) {
            const deleteParams = {
                Bucket: process.env.BUCKET,
                Delete: { Objects: keysToDelete }
            };

            await s3.deleteObjects(deleteParams).promise();
        }

        res.status(200).json({ success: true, message: 'Lecturer and all related data/images deleted successfully' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error in deletion:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});


router.delete("/founder/delete/", async (req, res) => {
  let connection;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secretKey);
   

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 🔍 Get founder image key
    const [founderRows] = await connection.query(`SELECT profile FROM fond WHERE Id = ?`, [decoded.Id]);
    if (founderRows.length === 0) {
      return res.status(404).json({ success: false, message: "Founder not found" });
    }

    const founderImageKey = founderRows[0].profile;

    // ❌ Delete image from S3
    if (founderImageKey) {
      await s3.deleteObject({
        Bucket: process.env.BUCKET,
        Key: founderImageKey
      }).promise();
    }

    // 🧹 Delete founder record from `fond` table
    await connection.query(`DELETE FROM fond WHERE Id = ?`, [decoded.Id]);

    await connection.commit();
    res.status(200).json({ success: true, message: "Founder and profile image deleted successfully" });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error deleting founder:", error);

    const msg = error.name === "TokenExpiredError"
      ? "Unauthorized: Token has expired"
      : error.name === "JsonWebTokenError"
      ? "Unauthorized: Invalid token"
      : "Failed to delete founder";

    res.status(500).json({ success: false, message: msg, error: error.message });

  } finally {
    if (connection) connection.release();
  }
});


  module.exports = router;