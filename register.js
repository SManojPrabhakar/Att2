const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const pool = require('./config.js');

require('dotenv').config();
const secretKey =process.env.SECRET_KEY

router.post('/register', async (req, res) => {
    try {
        const token = req.cookies.att2day;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
        }

        const decodedToken = jwt.verify(token, secretKey);
        if (Date.now() >= decodedToken.exp * 1000) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
        }

        const {
            State,
            College_Type,
            College_Code,
            College_Name,
            College_Email,
            College_Number,
            Principal,
            Imagekeys,
            P_Email,
            College_Address,
            fondid
        } = req.body;

        const longValue = Number(College_Number);

        // Validate required fields
        if (
            !State || !College_Type || !College_Code || !College_Name ||
            !College_Email || !College_Number || !Principal || !P_Email ||
            !College_Address || !fondid
        ) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.query(
                `INSERT INTO register 
                (State, College_Type, College_Code, College_Name, College_Address, College_Email, College_Admin_Number, Principal, Imagekeys, P_Email, fonid) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [State, College_Type, College_Code, College_Name, College_Address, College_Email, longValue, Principal, Imagekeys, P_Email, fondid]
            );
        } finally {
            connection.release();
        }

        return res.status(200).json({
            success: true,
            message: "College registered successfully! You'll receive an email within 24 hours with a unique code. Lecturers and admins will use this code to sign up—please save it for future use."
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
        }
         console.log(error.sqlMessage)
        // Handle MySQL duplicate entry error
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.sqlMessage.includes('Collage_Admin_Number_UNIQUE')) {
                return res.status(400).json({
                    success: false,
                    message: 'A college with this phone number already exists. Please use a different number.'
                });
            }
            if (error.sqlMessage.includes('Collage_Code_UNIQUE')) {
                return res.status(400).json({
                    success: false,
                    message: 'This college code is already registered. Please use a different code.'
                });
            }
            if (error.sqlMessage.includes('Collage_Email_UNIQUE')) {
                return res.status(400).json({
                    success: false,
                    message: 'This college email is already registered. Please use a different email.'
                });
            }
             if (error.sqlMessage.includes('P_Email_UNIQUE')) {
                return res.status(400).json({
                    success: false,
                    message: 'This college email is already registered. Please use a different email.'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'A duplicate entry was found. Please check your input for unique fields.'
            });
        }

        console.error('Registration error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Something went wrong. Please try again later.' });
    }
});


  module.exports = router;