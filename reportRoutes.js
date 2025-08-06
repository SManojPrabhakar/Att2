const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');
const pool = require('./config.js');

require('dotenv').config();

const secretKey =process.env.SECRET_KEY
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service provider
    auth: {
      user: process.env.Email,
      pass: process.env.Pass 
    }
  });

  router.post("/reporting/", async (req, res) => {
    try {
         const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
        const { Email,Fullname, Organization,Number,Message } = req.body;

       // Verify the token
        let decoded;
           
        try {
            decoded = jwt.verify(token, secretKey);
        } catch (error) {
            console.error("JWT Verification Error:", error);
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
            }
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
        }

         const { Regno, Id } = decoded;
    const identifier = Regno !== null ? Regno : Id;

        // Validate required fields
        if (!Email || !Organization || !Fullname || !Number || !Message) {
            return res.status(400).json({ success: false, message: "Missing required fields (Email, Organization, Fullname, ReportDetails)" });
        }

        // Prevent Email Header Injection
        const sanitizedEmail = Email.replace(/(\r\n|\n|\r)/gm, "");

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        // Send email
     const mailOptions = {
  from: process.env.Email,
  to: Email,
  subject: `Issue Report Acknowledgement - ${Organization}`,
  text: `Dear ${Fullname},

Thank you for bringing this issue to our attention.

We have received your report and our team will review it shortly. 
If we require any additional information, we will reach out to you directly.

We appreciate your effort in helping us improve our services.

Warm regards,  
The Attendance2day Team`
};


        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error("Error sending email:", emailError);
            return res.status(500).json({ success: false, message: "Failed to send email", error: emailError.message });
        }

        // Insert report data into MySQL table
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO report (email, Username, full_name,Regno,Number, message, Timestamp) 
                VALUES (?, ?, ?, ?, ?, ?,UNIX_TIMESTAMP())`;
            await connection.execute(query, [Email, Organization, Fullname, identifier,Number,Message]);
            connection.release();

            return res.status(200).json({ success: true, message: "Email sent and report saved successfully" });
        } catch (dbError) {
            connection.release();
            console.error("Database Error:", dbError);

            // Handling specific MySQL errors
            if (dbError.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ success: false, message: "Duplicate report entry" });
            } else if (dbError.code === "ER_BAD_FIELD_ERROR") {
                return res.status(500).json({ success: false, message: "Invalid database field" });
            }

            return res.status(500).json({ success: false, message: "Failed to save report", error: dbError.message });
        }

    } catch (unexpectedError) {
        console.error("Unexpected Error:", unexpectedError);
        return res.status(500).json({ success: false, message: "Something went wrong", error: unexpectedError.message });
    }
});

  

router.post("/web/reporting/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (error) {
      console.error("JWT Verification Error:", error);
      return res.status(401).json({
        success: false,
        message:
          error.name === "TokenExpiredError"
            ? "Unauthorized: Token has expired or is invalid"
            : "Unauthorized: Invalid token",
      });
    }

     const { Regno, Id } = decoded;
    const identifier = Regno !== null ? Regno : Id;
    // Extract and validate fields
    const { Email, Fullname, Organization, Number, Message } = req.body;

    if (!Email || !Fullname || !Organization || !Number || !Message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (Email, Fullname, Organization, Number, Message)",
      });
    }

  const sanitizedEmail = (Email || "").replace(/(\r\n|\n|\r)/gm, "").trim();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


if (!emailRegex.test(sanitizedEmail)) {
    console.log("Email validation failed.");
    return res.status(400).json({ success: false, message: "Invalid email format" });
}

    // Send acknowledgment email
    const mailOptions = {
      from: process.env.Email,
      to: sanitizedEmail,
      subject: `Issue Report Acknowledgement - ${Organization}`,
      text: `Dear ${Fullname},

Thank you for bringing this issue to our attention.

We have received your report and our team will review it shortly. 
If we require any additional information, we will reach out to you directly.

We appreciate your effort in helping us improve our services.

Warm regards,  
The Attendance2day Team`,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("Email Send Error:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send acknowledgment email",
        error: emailError.message,
      });
    }

    // Save report to DB
    const connection = await pool.getConnection();

    try {
      const query = `
        INSERT INTO report (email, Username, full_name, Regno, Number, message, Timestamp)
        VALUES (?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP())
      `;
      await connection.execute(query, [
        sanitizedEmail,
        Organization,
        Fullname,
        identifier,
        Number,
        Message,
      ]);
      connection.release();

      return res.status(200).json({
        success: true,
        message: "Report submitted and email sent successfully",
      });
    } catch (dbError) {
      connection.release();
      console.error("Database Insert Error:", dbError);

      if (dbError.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ success: false, message: "Duplicate report entry" });
      } else if (dbError.code === "ER_BAD_FIELD_ERROR") {
        return res.status(500).json({ success: false, message: "Invalid database field" });
      }

      return res.status(500).json({ success: false, message: "Database error", error: dbError.message });
    }
  } catch (err) {
    console.error("Unexpected Error:", err);
    return res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
  }
});



router.post("/web/contact/", async (req, res) => {
  try {
    

    // Extract and validate fields
    const { Email, Fullname, issue, Number, Message } = req.body;

    if (!Email || !Fullname || !issue || !Number || !Message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (Email, Fullname, Organization, Number, Message)",
      });
    }

    const sanitizedEmail = (Email || "").replace(/(\r\n|\n|\r)/gm, "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(sanitizedEmail)) {
      console.log("Email validation failed.");
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Send acknowledgment email
    const mailOptions = {
      from: process.env.Email,
      to: sanitizedEmail,
      subject: `Thank You for Contacting Us - ${issue}`,
      text: `Dear ${Fullname},

Thank you for reaching out to us.

We have received your message and our team will get back to you as soon as possible. 
If we need more details, we’ll contact you via this email.

Warm regards,  
The Attendance2day Team`,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("Email Send Error:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send acknowledgment email",
        error: emailError.message,
      });
    }

    // Save contact message to DB
    const connection = await pool.getConnection();

    try {
      const query = `
        INSERT INTO contact_us (email,  fullname, issue, phonenumber, message, submittedat)
        VALUES (?, ?, ?, ?, ?, UNIX_TIMESTAMP())
      `;
      await connection.execute(query, [
        sanitizedEmail,
        Fullname,
       issue,
        Number,
        Message,
      ]);
      connection.release();

      return res.status(200).json({
        success: true,
        message: "Thank you! Your message has been received. We’ll get back to you shortly via email.",
      });
    } catch (dbError) {
      connection.release();
      console.error("Database Insert Error:", dbError);

      if (dbError.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ success: false, message: "Duplicate contact entry" });
      } else if (dbError.code === "ER_BAD_FIELD_ERROR") {
        return res.status(500).json({ success: false, message: "Invalid database field" });
      }

      return res.status(500).json({ success: false, message: "Database error", error: dbError.message });
    }
  } catch (err) {
    console.error("Unexpected Error:", err);
    return res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
  }
});


  /*router.put('/dbrepo/', async (req, res) => {
    try {
        // Extract token from headers
        const token = req.headers.authorization;
        if (!token) {
          return res.status(401).json({ success: false, message: 'No token provided.' });
        }
    
        // Verify and decode the JWT token
        const decoded = jwt.verify(token, secretKey); // Replace 'your-secret-key' with your actual secret key
      const { Organization, Message,Number } = req.body;
      const { Regno}  = decoded;
      const isExpired = Date.now() >= decoded.exp * 1000;
      if (isExpired) {
        return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
      }
  
      
      // Insert the received data into MySQL database
      const connection = await pool.getConnection();
  
      // Update the Report column with the JSON data for the specified email
      const [results] = await connection.query(
      `
    UPDATE students
    SET Report = JSON_ARRAY_APPEND(
        Report,
        '$',
        JSON_OBJECT(
            'OriganizationName/Username', ?,
            'Number',?,
            'Issue', ?
        )
    )
    WHERE Regno = ?;
  `,
        [Organization,Number,Message,Regno]
      );
  
      connection.release();
  
      // Check if any rows were affected
      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'No user found with the provided email.' });
      }
  
      // Send a success response to the client
      const serverResponse = 'Report updated successfully';
      res.status(200).json({ success: true, message: serverResponse });
  
    } catch (error) {
      console.error('Error handling request:', error);
  
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      } else {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
      }
    }
  });*/
  
router.post("/app/feedback/", async (req, res) => {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
    const { Email, Message } = req.body;

    

    // Verify JWT Token
    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (error) {
        const message = error.name === 'TokenExpiredError'
            ? 'Unauthorized: Token has expired or is invalid'
            : 'Unauthorized: Invalid token';
        return res.status(401).json({ success: false, message, error: error.message });
    }

     const { Regno, Id } = decoded;
    const identifier = Regno !== null ? Regno : Id;

    // Check required fields
    if (!Email || !Message) {
        return res.status(400).json({ success: false, message: "Missing required fields (Email, Message)" });
    }

    // Sanitize and validate email
    const sanitizedEmail = Email.replace(/(\r\n|\n|\r)/gm, "");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(sanitizedEmail)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Send confirmation email
    const mailOptions = {
        from: process.env.Email,
        to: sanitizedEmail,
        subject: "Thank You for Your Feedback!",
        text: `Dear User,

Thank you for taking the time to share your feedback with us. 
We truly appreciate your input and are committed to using it to improve your experience with Attendance2Day.

If you have any additional suggestions or concerns, please don’t hesitate to reach out.

Warm regards,  
The Attendance2Day Team`
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (emailError) {
        console.error("Email Error:", emailError);
        return res.status(500).json({ success: false, message: "Failed to send email", error: emailError.message });
    }

    // Insert feedback into database
    try {
        const connection = await pool.getConnection();
        const query = `INSERT INTO feedback (regno, message, Timestamp) VALUES (?, ?, UNIX_TIMESTAMP())`;
        await connection.execute(query, [identifier, Message]);
        connection.release();

        return res.status(200).json({ success: true, message: "Feedback submitted successfully" });
    } catch (dbError) {
        console.error("Database Error:", dbError);
        return res.status(500).json({ success: false, message: "Failed to save feedback", error: dbError.message });
    }
});


  module.exports = router;