const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const pool = require('./config.js');
const bcrypt = require('bcrypt');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY

router.put("/user/update/edit/", async (req, res) => {
  let connection;
  try {
    const token = req.cookies.att2day;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, secretKey);
    const { Regno } = decoded;

    const { Fullname, Year, Section, Sem, aRegno, Course } = req.body;
       

    if (!Fullname || !Year || !Section || !Sem || !aRegno || !Course) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Get a database connection
    connection = await pool.getConnection();

    // Perform the update
    const studentUpdateQuery = `
      UPDATE students 
      SET fullname = ?,  year = ?, sem = ?, course = ?, section = ? 
      WHERE Regno = ?`;
    const [studentUpdateResult] = await connection.query(studentUpdateQuery, [
      Fullname,
     Year,
      Sem,
      Course,
      Section,
      aRegno
    ]);

    return res.status(200).json({ success: true, message: "Updated Successfully" });

  } catch (err) {
    if (connection) await connection.rollback();

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    console.error("Error updating user:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });

  } finally {
    if (connection) connection.release();
  }
});


router.put("/fond/update/college/", async (req, res) => {
    let connection;
    try {
        const token = req.cookies.att2day;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, secretKey);
        const { Id } = decoded;

        const { collegename, collegecode,Address,adminnumber,email,principal,principalemail,code } = req.body;

        if (!collegename || !collegecode || !Address || !adminnumber || !email || !principal || !principalemail || !code) {
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
            adminnumber, principal, principalemail,Id,code]);

     

       
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


router.patch('/password/change', async (req, res) => {
  const token = req.cookies.att2day;
  if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
  }

  const { password, newpassword } = req.body;
  if (!password || !newpassword) {
      return res.status(400).json({ success: false, message: "Both current and new passwords are required" });
  }

  let decoded;
  try {
      decoded = jwt.verify(token, secretKey);
  } catch (error) {
      if (error.name === "TokenExpiredError") {
          return res.status(401).json({ success: false, message:"Unauthorized: Token has expired or is invalid" });
      }
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token", error: error.message });
  }

  const { Id } = decoded;
  let connection;

  try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Fetch user password
      const [rows] = await connection.query("SELECT Password FROM students WHERE Id = ?", [Id]);


      // Validate old password
      const isMatch = await bcrypt.compare(password, rows[0].Password);
      if (!isMatch) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "Incorrect current password" });
      }

      // Hash new password after validation
      const newHashedPassword = await bcrypt.hash(newpassword, 10);
      await connection.query("UPDATE students SET Password = ? WHERE Id = ?", [newHashedPassword, Id]);

      await connection.commit();
      res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
      if (connection) await connection.rollback();
      console.error("Error updating password:", error);

      res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
      if (connection) connection.release(); // Ensure connection is always released
  }
});

router.patch('/lectpassword/change', async (req, res) => {
  const token = req.cookies.att2day;
  if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
  }

  const { password, newpassword } = req.body;
  
  if (!password || !newpassword) {
      return res.status(400).json({ success: false, message: "Both current and new passwords are required" });
  }

  let decoded;
  try {
      decoded = jwt.verify(token, secretKey);
  } catch (error) {
      if (error.name === "TokenExpiredError") {
          return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
      }
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token"});
  }

  const { email } = decoded;
  
  let connection;

  try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Fetch user password
      const [rows] = await connection.query("SELECT Password FROM Lecturer WHERE email = ?", [email]);


      // Validate old password
      const isMatch = await bcrypt.compare(password, rows[0].Password);
      if (!isMatch) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "Incorrect current password" });
      }

      // Hash new password after validation
      const newHashedPassword = await bcrypt.hash(newpassword, 10);
      await connection.query("UPDATE Lecturer SET Password = ? WHERE Email = ?", [newHashedPassword, email]);

      await connection.commit();
      res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
      if (connection) await connection.rollback();
      console.error("Error updating password:", error);

      res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
      if (connection) connection.release(); // Ensure connection is always released
  }
});


router.patch('/fondpassword/change', async (req, res) => {
  const token = req.cookies.att2day;
  if (!token) {
      return res.status(401).json({ success: false, message: "Authorization token missing" });
  }

  const { password, newpassword } = req.body;
       
  if (!password || !newpassword) {
      return res.status(400).json({ success: false, message: "Both current and new passwords are required" });
  }

  let decoded;
  try {
      decoded = jwt.verify(token, secretKey);
  } catch (error) {
      if (error.name === "TokenExpiredError") {
          return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
      }
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token", error: error.message });
  }

  const { email } = decoded;
  let connection;

  try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Fetch user password
      const [rows] = await connection.query("SELECT Password FROM fond WHERE Email = ?", [email]);


      // Validate old password
      const isMatch = await bcrypt.compare(password, rows[0].Password);
      if (!isMatch) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "Incorrect current password" });
      }

      // Hash new password after validation
      const newHashedPassword = await bcrypt.hash(newpassword, 10);
      await connection.query("UPDATE fond SET Password = ? WHERE Email = ?", [newHashedPassword, email]);

      await connection.commit();
      res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
      if (connection) await connection.rollback();
      console.error("Error updating password:", error);

      res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
      if (connection) connection.release(); // Ensure connection is always released
  }
});

router.delete('/deactivate/delete/', async (req, res) => {
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

  const { Regno } = req.query; 
  if (!Regno) {
      return res.status(400).json({ success: false, message: 'Missing student ID' });
  }

  let connection;

  try {
      connection = await pool.getConnection();

      const query = `DELETE FROM students WHERE Regno = ?`;
      const [result] = await connection.query(query, [Regno]);

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