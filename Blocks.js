const express = require('express');
const router = express.Router();
const app = express();
const cookieParser = require('cookie-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



app.use(cookieParser());
app.use(express.json());


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'madman950',
  database: 'server',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


const secretKey = 'your_secret_key';

router.get('/getBlocks/', async (req, res) => {
    try {
      const token = req.headers.authorization;
      const decoded = jwt.verify(token, secretKey);
      const { email } = decoded;
      const query = 'SELECT Blocks FROM users WHERE Email = ?';
  
      const connection = await pool.getConnection();
      const [rows] = await connection.query(query, [email]);
      connection.release();
  
      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'No blocks found' });
      }
  
      // Assuming `Blocks` is a JSON string or an array in the database
      const blocks = rows[0].Blocks;
  
      res.status(200).json({ success: true, message: 'Blocks retrieved successfully', blocks });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Authentication error' });
    }
  });
  module.exports = router;  
