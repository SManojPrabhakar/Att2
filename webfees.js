const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const pool = require('./config.js');
const s3 = require('./awsConfig.js');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY

router.get('/feetypes/', async (req, res) => {
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

     const regno = req.query.Regno;
      const feeyear = req.query.feeyear;
    let connection;

    try {
        connection = await pool.getConnection();

        // Fetch fee types for the authenticated user
        const query = "SELECT fee_type FROM yearly_fees WHERE regno = ? AND Fee_Year=?";
        const [result] = await connection.query(query, [regno,feeyear]);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release(); // Ensure the connection is always released
    }
});


router.post('/college-fee/', async (req, res) => {
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

    const { Regno, Fee_type, Fee, Ayear } = req.body;
       
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
  // Step 1: Check if dues record exists
        const duesQuery = `SELECT Fee_due FROM yearly_fees WHERE Regno = ? AND Fee_year = ? AND Fee_type = ?`;
        const [duesRows] = await connection.query(duesQuery, [Regno, Ayear, Fee_type]);

        if (duesRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No dues record found for Regno: ${Regno}, FeeType: ${Fee_type}, Academic Year: ${Ayear}`
            });
        }

        const currentDue = duesRows[0].Fee_due;

        // Step 2: If due is 0, fee already paid
        if (currentDue === 0) {
            return res.status(400).json({
                success: false,
                message: `Fee already paid for Regno: ${Regno}, FeeType: ${Fee_type}, Academic Year: ${Ayear}`
            });
        }

       const feeAmount = parseFloat(Fee);
const dueAmount = parseFloat(currentDue);

if (feeAmount > dueAmount) {
    return res.status(400).json({
        success: false,
        message: `Entered amount ₹${feeAmount.toFixed(2)} exceeds the current due of ₹${dueAmount.toFixed(2)}`
    });
}


            // Check if a payment record already exists
        const checkQuery = `SELECT COUNT(*) AS count FROM collegefee WHERE Regno = ? AND Feetype = ?`;
        const [checkResult] = await connection.query(checkQuery, [Regno, Fee_type]);

        if (checkResult.count > 0) {
            throw new Error(`A payment record already exists for Regno: ${Regno}, FeeType: ${Fee_type}, Academic Year: ${Ayear}`);
        }
       
  

        // Step 5: Insert new payment record
        const insertQuery = `INSERT INTO collegefee (Regno, Feetype, PaidFee, PaymentDate) 
                             VALUES (?, ?, ?, UNIX_TIMESTAMP())`;
        await connection.query(insertQuery, [Regno, Fee_type, feeAmount]);

        // Step 6: Update dues
        const updateQuery = `UPDATE yearly_fees 
                             SET fee_due = fee_due - ? 
                             WHERE Regno = ? AND fee_year = ? AND Fee_type = ?`;
        const [updateResult] = await connection.query(updateQuery, [feeAmount, Regno, Ayear, Fee_type]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `No matching student record found to update dues for Regno: ${Regno}, Academic Year: ${Ayear}`
            });
        }

        await connection.commit();
        res.status(200).json({ success: true, message: "Payment processed and dues updated successfully!" });
    } catch (error) {
        if (connection) await connection.rollback();

        if (error.message.includes('A payment record already exists')) {
            res.status(409).json({ success: false, message: error.message });
        } else if (error.message.includes('No matching student record found')) {
            res.status(404).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            console.log(error.message)
        }
    } finally {
        if (connection) connection.release();
    }
});

router.post('/college-fee/enroll/', async (req, res) => {
    const token = req.cookies.att2day;
    if (!token) {
        return res.status(401).json({ success: false, message: 'Authorization token missing' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Unauthorized: ' + error.message });
    }

    const { Regno, Fee_type, Fee, Ayear, total } = req.body;

    const amount = parseFloat(Fee);
    const totalamount = parseFloat(total);
    const due =   totalamount-amount;

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 🔍 Check if payment already exists
        const checkQuery = `SELECT 1 FROM yearly_fees WHERE Regno = ? AND Fee_type = ? AND Fee_year = ?`;
        const [existing] = await connection.query(checkQuery, [Regno, Fee_type, Ayear]);

        if (existing.length > 0) {
            // ⚠️ Record exists — abort transaction, return error
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: `A payment record already exists for Regno: ${Regno}, FeeType: ${Fee_type}, Academic Year: ${Ayear}`
            });
        }

        // ✅ Insert into Yearly_fees
        const insertYearlyFees = `INSERT INTO yearly_fees (Regno, Fee_type, Fee_year, Fee_total, Fee_due)
                                  VALUES (?, ?, ?, ?, ?)`;
        await connection.query(insertYearlyFees, [Regno, Fee_type, Ayear, totalamount, due]);

        // ✅ Insert into CollegeFee
        const insertCollegeFee = `INSERT INTO collegefee (Regno, Feetype, PaidFee, PaymentDate)
                                  VALUES (?, ?, ?, UNIX_TIMESTAMP())`;
        await connection.query(insertCollegeFee, [Regno, Fee_type, Fee]);

        await connection.commit();
        res.status(200).json({ success: true, message: "Payment processed and dues updated successfully!" });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release();
    }
});


router.get("/search/get/", async (req, res) => {
  let connection;

  try {
    // Check for authorization token
     const token = req.cookies.att2day;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

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
    
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "Bad Request: college_name is required" });
    }

    // Database query to fetch student details
    const attendanceQuery = `
      SELECT Regno, Fullname, Profile, Year, Sem,Course,Section
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
              Bucket:'add-imag',
              Key: Profile,
              Expires: 3600, // 1 hour expiration
            });
          } catch (s3Error) {
            console.error("Error generating S3 URL:", s3Error);
          }
        }
        return { Regno, Fullname, Year, Sem,Course,Section, Profilepic: profileUrl };
      })
    );

    res.status(200).json(studentsWithProfileUrls);
  } catch (error) {
    console.error("Error retrieving student data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
});


