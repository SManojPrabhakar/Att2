const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const pool = require('./config.js');

require('dotenv').config();
const secretKey =process.env.SECRET_KEY
     const Buck=process.env.Bucket  
router.get('/college-feelist/receipts/', async (req, res) => {
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
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', error: error.message });
    }

    const { Regno } = decoded;
    let connection;

    try {
        connection = await pool.getConnection();

        const query = `SELECT Feetype, paidFee, PaymentDate FROM collegefee WHERE regno = ?`;
        const [fees] = await connection.query(query, [Regno]); // Extract rows properly
 
        res.status(200).json({ success: true, message: fees });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
});

router.get('/college-feedue/list/', async (req, res) => {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

     const {regno}=req.query
   

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

        const query = `SELECT Fee_type, Fee_year, Fee_due 
FROM yearly_fees 
WHERE Regno = ? AND Fee_due > 0;
`;
        const [fees] = await connection.query(query, [regno]); // Extract rows properly
         
        res.status(200).json({ success: true, message: fees });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
});


router.get('/college-feedue/student/', async (req, res) => {
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
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', error: error.message });
    }

    const { Regno } = decoded;
    let connection;

    try {
        connection = await pool.getConnection();

        const query = `SELECT Fee_type, Fee_year, Fee_due FROM yearly_fees WHERE regno = ? And Fee_due > 0`;
        const [fees] = await connection.query(query, [Regno]); // Extract rows properly
     
        res.status(200).json({ success: true, message: fees });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
});

router.post('/college-fee/', async (req, res) => {
      const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.name === 'TokenExpiredError'
                ? 'Unauthorized: Token has expired or is invalid'
                : 'Unauthorized: Invalid token',
            error: error.message
        });
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
        console.error("Payment processing error:", error);

        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/student/feetypes/', async (req, res) => {
      const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
    const {feeyear}=req.query
    

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
        const query = `SELECT fee_type 
FROM yearly_fees 
WHERE regno = ? AND Fee_year = ? 
`;
        const [result] = await connection.query(query, [Regno,feeyear]);
        console.log(result)
        res.status(200).json(result);
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release(); // Ensure the connection is always released
    }
});


router.get('/feetypes/', async (req, res) => {
       const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
    const {regno,feeyear}=req.query
   
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
        const query = `SELECT fee_type 
FROM yearly_fees 
WHERE regno = ? AND Fee_year = ? 
`;
        const [result] = await connection.query(query, [regno,feeyear]);
      
        res.status(200).json(result);
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release(); // Ensure the connection is always released
    }
});



router.get('/previousfee/', async (req, res) => {
      const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const {regno,feeyear,feetype}=req.query
 
    console.log(regno,token,feetype)
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


router.post('/college-fee/enroll/', async (req, res) => {
      const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: error.name === 'TokenExpiredError' 
                ? 'Unauthorized: Token has expired' 
                : 'Unauthorized: Invalid token', 
            error: error.message 
        });
    }

    const { Regno, Fee_type, Fee, Ayear, total } = req.body;

    const paidAmount = parseFloat(Fee);
    const totalAmount = parseFloat(total);

    // Ensure valid numbers
    if (isNaN(paidAmount) || isNaN(totalAmount)) {
        return res.status(400).json({ success: false, message: 'Invalid numeric values for Fee or total' });
    }

    // Format to two decimal places
    const dueAmount = parseFloat((totalAmount - paidAmount).toFixed(2));
    const formattedTotal = parseFloat(totalAmount.toFixed(2));
 const paid = parseFloat(paidAmount.toFixed(2));
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check if a payment record already exists
        const checkQuery = `
            SELECT * FROM yearly_fees 
            WHERE Regno = ? AND Fee_type = ? AND Fee_year = ?
        `;
        const [checkResult] = await connection.query(checkQuery, [Regno,Fee_type, Ayear]);

        if (checkResult.length > 0) {
            throw new Error(`A payment record already exists for Regno: ${Regno}, FeeType: ${Fee_type}, Academic Year: ${Ayear}`);
        }

        // Insert new payment record into Yearly_fees
        const insertYearly = `
            INSERT INTO yearly_fees (Regno, Fee_type, Fee_year, Fee_total, Fee_due) 
            VALUES (?, ?, ?, ?, ?)
        `;
        await connection.query(insertYearly, [Regno, Fee_type, Ayear, formattedTotal, dueAmount]);

        // Insert into CollegeFee log
        const insertCollegeFee = `
            INSERT INTO collegefee (Regno, Feetype, PaidFee, PaymentDate) 
            VALUES (?, ?, ?,  UNIX_TIMESTAMP())
        `;
        await connection.query(insertCollegeFee, [Regno,Fee_type, paid,]);

        await connection.commit();
        res.status(200).json({ success: true, message: "Payment processed and dues updated successfully!" });

    } catch (error) {
        if (connection) await connection.rollback();

        if (error.message.includes('already exists')) {
            res.status(409).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
            console.log( error.message)
        }
    } finally {
        if (connection) connection.release();
    }
});


  


