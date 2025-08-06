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

router.get('/college/names/', async (req, res) => {

  let connection;
  
  try {
      const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

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
 

    const query = 'SELECT Id, college_Name as Name ,Code,College_Code as collegecode FROM register WHERE fonid = ?';

    connection = await pool.getConnection();

    const [rows] = await connection.query(query, [decoded.Id]);

    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No colleges registered under your ID' });
    }
  
    return res.status(200).json( rows );

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



router.get('/members/count/', async (req, res) => {

  let connection;
  
  try {
    
      const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

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

    const {collegename}=req.query 
 

    const query = `
  SELECT
    (SELECT COUNT(*) FROM students WHERE college_name = ?) AS studentcount,
    (SELECT COUNT(*) FROM lecturer WHERE college_name = ? AND role = 'lecturer') AS lecturercount,
    (SELECT COUNT(*) FROM lecturer WHERE college_name = ? AND role = 'admin') AS admincount
`;

    connection = await pool.getConnection();

    const [rows] = await connection.query(query, [collegename,collegename,collegename]);

    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No students & staff found' });
    }
  
    return res.status(200).json( rows[0] );

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


router.get('/college/edits/', async (req, res) => {

  let connection;
  
  try {
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

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
    const collegecode=req.query.Code
  
    const query = `SELECT College_Name,College_Code,College_Address,Principal,P_Email,College_Email,College_Admin_Number
    ,State FROM register WHERE fonid = ? and Code =?`;

    connection = await pool.getConnection();

    const [rows] = await connection.query(query, [fondid,collegecode]);

    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No colleges registered under your ID' });
    }
   
    return res.status(200).json( rows[0] );

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




router.put("/update/college/", async (req, res) => {
    let connection;
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, secretKey);
        const { Id } = decoded;

        const { collegename, collegecode,Address,adminnumberr,email,principal,principalemail,code } = req.body;
   
        if (!collegename || !collegecode || !Address || !adminnumberr || !email || !principal || !principalemail || !code) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Get a database connection
        connection = await pool.getConnection();
        

        // Try updating the students table
        const studentUpdateQuery = `
            UPDATE register SET College_name=?, College_Code=?, College_Email=?, College_Address=?, College_Admin_Number=?, Principal=? ,
            P_Email =?
            WHERE fonid=? And code=?`;
        const [studentUpdateResult] = await connection.query(studentUpdateQuery, [collegename, collegecode, email, Address,
            adminnumberr, principal, principalemail,Id,code]);

     

       
        return res.status(200).json({ success: true, message: "Updated Successfully" });

    } catch (err) {
        if (connection) await connection.rollback();
        
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
        } else if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
        }

        console.error("Error updating user:", err);
        console.log(err)
        return res.status(500).json({ success: false, message: "Internal server error" });
    } finally {
        if (connection) connection.release();
    }
});

router.delete("/college/delete/:Id", async (req, res) => {
  let connection;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secretKey);
    const { Id } = req.params;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 📌 Get college_name and Imagekeys from register
    const [collegeRows] = await connection.query(`SELECT college_name, Imagekeys FROM register WHERE Id = ?`, [Id]);
    if (collegeRows.length === 0) {
      return res.status(404).json({ success: false, message: "College not found" });
    }
    const collegeName = collegeRows[0].college_name;
    const collegeImageKey = collegeRows[0].Imagekeys;

    // ---------- STUDENTS ----------
    const [students] = await connection.query(`SELECT Regno, profile FROM students WHERE college_name = ?`, [collegeName]);
    for (const student of students) {
      const regno = student.Regno;

      const [posts] = await connection.query(`SELECT id, Image FROM posts WHERE Regno = ?`, [regno]);
      const postIds = posts.map(p => p.postid);
      const postImages = posts.map(p => p.Image).filter(Boolean);

      if (postIds.length > 0) {
        await connection.query(`DELETE FROM likes WHERE post_id IN (?)`, [postIds]);
        await connection.query(`DELETE FROM comments WHERE post_id IN (?)`, [postIds]);
      }

      await connection.query(`DELETE FROM external_results WHERE Regno = ?`, [regno]);
      await connection.query(`DELETE FROM internal_results WHERE Regno = ?`, [regno]);
      await connection.query(`DELETE FROM notifications WHERE Regno = ?`, [regno]);
      await connection.query(`DELETE FROM report WHERE Regno = ?`, [regno]);
      await connection.query(`DELETE FROM attendance WHERE student_id IN (SELECT Id FROM students WHERE Regno = ?)`, [regno]);
      await connection.query(`DELETE FROM attendance_summary_backup WHERE student_id IN (SELECT Id FROM students WHERE Regno = ?)`, [regno]);
      await connection.query(`DELETE FROM posts WHERE Regno = ?`, [regno]);
      await connection.query(`DELETE FROM students WHERE Regno = ?`, [regno]);

      const imageKeys = [
        ...(student.profile ? [{ Key: student.profile }] : []),
        ...postImages.map(img => ({ Key: img }))
      ];
      if (imageKeys.length > 0) {
        await s3.deleteObjects({
          Bucket: process.env.BUCKET,
          Delete: { Objects: imageKeys }
        }).promise();
      }
    }

    // ---------- LECTURERS ----------
    const [lecturers] = await connection.query(`SELECT Regno, Id, Profile FROM lecturer WHERE college_name = ?`, [collegeName]);
    for (const lecturer of lecturers) {
      const { Regno: regno, Id: lectId, Profile } = lecturer;

      const [posts] = await connection.query(`SELECT Image FROM posts WHERE Regno = ?`, [regno]);
      const postImages = posts.map(p => p.Image).filter(Boolean);

      const [classes] = await connection.query(`SELECT id FROM lect_classes WHERE leact_id = ?`, [lectId]);
      for (const { classid } of classes) {
        await connection.query(`DELETE FROM lecturer_subjects WHERE class_id = ?`, [classid]);
        await connection.query(`DELETE FROM assignments WHERE classid = ?`, [classid]);
        await connection.query(`DELETE FROM subjects WHERE classid = ?`, [classid]);
      }

      await connection.query(`DELETE FROM lect_classes WHERE leact_id = ?`, [lectId]);
      await connection.query(`DELETE FROM lect_attendancesheet WHERE Lect_id = ?`, [lectId]);
      await connection.query(`DELETE FROM lecturer_attendance_log WHERE lecturer_id = ?`, [lectId]);
      await connection.query(`DELETE FROM report WHERE Regno = ?`, [regno]);
      await connection.query(`DELETE FROM user_fcm_tokens WHERE Regno = ?`, [regno]);
      await connection.query(`DELETE FROM comments_posts WHERE Regno = ?`, [regno]);
      await connection.query(`DELETE FROM likes WHERE Regno = ?`, [regno]);
      await connection.query(`DELETE FROM notifications WHERE Regno = ?`, [regno]);
      await connection.query(`DELETE FROM posts WHERE Regno = ?`, [regno]);
      await connection.query(`DELETE FROM lecturer WHERE Regno = ?`, [regno]);

      const imageKeys = [
        ...(Profile ? [{ Key: Profile }] : []),
        ...postImages.map(img => ({ Key: img }))
      ];
      if (imageKeys.length > 0) {
        await s3.deleteObjects({
          Bucket: process.env.BUCKET,
          Delete: { Objects: imageKeys }
        }).promise();
      }
    }

    // ---------- DELETE COLLEGE IMAGE FROM S3 ----------
    if (collegeImageKey) {
      await s3.deleteObject({
        Bucket: process.env.BUCKET,
        Key: collegeImageKey
      }).promise();
    }

    // ---------- DELETE COLLEGE RECORD ----------
    await connection.query(`DELETE FROM register WHERE Id = ?`, [Id]);
    await connection.commit();

    res.status(200).json({ success: true, message: "College and all related data/images deleted successfully" });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error deleting college:", error);

    const msg = error.name === "TokenExpiredError"
      ? "Unauthorized: Token has expired or is invalid"
      : error.name === "JsonWebTokenError"
      ? "Unauthorized: Invalid token"
      : "Failed to delete college";

    res.status(500).json({ success: false, message: msg, error: error.message });

  } finally {
    if (connection) connection.release();
  }
});

    module.exports = router;