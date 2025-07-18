const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const pool = require('./config.js');

require('dotenv').config();
const secretKey =process.env.SECRET_KEY
//updates
//update student info table 
router.patch("/user/update/", async (req, res) => {
    let connection;
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
        }

        const decoded = jwt.verify(token, secretKey);
        const { Id } = decoded;

        const { Email, Fullname, Department, Desigination, Number, Address } = req.body;

        if (!Fullname || !Email) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        connection = await pool.getConnection();

        // 🔒 Email should not exist in other users
        const emailCheckQuery = `
            SELECT Email FROM students WHERE Email = ?
            UNION
            SELECT Email FROM fond WHERE Email = ?
            UNION
            SELECT Email FROM lecturer WHERE Email = ? AND Id != ?
        `;
        const [emailRows] = await connection.query(emailCheckQuery, [Email, Email, Email, Id]);

        if (emailRows.length > 0) {
            return res.status(409).json({ success: false, message: "Email already exists in system" });
        }

        // Unique designations
        const uniqueDesignations = [
            "principal",
            "controller of examinations",
            "director",
            "vice chancellor",
            "chancellor",
            "vice principal"
        ];

        if (Desigination && uniqueDesignations.includes(Desigination.toLowerCase())) {
            const checkQuery = `
                SELECT Id FROM lecturer 
                WHERE LOWER(Desigination) = ? AND Id != ? LIMIT 1
            `;
            const [existing] = await connection.query(checkQuery, [Desigination.toLowerCase(), Id]);

            if (existing.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: `'${Desigination}' is already assigned to another user. Only one person can hold this designation.`
                });
            }
        }

        // Check if Principal is registered
        if (Desigination && Desigination.toLowerCase() === "principal") {
            const principalCheckQuery = `
                SELECT * FROM register
                WHERE principal = ? OR p_email = ? LIMIT 1
            `;
            const [principalMatch] = await connection.query(principalCheckQuery, [Fullname, Email]);

            if (principalMatch.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Only registered principals can be assigned the 'Principal' designation"
                });
            }
        }

        const lecturerUpdateQuery = `
            UPDATE lecturer 
            SET fullname = ?, Department = ?, Desigination = ?, Number = ?, Address = ?, Email = ?
            WHERE Id = ?
        `;
        const [lecturerUpdateResult] = await connection.query(lecturerUpdateQuery, [
            Fullname, Department, Desigination, Number, Address, Email, Id
        ]);

        if (lecturerUpdateResult.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

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


router.patch("/user/update/founder/", async (req, res) => {
    let connection;
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, secretKey);
        const { Id } = decoded;

        const { Email, Fullname, Number, Address } = req.body;
         console.log(Email, Fullname, Number, Address)
        if (!Fullname) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Get a database connection
        connection = await pool.getConnection();

        // Check if email exists in other users (excluding current founder by Id)
        const emailCheckQuery = `
            SELECT Email FROM students WHERE Email = ?
            UNION
            SELECT Email FROM lecturer WHERE Email = ?
            UNION
            SELECT Email FROM fond WHERE Email = ? AND Id != ?
        `;
        const [emailRows] = await connection.query(emailCheckQuery, [Email, Email, Email, Id]);

        if (emailRows.length > 0) {
            return res.status(409).json({ success: false, message: "Email already exists in system" });
        }

        // Perform update
        const updateQuery = `
            UPDATE fond SET fullname = ?, Number = ?, Address = ?, Email = ?
            WHERE Id = ?
        `;
        const [updateResult] = await connection.query(updateQuery, [Fullname, Number, Address, Email, Id]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, message: "Updated Successfully" });

    } catch (err) {
        if (connection) await connection.rollback();

        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
        } else if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
        }

        console.error("Error updating founder:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    } finally {
        if (connection) connection.release();
    }
});