router.get('/college-feedue/list/', async (req, res) => {
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

    const  regno  = req.query.Regno
    let connection;

    try {
        connection = await pool.getConnection();

        const query = `SELECT Fee_type, Fee_year, Fee_due FROM yearly_fees WHERE regno = ? And Fee_due > 0`;
        const [fees] = await connection.query(query, [regno]); // Extract rows properly

        res.status(200).json({ success: true, message: fees });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
});

router.post('/college-fee/other/', async (req, res) => {
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

    const { Regno, Fee_type, Fee } = req.body;
   
    let connection;

    try {
        connection = await pool.getConnection();
     

        // Insert new payment record
        const insertQuery = `INSERT INTO collegefee (Regno, Feetype, PaidFee,  PaymentDate) 
                             VALUES (?, ?, ?,UNIX_TIMESTAMP())`;
        await connection.query(insertQuery, [Regno, Fee_type, Fee]);

        res.status(200).json({ success: true, message: "Payment  successful!" });
    } catch (error) {
        if (connection) await connection.rollback();

        if (error.message.includes('A payment record already exists')) {
            res.status(409).json({ success: false, message: error.message });
        } else if (error.message.includes('No matching student record found')) {
            res.status(404).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    } finally {
        if (connection) connection.release();
    }
});


router.get('/previousfee/', async (req, res) => {
    const token = req.cookies.att2day;
    const {regno,feeyear,feetype}=req.query
   
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

    const { Regno } = decoded;
    let connection;

    try {
        connection = await pool.getConnection();

        // Fetch fee types for the authenticated user
        const query = "SELECT fee_total as total FROM yearly_fees WHERE regno = ? And Fee_year=? And Fee_type=?";
        const [result] = await connection.query(query, [regno,feeyear,feetype]);
       console.log(result)
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release(); // Ensure the connection is always released
    }
});

module.exports = router;