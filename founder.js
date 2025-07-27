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

router.delete("/college/delete/:Id/", async (req, res) => {
  let connection;

  try {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secretKey);
   

    const { Id } = req.params; // Class name from the request

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Check if the class exists and belongs to the lecturer
    const checkQuery = `SELECT Id FROM register WHERE Id = ?`;
    const [existingClass] = await connection.query(checkQuery, [Id]);

    if (existingClass.length === 0) {
      return res.status(404).json({ success: false, message: "College not found or unauthorized" });
    }

    // Delete the class
    const deleteQuery = `DELETE FROM register WHERE Id = ?`;
    await connection.query(deleteQuery, [Id]);

    res.status(200).json({ success: true, message: "College deleted successfully" });

  } catch (error) {
    console.error("Error deleting class:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    res.status(500).json({ success: false, message: "Failed to delete college" });

  } finally {
    if (connection) connection.release(); // Ensure connection is always released
  }
});
    module.exports = router;