router.patch("/user/update/student/", async (req, res) => {
    let connection;
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
        }

        const decoded = jwt.verify(token, secretKey);
        const { Id } = decoded;

        const { Email, Fullname, Gaurdian, Number, Address } = req.body;

        if (!Fullname) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        connection = await pool.getConnection();

        // Check if email exists in any table and doesn't belong to the current user
        const emailCheckQuery = `
            SELECT Email FROM students WHERE Email = ? AND Id != ?
            UNION
            SELECT Email FROM lecturer WHERE Email = ?
            UNION
            SELECT Email FROM fond WHERE Email = ?
        `;
        const [emailRows] = await connection.query(emailCheckQuery, [Email, Id, Email, Email]);

        if (emailRows.length > 0) {
            return res.status(409).json({ success: false, message: "Email already exists in system" });
        }

        const studentUpdateQuery = `
            UPDATE students SET fullname=?, Number=?, Address=?, Gaurdian=?, Email=?
            WHERE Id=?`;
        const [studentUpdateResult] = await connection.query(studentUpdateQuery, [Fullname, Number, Address, Gaurdian, Email, Id]);

        if (studentUpdateResult.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

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


router.patch("/user/update/edit/", async (req, res) => {
    let connection;
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, secretKey);
        const { Regno } = decoded;

        const { Fullname, Year,Section,Sem,aRegno,Course } = req.body;
         
        if (!Fullname || !Year || !Section || !Sem || !aRegno || !Course) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Get a database connection
        connection = await pool.getConnection();
        

        // Try updating the students table
        const studentUpdateQuery = `
            UPDATE students SET fullname=?, regno=?, year=?, sem=?, course=?, section=? 
            WHERE Regno=?`;
        const [studentUpdateResult] = await connection.query(studentUpdateQuery, [Fullname, aRegno, Year, Sem,Course, Section, aRegno]);

     

       
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

router.put("/Academic/student/update/", async (req, res) => {
    const token = req.headers.authorization;
    const { Year, Sem, Ids } = req.body; // Destructuring req.body

    let connection;

    try {
        // Decode token
        const decoded = jwt.verify(token, secretKey);
        const { Regno } = decoded;

        // Check if the token has expired
        if (Date.now() >= decoded.exp * 1000) {
            return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
        }

        connection = await pool.getConnection();

        // Start a transaction
        await connection.beginTransaction();

        // Fetch current values from the 'students' table
        const selectQuery = `SELECT Regno, Year, Sem FROM students WHERE Regno IN (?)`;
        const [rows] = await connection.query(selectQuery, [Ids]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No students found' });
        }

        // Check if there are changes
        const studentsToUpdate = rows.filter(student => student.Year !== Year || student.Sem !== Sem);

        if (studentsToUpdate.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'No changes detected, update not performed' });
        }

        // Update query
        const studentUpdateQuery = `UPDATE students SET Sem = ?, Year = ? WHERE Regno IN (?)`;
        await connection.query(studentUpdateQuery, [Sem, Year,Ids]);

        // Commit the transaction
        await connection.commit();

        return res.status(200).json({ success: true, message: 'Updated Successfully' });

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
        } else {
            return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
        }
    } finally {
        if (connection) {
            await connection.release();
        }
    }
});



router.put("/Academic/lect/updatey/", async (req, res) => {
    const token = req.headers.authorization;
   

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token missing' });
    }

    const { Year, Sem, Ids: Regnos } = req.body;
  if (!Regnos || !Array.isArray(Regnos) || Regnos.length === 0) {
        return res.status(400).json({ success: false, message: 'No students selected' });
    }
    let connection;

    let decoded;
    try {
        decoded = jwt.verify(token, secretKey); // May throw if expired or malformed
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        } else {
            return res.status(500).json({ success: false, message: 'Token verification failed', error: err.message });
        }
    }

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const placeholders = Regnos.map(() => '?').join(',');
        const selectQuery = `SELECT Id, Year, Sem FROM students WHERE Id IN (${placeholders})`;
        const [rows] = await connection.query(selectQuery, [...Regnos]);

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Students not found' });
        }

        const hasChanges = rows.some(row => row.Year !== Year || row.Sem !== Sem);

        if (hasChanges) {
            const updateQuery = `UPDATE students SET Sem = ?, Year = ? WHERE Id IN (${placeholders})`;
            await connection.query(updateQuery, [Sem, Year, ...Regnos]);

            const deleteAttendanceQuery = `DELETE FROM attendance WHERE student_id IN (${placeholders})`;
            await connection.query(deleteAttendanceQuery, [...Regnos]);

            await connection.commit();
            return res.status(200).json({ success: true, message: 'Updated successfully and attendance reset' });
        } else {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'No changes detected, update skipped' });
        }

    } catch (err) {
        console.error("Database Error:", err);
        if (connection) await connection.rollback();
        return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    } finally {
        if (connection) connection.release();
    }
});



