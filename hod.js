const express = require('express');
const router = express.Router();
const multer = require('multer')
const jwt = require('jsonwebtoken');
const s3 = require('./awsConfig');
const bcrypt = require('bcrypt');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY
const Buck =process.env.Bucket
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
    const {collegecode,course} = req.query
    
    const query = `SELECT id as Id, Fullname AS Name, Profile AS ProfilePic, Regno 
FROM lecturer 
WHERE College_Code = ? 
  AND Role = 'Lecturer'
  AND Department=? 
  AND (Desigination IS NULL OR Desigination != 'Principal');
`;

    connection = await pool.getConnection();
    const [rows] = await connection.query(query, [collegecode,course]);
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
              Bucket: Buck,
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
    const {collegecode,course} = req.query
 
    const query = `SELECT id as Id, Fullname AS Name, Profile AS ProfilePic, Regno FROM students WHERE College_name = ? And course=? `;

    connection = await pool.getConnection();
    const [rows] = await connection.query(query, [collegecode,course]);
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
              Bucket: Buck,
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



    module.exports = router;