router.post('/college-fee/online', async (req, res) => {
       const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.name === 'TokenExpiredError'
                ? 'Unauthorized: Token has expired or is invalid'
                : 'Unauthorized: Invalid token',
            error: error.message
        });
    }
     

    const {  feeType, amount, year, transactionId, paymentMode, upiId } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Step 1: Check if dues record exists
        const duesQuery = `SELECT Fee_due FROM yearly_fees WHERE Regno = ? AND Fee_year = ? AND Fee_type = ?`;
        const [duesRows] = await connection.query(duesQuery, [decoded.Regno, year, feeType]);

        if (duesRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No dues record found for Regno: ${decoded.Regno}, FeeType: ${feeType}, Academic Year: ${year}`
            });
        }

        const currentDue = duesRows[0].Fee_due;

        // Step 2: If due is 0, fee already paid
        if (currentDue === 0) {
            return res.status(400).json({
                success: false,
                message: `Fee already paid for Regno: ${decoded.Regno}, FeeType: ${feeType}, Academic Year: ${year}`
            });
        }

        // Step 3: Prevent overpayment
        if (Fee > currentDue) {
            return res.status(400).json({
                success: false,
                message: `Entered amount ₹${Fee} exceeds the current due of ₹${currentDue}`
            });
        }

        // Step 4: Check if a payment record already exists
        const checkQuery = `SELECT COUNT(*) AS count FROM collegefee WHERE Regno = ? AND Feetype = ? AND FeeYear = ?`;
        const [checkResult] = await connection.query(checkQuery, [decoded.Regno, feeType, year]);

        if (checkResult[0].count > 0) {
            throw new Error(`A payment record already exists for Regno: ${decoded.Regno}, FeeType: ${feeType}, Academic Year: ${year}`);
        }

        // Step 5: Insert new payment record
        const insertQuery = `
            INSERT INTO collegefee (Regno, Feetype, PaidFee, PaymentDate, TransactionId, PaymentMode, UpiId, FeeYear)
            VALUES (?, ?, ?, UNIX_TIMESTAMP(), ?, ?, ?, ?)
        `;
        await connection.query(insertQuery, [decoded.Regno, feeType, amount, transactionId, paymentMode, upiId, year]);

        // Step 6: Update dues
        const updateQuery = `UPDATE yearly_fees 
                             SET fee_due = fee_due - ? 
                             WHERE Regno = ? AND Fee_year = ? AND Fee_type = ?`;
        const [updateResult] = await connection.query(updateQuery, [amount, decoded.Regno, year, feeType]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `No matching student record found to update dues for Regno: ${decoded.Regno}, Academic Year: ${year}`
            });
        }

        await connection.commit();
        res.status(200).json({ success: true, message: "Online payment processed and dues updated successfully!" });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Online payment processing error:", error);

        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

router.post('/college-fee/other/', async (req, res) => {
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
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', error: error.message });
    }

    const { Regno, Othertype, Fee } = req.body;
     const amount = parseFloat(Fee);
    let connection;

    try {
        connection = await pool.getConnection();
     

        // Insert new payment record
        const insertQuery = `INSERT INTO collegefee (Regno, Feetype, PaidFee,  PaymentDate) 
                             VALUES (?, ?, ?,UNIX_TIMESTAMP())`;
        await connection.query(insertQuery, [Regno, Othertype, amount]);

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
module.exports = router;