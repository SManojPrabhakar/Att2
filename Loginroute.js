const express = require('express');
const router = express.Router();
const app = express();
const cookieParser = require('cookie-parser');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const s3 = require('./awsConfig.js');
const multer = require('multer')
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

app.use(cookieParser());
app.use(express.json());

const pool = require('./config.js');



const secretKey =process.env.SECRET_KEY

const Buck =process.env.Bucket

router.post('/collegelogin/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { Email: EmailOrRegno, password } = req.body;
  
    if (!EmailOrRegno || !password) {
      return res.status(400).json({ success: false, message: 'Email or Regno and password are required.' });
    }

    let user = null;
    let role = null;

    const [studentRows] = await connection.query(
      'SELECT * FROM students WHERE Email = ? OR Regno = ? LIMIT 1',
      [EmailOrRegno, EmailOrRegno]
    );
    if (studentRows.length > 0) {
      user = studentRows[0];
      role = 'Student';
    }

    if (!user) {
      const [lecturerRows] = await connection.query(
        'SELECT * FROM lecturer WHERE Email = ? OR Regno = ? LIMIT 1',
        [EmailOrRegno, EmailOrRegno]
      );
      if (lecturerRows.length > 0) {
        user = lecturerRows[0];
        role = 'Lecturer';
      }
    }

    if (!user) {
      const [founderRows] = await connection.query(
        'SELECT * FROM fond WHERE Email = ? LIMIT 1',
        [EmailOrRegno]
      );
      if (founderRows.length > 0) {
        user = founderRows[0];
        role = 'Founder';
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Adjust field casing if needed
    const hashedPassword = user.password;

    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const payload = {
      email: user.Email,
      Id:user.Id,
      regno: user.Regno || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || secretKey, { expiresIn: '25m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET || secretKey, { expiresIn: '30d' });

     res.cookie('att2day', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
});



/*
router.post('/app/collegelogin/', async (req, res) => {
  try {
      const { Email, password } = req.body;
      const query = 'SELECT * FROM students WHERE Email = ?';

      const connection = await pool.getConnection();
      const [rows] = await connection.query(query, [Email]);
      connection.release();
      
      if (rows.length === 0) {
        console.log("Logins")
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, rows[0].password);

    if (!isPasswordValid) {
      console.log("Logins Password")
       return  res.status(401).json({success: false,  message: 'Invalid username or password' });
    }

    const token = jwt.sign({ email: Email }, secretKey, { expiresIn: '5h' });
    const refreshToken = jwt.sign({ email: Email }, secretKey, { expiresIn: '30d' });

      res.status(200).json({ success: true, message: 'Login successful',token:token });
  } catch (error) {
    
      res.status(500).json({ success: false, message: 'Authentication error' });
  }
});*/

router.post('/app/collegelogin/', async (req, res) => {
  try {
    const { Email, password } = req.body;

    const studentQuery = 'SELECT *, "Student" as Role FROM students WHERE Email = ? OR Regno = ? LIMIT 1';
    const lecturerQuery = 'SELECT *, "Lecturer" as Role FROM lecturer WHERE Email = ? OR Regno = ? LIMIT 1';
    const fondQuery = 'SELECT *, "Founder" as Role FROM fond WHERE Email = ?';

    const connection = await pool.getConnection();

    try {
      let [rows] = await connection.query(studentQuery, [Email, Email]);

      if (rows.length === 0) {
        [rows] = await connection.query(lecturerQuery, [Email, Email]);
      }

      if (rows.length === 0) {
        [rows] = await connection.query(fondQuery, [Email]);
      }

      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      const user = rows[0];

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }

      const payload = {
        Regno: user.Regno ?? null,
        Id: user.Id,
        email: Email,
        Role: user.Role
      };

      const token = jwt.sign(payload, secretKey, { expiresIn: '25m' });
      const refreshToken = jwt.sign(payload, secretKey, { expiresIn: '30d' });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        refreshToken,
        role: user.Role
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
});




router.get('/logout/', async(req,res)=>{
  
  try {

    res.cookie('att2day', '', { expires: new Date(0), httpOnly: true });
  res.json({"message":"logged out"});
  

  } catch (error) {
   
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
})

router.get('/loginstatus/', async (req, res) => {
  try {
    const token = req.cookies.att2day;

    if (token) {
    
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.get('/app/loginstatus/', async (req, res) => {

     try {
       const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, secretKey);
      return res.json({ success: true, message: 'token valid' });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
       
        return res.json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
      } else {
        return res.json({ success: false, message: 'invalidtoken' });
      }
    }
  }
)

router.delete('/deleteFcmToken/', async (req, res) => {
 const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  const { fcm_token } = req.query;
 
  if (!token) {
    return res.status(400).json({ error: 'Missing required token' });
  }

  if (!fcm_token) {
    return res.status(400).json({ error: 'Missing required FCM token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token has expired or is invalid' });
    }
    return res.status(401).json({ error: 'Invalid token', errorMessage: error.message });
  }

  const { Regno } = decoded;

  try {
    // Delete the specific FCM token for the user
    const deleteQuery = 'DELETE FROM user_fcm_tokens WHERE regno = ? AND fcm_token = ?';
    const [result] = await pool.query(deleteQuery, [Regno, fcm_token]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'FCM token not found for the user' });
    }

    res.status(200).json({ success: true, message: 'FCM token deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database connection error', errorMessage: error.message });
  }
});

  /*
router.get('/app/loginstatus/', async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.json({ success: false, message: 'No token provided' });
    }

    connection = await pool.getConnection();
    const decoded = jwt.verify(token, secretKey);
    const email = decoded.email; // Assuming the email is stored in the token payload

    // Query to check if the user exists in the students table
    const [studentCheck] = await connection.query('SELECT Role FROM students WHERE email = ?', [email]);

    // Query to check if the user exists in the lecturers table
    const [lecturerCheck] = await connection.query('SELECT Role FROM lecturer WHERE email = ?', [email]);

    // Combine the results from both queries
    const user = studentCheck.length > 0 ? studentCheck[0] : lecturerCheck.length > 0 ? lecturerCheck[0] : null;

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, message: user.Role });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.log("expired");
      return res.json({ success: false, message: 'Token expired' });
    } else {
      return res.json({ success: false, message: 'Invalid token' });
    }
  } finally {
    if (connection) connection.release(); // Ensure the connection is released
  }
});*/


router.get('/app/collegelogindata/', async (req, res) => {
  try {
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secretKey);
    const identifier = decoded.email || decoded.Regno;  // support either email or Regno
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Token does not contain valid email or Regno' });
    }

    const studentQuery = `
      SELECT Regno, Fullname, Email, College_name, Role, Profile,id,
             Number, Address, Gaurdian, Course, Section, Sem, Year, class_id, Regulation
      FROM students WHERE Email = ? OR Regno = ?
    `;

    const lecturerQuery = `
      SELECT Regno, Fullname, Email, College_name, Role,id,
       Profile, Number, Address, Desigination, Department, College_Code
      FROM lecturer WHERE Email = ? OR Regno = ?
    `;

    const fondQuery = `
      SELECT id, Fullname, Email, Role, Profile,Number,Address FROM fond WHERE Email = ?
    `;

    const connection = await pool.getConnection();
    try {
      let [results] = await connection.query(studentQuery, [identifier, identifier]);

      if (results.length === 0) {
        [results] = await connection.query(lecturerQuery, [identifier, identifier]);
      }

      if (results.length === 0 && decoded.email) {
        [results] = await connection.query(fondQuery, [decoded.email]);
      }

      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid email or regno' });
      }

      const { Profile, ...user } = results[0];

      let profilepic = '';
      if (Profile) {
        try {
          const profileParams = {
            Bucket: Buck,
            Key: Profile,
          };
          profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
        } catch (err) {
          console.error(`Error retrieving image for ${Profile}:`, err);
        }
      }
 
      const userData = { ...user, profilepic };
       
      return res.status(200).json({ success: true, message: userData });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});




router.get('/collegelogindata/', async (req, res) => {
  try {
    const token = req.cookies.att2day; // Access token from cookies
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token expired' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
      } else {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token verification failed' });
      }
    }

    const { email, regno } = decoded;

    const connection = await pool.getConnection();
    let results;
    let role = '';
    let user;

    try {
      // 1. Try student by Email or Regno
      if (email) {
        [results] = await connection.query('SELECT * FROM students WHERE Email = ?', [email]);
      }
      if ((!results || results.length === 0) && regno) {
        [results] = await connection.query('SELECT * FROM students WHERE Regno = ?', [regno]);
      }

      if (results && results.length > 0) {
        role = 'student';
        user = results[0];
      }

      // 2. Try lecturer by Email
      if (!user && email) {
        [results] = await connection.query('SELECT * FROM lecturer WHERE Email = ?', [email]);
        if (results.length > 0) {
          role = 'lecturer';
          user = results[0];
        }
      }

      // 3. Try founder by Email
      if (!user && email) {
        [results] = await connection.query('SELECT * FROM fond WHERE Email = ?', [email]);
        if (results.length > 0) {
          role = 'founder';
          user = results[0];
        }
      }

      if (!user) {
        return res.status(404).json({ success: false, message: 'Invalid password or email' });
      }

      // Profile image handling
      const { Profile, ...rest } = user;

      let profilepic = '';
      if (Profile) {
        const profileParams = {
          Bucket: Buck,
          Key: Profile,
        };
        try {
          profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
        } catch (err) {
          console.error(`Error retrieving profile image:`, err);
        }
      }

      const userData = { ...rest, profilepic, role };
      return res.status(200).json({ success: true, message: userData });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


  module.exports = router;