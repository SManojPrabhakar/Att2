const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const jwt=require("jsonwebtoken")
const pool = require('./config.js');
const s3 = require('./awsConfig.js');
require('dotenv').config();
const multer = require('multer')
const storage = multer.memoryStorage();
const secretKey =process.env.SECRET_KEY


  /*router.put('/student/signup/', async (req, res) => {
    let connection;
    try {
      const { roll, Email, password } = req.body; // Destructure request body for better readability
  
      // Validate input
      if (!roll || !Email || !password) {
        return res.status(400).json({ success: false, message: 'Roll, Email, and password are required.' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Get a database connection
      connection = await pool.getConnection();
  
      // Update the Email and password in the students table
      const [result] = await connection.query(
        'UPDATE students SET Email = ?, password = ? WHERE Id = ?',
        [Email, hashedPassword, roll]
      );
  
      if (result.affectedRows === 0) {
        // If no rows are affected, the roll number does not exist
        return res.status(404).json({ success: false, message: `Student with roll number ${roll} does not registered.` });
      }
  
      // Release the connection
      connection.release();
  
      // Send a success response
      res.status(200).json({ success: true, message: 'Student details updated successfully' });
    } catch (error) {
      if (connection) connection.release(); // Ensure connection is released on error
      console.error('Error updating student details:', error);
  
      // Handle specific error cases
      if (error.code === 'ER_DUP_ENTRY') {
        // Handle duplicate email entry
        res.status(400).json({ success: false, message: 'The provided email is already in use.' });
      } else {
        // Generic error response
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }
  });*/
  

router.post('/lecturer/admin/signup/', async (req, res) => {
    let connection;

    try {
        const { Role, College, Fullname, Regno, Email, Code, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        connection = await pool.getConnection();

        // Check if email already exists in 'fond' table
        const [founderResult] = await connection.query(
            'SELECT 1 FROM fond WHERE Email = ? LIMIT 1',
            [Email]
        );
        if (founderResult.length > 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'This email has already been registered as a chairmen or principal.',
            });
        }

        // Check if email exists in lecturer table
        const [lecturerResult] = await connection.query(
            'SELECT 1 FROM lecturer WHERE Email = ? LIMIT 1',
            [Email]
        );
        if (lecturerResult.length > 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'This email has already been registered as a lecturer.',
            });
        }

        // Check if email exists in students table
        const [studentResult] = await connection.query(
            'SELECT 1 FROM students WHERE Email = ? LIMIT 1',
            [Email]
        );
        if (studentResult.length > 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'This email has already been registered as a student.',
            });
        }

        // ✅ Validate that College and Code match in collegedetails table
        const [collegeResult] = await connection.query(
    'SELECT college_code FROM register WHERE College_name = ? OR Code = ? LIMIT 1',
    [College, Code]
);

if (collegeResult.length === 0) {
    connection.release();
    return res.status(400).json({
        success: false,
        message: 'Invalid College Name or Code. Please verify your college information.',
    });
}

// Proceed with collegeResult[0].college_code if found
const collegeCode = collegeResult[0].college_code;