router.patch("/user/Deactive/", async (req, res) => {
    try {
        const token = req.headers.authorization;
        const Active = req.body.Active;
      
        const decoded = jwt.verify(token, secretKey);
        const { Regno } = decoded;

        // Check if the token has expired
        const isExpired = Date.now() >= decoded.exp * 1000;
        if (isExpired) {
            const errorMessage = 'Your session has expired. Please log in again.';
            return res.status(401).json({ success: false, message: errorMessage });
        }

        connection = await pool.getConnection();
        try {
            // Start transaction
            await connection.beginTransaction();

            // Update in 'students' table
            const studentUpdateQuery = "UPDATE students SET Active=?  WHERE Regno=?";
            let [studentUpdateResult] = await connection.query(studentUpdateQuery, [Active, Regno]);

            // If not found in 'students' table, check and update in 'lecturer' table
            if (studentUpdateResult.affectedRows === 0) {
                const lecturerUpdateQuery = "UPDATE lecturer SET Active=? WHERE Regno=?";
                let [lecturerUpdateResult] = await connection.query(lecturerUpdateQuery, [Active, Regno]);

                // If not found in both tables
                if (lecturerUpdateResult.affectedRows === 0) {
                    console.log("User not found in both tables");
                    return res.status(404).json({ success: false, message: 'User not found' });
                }
            }

            // Commit the transaction
            await connection.commit();

            return res.status(200).json({ success: true, message: 'Updated Successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
        
            return res.json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
          } else {
            return res.json({ success: false, message: 'Unauthorized: Invalidtoken' });
          }
    }
});

router.put("/change/college/", async (req, res) => {
    let connection;

    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(403).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, secretKey);
        const { Id } = decoded;

        const { Collegename, Code, Regno } = req.body;

        if (!Collegename || !Code || !Regno) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction(); // 🔒 Start transaction

        // Step 1: Validate college
        const [rows] = await connection.query(
            "SELECT College_Name, College_Code FROM register WHERE code = ?",
            [Code]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Invalid code, college not found" });
        }

        const registeredCollege = rows[0].College_Name;
        const collegeCode = rows[0].College_Code;

        if (registeredCollege !== Collegename) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "College name and code do not match our records" });
        }

        // Step 2: Update lecturer info and nullify department/designation
        const updateSql = `
            UPDATE lecturer 
            SET College_Name = ?, Code = ?, Regno = ?, College_Code = ?, Department = NULL, Desigination = NULL
            WHERE Id = ?
        `;
        const [updateResult] = await connection.query(updateSql, [Collegename, Code, Regno, collegeCode, Id]);

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Lecturer not found or not authorized to update" });
        }

        // Step 3: Delete related data
        await connection.query("DELETE FROM lect_classes WHERE lecturer_id = ?", [Id]);
        await connection.query("DELETE FROM lecturer_subjects WHERE lecturer_id = ?", [Id]);
        await connection.query("DELETE FROM lecturer_attendance_log WHERE lecturer_id = ?", [Id]);
        await connection.query("DELETE FROM examtimetable WHERE lecturer_id = ?", [Id]);
 await connection.query("DELETE FROM assignments WHERE lecturer_id = ?", [Id]);
        await connection.commit(); // ✅ Commit transaction

        return res.json({ success: true, message: "College updated and associated data removed successfully" });

    } catch (error) {
        if (connection) await connection.rollback(); // 🔄 Rollback on error

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
        } else if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Unauthorized: Token has expired" });
        }

        console.error("Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    } finally {
        if (connection) connection.release(); // 🔓 Release connection
    }
});



  router.delete('/deactivate/delete/', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token missing' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Unauthorized: Token has expired or is invalid' : 'Unauthorized: Invalid token',
      error: error.message,
    });
  }

  const { Regno } = req.query;
  if (!Regno) {
    return res.status(400).json({ success: false, message: 'Missing student ID (Regno)' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction(); // 🔒 Begin transaction

    // 1. Get the student's Id first
    const [studentRows] = await connection.query(`SELECT Id FROM students WHERE Regno = ?`, [Regno]);
    if (studentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'No student found with the given Regno' });
    }
    const studentId = studentRows[0].Id;

    // 2. Get all post IDs for the student
    const [postRows] = await connection.query(`SELECT postid FROM posts WHERE Regno = ?`, [Regno]);
    const postIds = postRows.map(row => row.postid);

    // 3. Delete related likes and comments
    if (postIds.length > 0) {
      await connection.query(`DELETE FROM likes WHERE post_id IN (?)`, [postIds]);
      await connection.query(`DELETE FROM comments WHERE post_id IN (?)`, [postIds]);
    }

    // 4. Delete from other tables using Regno
    await connection.query(`DELETE FROM external_results WHERE Regno = ?`, [Regno]);
    await connection.query(`DELETE FROM internal_results WHERE Regno = ?`, [Regno]);
    await connection.query(`DELETE FROM notifications WHERE Regno = ?`, [Regno]);

    // 5. Delete from attendance tables using Id
    await connection.query(`DELETE FROM attendance WHERE student_id = ?`, [studentId]);
    await connection.query(`DELETE FROM attendance_summary_backup WHERE student_id = ?`, [studentId]);

    // 6. Delete posts
    await connection.query(`DELETE FROM posts WHERE Regno = ?`, [Regno]);

    // 7. Finally, delete student
    const [result] = await connection.query(`DELETE FROM students WHERE Regno = ?`, [Regno]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Student not found or already deleted' });
    }

    await connection.commit(); // ✅ Commit transaction

    return res.status(200).json({ success: true, message: 'Student and related data deleted successfully' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error executing delete query:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    if (connection) connection.release();
  }
});




module.exports = router;


/*
  const studentUpdateQuery = `
            UPDATE students SET fullname=?, Number=?, Address=?, Gaurdian=?, Email=?
            WHERE Id=?`;
        const [studentUpdateResult] = await connection.query(studentUpdateQuery, [Fullname, Number, Address, Gaurdian, Email, Id]);

        if (studentUpdateResult.affectedRows === 0) {*/