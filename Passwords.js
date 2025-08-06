const express = require('express');
const router = express.Router();
const app = express();
const cookieParser = require('cookie-parser');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



app.use(cookieParser());
app.use(express.json());


const pool = require('./config.js');


require('dotenv').config();
const secretKey =process.env.SECRET_KEY


router.patch('/password/change', async (req, res) => {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

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

  const { email } = decoded;
  let connection;

  try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Fetch user password
      const [rows] = await connection.query("SELECT Password FROM students WHERE Email = ?", [email]);


      // Validate old password
      const isMatch = await bcrypt.compare(password, rows[0].Password);
      if (!isMatch) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "Incorrect current password" });
      }

      // Hash new password after validation
      const newHashedPassword = await bcrypt.hash(newpassword, 10);
      await connection.query("UPDATE students SET Password = ? WHERE Email = ?", [newHashedPassword, email]);

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
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const { password, newpassword } = req.body;
    if (!password || !newpassword) {
        return res.status(400).json({ success: false, message: "Both current and new passwords are required" });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Unauthorized: Token has expired" });
        }
        return res.status(401).json({ success: false, message: "Unauthorized: Invalid token", error: error.message });
    }

    const { email } = decoded;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let userTable = null;
        let hashedPassword = null;

        // Check Lecturer table
        const [lecturerRows] = await connection.query("SELECT Password FROM lecturer WHERE Email = ?", [email]);
        if (lecturerRows.length > 0 && lecturerRows[0].Password) {
            userTable = 'Lecturer';
            hashedPassword = lecturerRows[0].Password;
        } else {
            // If not found in Lecturer, check fond table
            const [fondRows] = await connection.query("SELECT Password FROM fond WHERE Email = ?", [email]);
            if (fondRows.length > 0 && fondRows[0].Password) {
                userTable = 'fond';
                hashedPassword = fondRows[0].Password;
            } else {
                await connection.rollback();
                return res.status(404).json({ success: false, message: "User not found or password missing" });
            }
        }

        // Compare old password with hashed password
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Incorrect current password" });
        }

        // Hash and update new password
        const newHashedPassword = await bcrypt.hash(newpassword, 10);
        await connection.query(`UPDATE ${userTable} SET Password = ? WHERE Email = ?`, [newHashedPassword, email]);

        await connection.commit();
        res.status(200).json({ success: true, message: "Password updated successfully" });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error updating password:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    } finally {
        if (connection) connection.release();
    }
});


router.patch('/password/verify/', async (req, res) => {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  const { password } = req.body;

  let connection;

  try {
    // Decode token
    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (error) {
      const message =
        error.name === "TokenExpiredError"
          ? "Unauthorized: Token has expired or is invalid"
          : "Unauthorized: Invalid token";
      return res.status(401).json({ success: false, message });
    }

    const { email } = decoded;

    connection = await pool.getConnection();

    // First check in lecturer table
    const [lecturerRows] = await connection.query(
      "SELECT Password FROM lecturer WHERE Email = ?",
      [email]
    );

    let userPassword = null;

    if (lecturerRows.length > 0) {
      userPassword = lecturerRows[0].Password;
    } else {
      // If not found in lecturer, check fond table
      const [fondRows] = await connection.query(
        "SELECT Password FROM fond WHERE Email = ?",
        [email]
      );
      if (fondRows.length > 0) {
        userPassword = fondRows[0].Password;
      }
    }

    if (!userPassword) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, userPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    res.status(200).json({ success: true, message: "Password verified successfully" });

  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});



router.patch('/app/forget/reset', async (req, res) => {
  const { Email,password } = req.body;
   
  // 1. Input Validation
  if (!Email || !password) {
    return res.status(400).json({
      success: false,
      message: "Identifier and new password are required",
    });
  }

 

  const isEmail = Email.includes('@');
  const hashedPassword = await bcrypt.hash(password, 10);

  const tables = [
    { table: 'students', field: isEmail ? 'Email' : 'Regno' },
    { table: 'lecturer', field: isEmail ? 'Email' : 'Regno' },
    { table: 'fond', field: 'Email' }
  ];

  let connection;

  try {
    connection = await pool.getConnection();
    let updated = false;

    for (const { table, field } of tables) {
      const [rows] = await connection.query(
        `SELECT * FROM ${table} WHERE ${field} = ?`,
        [Email]
      );

      if (rows.length > 0) {
        await connection.query(
          `UPDATE ${table} SET password = ? WHERE ${field} = ?`,
          [hashedPassword, Email]
        );
        updated = true;
        break;
      }
    }

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });

  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });

  } finally {
    if (connection) connection.release();
  }
});



  router.patch('/deactivate/', async (req, res) => {
    let connection;
    try {
       const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
      const { Active } = req.body;
  
      // Ensure token and Active are provided
      
      // Get a connection from the pool
      connection = await pool.getConnection();
  
      // Decode the token to get the user's email
      const decoded = jwt.verify(token, secretKey);
      const { email } = decoded;
  
      if (!email) {
        return res.status(400).json({ success: false, message: 'Invalid token' });
      }
  
      // Update the Active status for the user with the given email
      const [result] = await connection.query("UPDATE students SET Active = ? WHERE Email = ?", [Active, email]);
  
      // Check if the update affected any rows
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      // Respond with success if the update was successful
      res.status(200).json({ success: true, message: "Status updated successfully" });
  
    } catch (error) {
      // Handle errors and respond with a 500 status code
      console.error('Error handling request:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
      // Ensure the connection is released in all cases
      if (connection) connection.release();
    }
  });
  
  
  module.exports = router;