// Continue your logic here

        // Insert lecturer
        const insertQuery = `
            INSERT INTO lecturer (regno, Email, College_name, Fullname, Code, Password, Role,college_code) 
            VALUES (?, ?, ?, ?, ?, ?, ?,?)
        `;
        const values = [Regno, Email, College, Fullname, Code, hashedPassword, Role,collegeCode];
        await connection.query(insertQuery, values);

        connection.release();

        res.status(200).json({
            success: true,
            message: 'Congratulations, user account has been created',
        });

    } catch (error) {
        if (connection) {
            connection.release();
        }

        console.error('Error handling signup request:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            if (error.sqlMessage.includes('Email')) {
                return res.status(400).json({ success: false, message: 'A user with the same Email already exists.' });
            }
            if (error.sqlMessage.includes('regno')) {
                return res.status(400).json({ success: false, message: 'A user with the same registration number already exists.' });
            }
        }

        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


    router.post('/founder/signup/', async (req, res) => {
  let connection;
  try {
    const { Role, Fullname, Email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    connection = await pool.getConnection();

    // Check if email exists in founder table
    const [founderResult] = await connection.query(
      'SELECT 1 FROM fond WHERE Email = ? LIMIT 1',
      [Email]
    );
    if (founderResult.length > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'This email has already been registered as a founder.',
      });
    }

    // Check in lecturer table
    const [lecturerResult] = await connection.query(
      'SELECT 1 FROM lecturer WHERE Email = ? LIMIT 1',
      [Email]
    );
    if (lecturerResult.length > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'This email has already been registered as a lecturer.',
      });
    }

    // Check in students table
    const [studentResult] = await connection.query(
      'SELECT 1 FROM students WHERE Email = ? LIMIT 1',
      [Email]
    );
    if (studentResult.length > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'This email has already been registered as a student.',
      });
    }

    // Insert into fond table
    await connection.query(
      'INSERT INTO fond (Email, Fullname, Password, Role) VALUES (?, ?, ?, ?)',
      [Email, Fullname, hashedPassword, Role]
    );

    connection.release();
    return res.status(200).json({ success: true, message: 'Congratulations, user account has been created' });

  } catch (error) {
    console.error('Error handling request:', error);

    if (error.code && error.code.includes('ER_DUP_ENTRY')) {
      if (error.sqlMessage && error.sqlMessage.includes('Email')) {
        res.status(400).json({ success: false, message: 'A user with the same Email already exists.' });
      } else {
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
});

  
      router.get('/college-feelist/receipts/', async (req, res) => {

   
        try {
            const query = `select Feetype,paidFee,PaymentDate from CollegeFee where regno=?`
      
            // Use the connection pool to get a connection
            const connection = await pool.getConnection();
      
            // Execute the query using the connection
            const result= await connection.query(query); // Destructuring the result to access rows directly
      const fees= result[0] 
            // Release the connection back to the pool
            connection.release();
      
            res.status(200).json({ success: true, message:fees}); 
            
          
        } catch (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });
    
    
 router.post('/college-fee/reg/', async (req, res) => {
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
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', errorMessage: error.message });
  }

  const {
    Regno, Fullname, joiningdate, Year, Section, Course, Gender,
    College, Sem, Fee, Completion, Password, Role, Number, Regulation
  } = req.body;

    const completionMapping = {
  'I year': 1,
  'II year': 2,
  'III year': 3,
  'IV year': 4,
  'V year': 5
};

  const hashedPassword = await bcrypt.hash(Password, 10);

  // Validate required fields (excluding Fee now)
  if (!Regno || !Fullname || !joiningdate || !Year || !Section || !Course || !Gender || !College || !Sem || !Completion || !Regulation) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Validate Completion
  if (Completion <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid Completion value (must be greater than zero)' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

     const [studentRows] = await connection.query(`SELECT Regno FROM students WHERE Regno = ?`, [Regno]);

    // Check if Regno exists in lecturer
    const [lecturerRows] = await connection.query(`SELECT Regno FROM lecturer WHERE Regno = ?`, [Regno]);

    if (studentRows.length > 0 || lecturerRows.length > 0) {
      connection.release();
      return res.status(409).json({ success: false, message: "Regno already exists in students or lecturers." });
    }

// Check if Phone already exists in students
    const [phoneRows] = await connection.query(`SELECT Regno FROM students WHERE Number = ?`, [Number]);
    if (phoneRows.length > 0) {
      connection.release();
      return res.status(409).json({ success: false, message: "Phone number already exists." });
    }

    // Insert into students table
    const insertQuery1 = `
      INSERT INTO students (Regno, Fullname, joining_date, Year, Section, Course, Gender, college_name, course_completion_years, password, Role, Sem, Number, Regulation) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(insertQuery1, [Regno, Fullname, joiningdate, Year, Section, Course, Gender, College, Completion, hashedPassword, Role, Sem, Number, Regulation]);

    // If Fee is provided and not null, insert fee-related data
       const numericCompletion = completionMapping[Completion?.trim()];

    // Handle Fee
  if (
  Fee !== null &&
  Fee !== undefined &&
  Fee !== "" &&
  !isNaN(parseFloat(Fee)) &&
  numericCompletion > 0
) {
  const fees = parseFloat(Fee);
  const college_fee = parseFloat((fees / numericCompletion).toFixed(2));
  const currentAcademicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  const insertFeeQuery = `
    INSERT INTO Yearly_fees (Regno, Fee_type, Fee_year, Fee_total, Fee_due) 
    VALUES (?, ?, ?, ?, ?)
  `;
  await connection.query(insertFeeQuery, [
    Regno,
    "College-fee",
    currentAcademicYear,
    college_fee,
    college_fee
  ]);
}



    await connection.commit();
    connection.release();

    res.status(200).json({ success: true, message: "Registered successfully" });

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }

     if (error.code === 'ER_DUP_ENTRY') {
      const msg = error.message;
      if (msg.includes('Regno')) {
        return res.status(409).json({ success: false, message: "Regno already exists." });
      } else if (msg.includes('Number')) {
        return res.status(409).json({ success: false, message: "Phone number already exists." });
      } else {
        return res.status(409).json({ success: false, message: "Duplicate entry detected.", errorMessage: msg });
      }
    }

    if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: "Invalid foreign key reference. Please check if the college exists." });
    }

    console.error('Error executing query:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
  }
});



function getSignedUrl(key) {
  if (!key) return null;
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.Bucket,
    Key: key,
    Expires: 60 * 5 // 5 minutes
  });
}

router.post('/app/forget/verify', async (req, res) => {
  try {
    const { Email } = req.body;

    if (!Email) {
      return res.status(400).json({ error: 'Email or Regno is required' });
    }

    const isEmail = Email.includes('@');

    const studentQuery = isEmail
      ? 'SELECT Fullname, Regno, profile FROM students WHERE Email = ?'
      : 'SELECT Fullname, Regno, profile FROM students WHERE Regno = ?';

    const lecturerQuery = isEmail
      ? 'SELECT Fullname, Regno, profile FROM lecturer WHERE Email = ?'
      : 'SELECT Fullname, Regno, profile FROM lecturer WHERE Regno = ?';

    const founderQuery = 'SELECT Fullname, profile FROM fond WHERE Email = ?';

    const connection = await pool.getConnection();

    try {
      let [rows] = await connection.query(studentQuery, [Email]);

      if (rows.length === 0) {
        [rows] = await connection.query(lecturerQuery, [Email]);
      }

      if (rows.length === 0 && isEmail) {
        [rows] = await connection.query(founderQuery, [Email]);
      }

      if (rows.length === 0) {
        console.log(rows)
       return res.status(404).json({
      success: false,
      message: "User not found",
    });
      }

      const user = rows[0];
      const profilepic = getSignedUrl(user.profile);

      const responseData = {
        fullname: user.Fullname,
        ...(user.Regno && { regno: user.Regno }),
        profilepic
      };
    
      return res.status(200).json(responseData);

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



  module.exports = router;