const express = require('express');
const router = express.Router();
require('dotenv').config();
const multer = require('multer');
const s3 = require('./awsConfig');
const jwt = require('jsonwebtoken');
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

const pool = require('./config.js');
const Buck=process.env.Bucket
const secretKey =process.env.SECRET_KEY

  router.get('/sin/collegenames/', async (req, res) => {
    try {
      
        const query = 'SELECT college_type as type, college_name FROM register';
        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.query(query);
            connection.release();

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'No colleges registered' });
            }

            // Map rows to response format
            const collegeData = rows.map(row => ({
                type: row.type,
                college_name: row.college_name,
            }));

            return res.status(200).json({ success: true, colleges: collegeData });
        } catch (queryError) {
            connection.release();
            console.error('Error executing query:', queryError);
            return res.status(500).json({ success: false, message: 'Failed to fetch college data' });
        }
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.get('/collegenames/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secretKey);

    const Id = decoded.Id; // Assuming the token has `id` field

    const connection = await pool.getConnection();

    try {
      // Step 1: Get lecturer's college_name
      const [lecturerRows] = await connection.query(
        'SELECT college_name FROM lecturer WHERE id = ?',
        [Id]
      );

      const lecturerCollegeName = lecturerRows.length > 0 ? lecturerRows[0].college_name : null;

      // Step 2: Get all colleges except lecturer's
      const [registerRows] = await connection.query(
        'SELECT College_Type, college_name FROM register WHERE college_name != ?',
        [lecturerCollegeName]
      );

      connection.release();

      if (registerRows.length === 0) {
        return res.status(404).json({ success: false, message: 'No colleges found' });
      }

      const collegeData = registerRows.map(row => ({
        type: row.College_Type,
        college_name: row.college_name,
      }));

      return res.status(200).json({ success: true, colleges: collegeData });
    } catch (queryError) {
      connection.release();
      console.error('Error executing query:', queryError);
      return res.status(500).json({ success: false, message: 'Failed to fetch college data' });
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


router.get('/single/student/:Id', async (req, res) => {
  
  const Id=req.params.Id
  
 
try {
   const query = 'SELECT * FROM students where college_code=? And Course=? And Section=? And Year=? And Sem=?';

   // Use the connection pool to get a connection
   const connection = await pool.getConnection();

   // Execute the query using the connection
   const [result] = await connection.query(query,[college_code,Course,section,year,sem]); // Destructuring the result to access rows directly

   // Release the connection back to the pool
   connection.release();

 res.status(200).json(result);// Sending rows
   
} catch (error) {
   console.error('Error executing query:', error);
   res.status(500).json({ success: false, message: 'Internal Server Error' });
}
});

router.get('/students/:college/:course/:section/:year/:sem/:id', async (req, res) => {
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

  const { college, course, section, year, sem,id } = req.params;

  // Validate route parameters
  if (!college || !course || !section || !year || !sem) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      SELECT Fullname, Year, Course, Section, Sem, Regno, Profile, Id 
      FROM students 
      WHERE college_name = ? 
      AND Course = ? 
      AND Section = ? 
      AND Year = ? 
      AND Sem = ? 
      And class_id=?
      AND (Active IS NULL OR Active = 'true')
    `;

    const [result] = await connection.query(query, [college, course, section, year, sem,id]);
    
    connection.release(); // Release connection immediately after query

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found.' });
    }

    const formattedResult = await Promise.all(result.map(async (student) => {
      const { Profile, ...rest } = student;

      let profilepic = null;
      if (Profile) {
        try {
          const profileParams = { Bucket:Buck, Key: Profile };
          profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
        } catch (err) {
          console.error(`Error retrieving image for ${Profile}:`, err);
        }
      }

      return { ...rest, profilepic };
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    if (connection) connection.release();
    
    console.error('Error executing query:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
  }
});

router.get('/students/:college/:course/:section/:year/:sem', async (req, res) => {
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

  const { college, course, section, year, sem } = req.params;

  // Validate route parameters
  if (!college || !course || !section || !year || !sem) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      SELECT Fullname, Year, Course, Section, Sem, Regno, Profile, Id 
      FROM students 
      WHERE college_name = ? 
      AND Course = ? 
      AND Section = ? 
      AND Year = ? 
      AND Sem = ? 
      AND (Active IS NULL OR Active = 'true')
    `;

    const [result] = await connection.query(query, [college, course, section, year, sem]);
    
    connection.release(); // Release connection immediately after query

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found.' });
    }

    const formattedResult = await Promise.all(result.map(async (student) => {
      const { Profile, ...rest } = student;

      let profilepic = null;
      if (Profile) {
        try {
          const profileParams = { Bucket: Buck, Key: Profile };
          profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
        } catch (err) {
          console.error(`Error retrieving image for ${Profile}:`, err);
        }
      }

      return { ...rest, profilepic };
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    if (connection) connection.release();
    
    console.error('Error executing query:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
  }
});


router.get('/students/classid/', async (req, res) => {
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
      errorMessage: error.message
    });
  }

  const { classid } = req.query;

  if (!classid) {
    return res.status(400).json({ success: false, message: 'Missing classid parameter' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Get class details
    const [classRows] = await connection.query(
      `SELECT Year, Course, Section, Sem FROM lect_classes WHERE Id = ?`,
      [classid]
    );

    if (classRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Class not found for given classid' });
    }

    const { Year, Course, Section, Sem} = classRows[0];

    // 2. Fetch students from that class
    const [students] = await connection.query(
      `SELECT Fullname, Year, Course, Section, Sem, Regno, Profile, Id 
FROM students 
WHERE Course = ? 
  AND Section = ? 
  AND Year = ? 
  AND Sem = ? 
  AND class_id IS NULL
  AND (Active IS NULL OR Active = 'true');
`,
      [Course, Section, Year, Sem]
    );

    connection.release();

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found for this class' });
    }

    // 3. Process and return students with signed S3 URLs
    const formattedResult = await Promise.all(students.map(async (student) => {
      const { Profile, ...rest } = student;
      let profilepic = null;

      if (Profile) {
        try {
          const profileParams = { Bucket:Buck, Key: Profile };
          profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
        } catch (err) {
          console.error(`Error getting image for ${Profile}:`, err);
        }
      }

      return { ...rest, profilepic };
    }));

    return res.status(200).json(formattedResult);
  } catch (error) {
    if (connection) connection.release();
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
  }
});

router.patch('/update-classid', async (req, res) => {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

  try {
    jwt.verify(token, secretKey);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token',
      errorMessage: error.message
    });
  }

  const { classid, students } = req.body;

  if (!classid || !Array.isArray(students)) {
    return res.status(400).json({
      success: false,
      message: 'classid and students array are required'
    });
  }
 let connection;
  
  
  try {
      connection = await pool.getConnection();
    const updatePromises = students.map(student => {
      return connection.query(
        'UPDATE students SET class_id = ? WHERE Regno = ?',
        [classid, student.regno]
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Class ID updated for selected students.'
    });

  } catch (err) {
    console.error('Error updating class IDs:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while updating class IDs',
      error: err.message
    });
  }
});

router.get('/studentsclass/:id', async (req, res) => {
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

  const {id } = req.params;

  // Validate route parameters
  if (!id) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      SELECT Fullname, Year, Course, Section, Sem, Regno, Profile, Id 
      FROM students 
      WHERE class_id = ? 
      AND (Active IS NULL OR Active = 'true')
    `;

    const [result] = await connection.query(query, [id]);
    
    connection.release(); // Release connection immediately after query

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found.' });
    }

    const formattedResult = await Promise.all(result.map(async (student) => {
      const { Profile, ...rest } = student;

      let profilepic = null;
      if (Profile) {
        try {
          const profileParams = { Bucket: Buck, Key: Profile };
          profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
        } catch (err) {
          console.error(`Error retrieving image for ${Profile}:`, err);
        }
      }

      return { ...rest, profilepic };
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    if (connection) connection.release();
    
    console.error('Error executing query:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
  }
});




router.get('/lecturer/:college/', async (req, res) => {
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

  const { college } = req.params;

  // Validate route parameters
  if (!college) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
     SELECT Fullname, Profile, Id
FROM lecturer
WHERE college_name = ?
 
  AND (Active IS NULL OR Active = 'true')
  AND (
        Role != 'Admin' 
        OR (Role = 'Admin' AND Desigination IS NOT NULL AND TRIM(Desigination) != '')
      )
    `;

    const [result] = await connection.query(query, [college]);
    
    connection.release(); // Release connection immediately after query

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found.' });
    }

    const formattedResult = await Promise.all(result.map(async (student) => {
      const { Profile, ...rest } = student;

      let profilepic = null;
      if (Profile) {
        try {
          const profileParams = { Bucket: Buck, Key: Profile };
          profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
        } catch (err) {
          console.error(`Error retrieving image for ${Profile}:`, err);
        }
      }

      return { ...rest, profilepic };
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    if (connection) connection.release();
    
    console.error('Error executing query:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
  }
});


router.get('/collages/', async (req, res) => {
    try {

      const query = 'SELECT College_Name,Imagekeys  FROM register ORDER BY id DESC LIMIT 4';
  
      // Use the connection pool to get a connection
      const connection = await pool.getConnection();
  
      // Execute the query using the connection
      const [results] = await connection.query(query);
  
      // Release the connection back to the pool
      connection.release();

      if (results.length === 0) {
        res.json({ message: 'Be the first one to register' });
      } else {
        // Extract the actual data from the results
        const collages = results.map(result => result.College_Name);
        const keys = results.map(keys => keys.Imagekeys);
  
        // Fetch image URLs from S3 using keys
        const imageUrls = await Promise.all(keys.map(async key => {
          const params = {
            Bucket: Buck,
            Key: key,
          };
         
          const url = await s3.getSignedUrlPromise('getObject', params);
          
          return url;
        }));
      
     
        // Combine collages and imageUrls and send the response
        const responseData = collages.map((collage, index) => ({
          collage_name: collage,
          imageUrl: imageUrls[index],
        }));
       
        res.json(responseData);
      }
      
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });


  router.post('/s3upload', upload.array('file'), (req, res) => {
      let decoded;
    try {
       const token = req.cookies.att2day;


  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }
try {
    decoded = jwt.verify(token, secretKey);
    } catch (err) {
      if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      return res.status(500).json({ message: 'Failed to verify token' });
    }
      const files = req.files;
      
  
      if (!files || files.length === 0) {
        return res.status(400).send('No files were uploaded.');
      }
  
      const uploadedImages = [];
  
      files.forEach((file, index) => {
        const imageBuffer = file.buffer;
        const uniqueKey = `file_${Date.now()}_${index}.jpg`; // Use index to ensure unique keys for each file
  
        // Upload image to S3 bucket
        const params = {
          Bucket: Buck,
          Key: `registration/${uniqueKey}`,
          Body: imageBuffer,
          ContentType: 'image/jpeg',
        };
  
        s3.upload(params, (err, data) => {
          if (err) {
            console.log(`Error uploading image ${index + 1}:`, err);
          } else {
            console.log(`Image ${index + 1} uploaded successfully. S3 URL:`, data.Location);
            uploadedImages.push(uniqueKey);
          }
  
          if (uploadedImages.length === files.length) {
            // All files have been processed
            res.status(200).json(uploadedImages);
          }
        });
      });
    } catch (error) {
      console.log('Error handling file upload:', error.message);
      res.status(500).send('Internal Server Error');
    }
  });
  
  router.delete('/s3delete/:key', (req, res) => {
      const token = req.cookies.att2day;

    
      if (!token) {
        return res.status(401).json({ message: 'Token missing' });
      }
    
      let decoded;
      try {
        decoded = jwt.verify(token, secretKey);
      } catch (err) {
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
          return res.status(401).json({ message: 'Invalid or expired token' });
        }
        return res.status(500).json({ message: 'Failed to verify token' });
      }
      
    const key = req.params.key;
  
    const params = {
      Bucket: Buck,
      Key: key,
    };
  
    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.log('Error deleting image:', err);
        res.status(500).json({ message: 'error in deleting' });
      } else {
       
        res.status(200).json({ message: 'Image deleted successfully.' });
      }
    });
  });

  
  router.put('/profilepic', upload.single('image'), async (req, res) => {
  let connection;
  try {
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      return res.status(401).json({ success: false, message: `Unauthorized: ${msg}` });
    }

    const { Regno, Id } = decoded;
    const identifier = Regno !== null ? Regno : Id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload file to S3
    const filename = `profilepics/${file.originalname}`;

    const params = {
      Bucket:Buck,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      await s3.putObject(params).promise();
    } catch (s3Error) {
      console.error('S3 Upload Error:', s3Error);
      return res.status(500).json({ error: 'Failed to upload file to S3' });
    }

    connection = await pool.getConnection();

    try {

     const [studentRows] = await connection.execute('SELECT Regno FROM students WHERE Regno = ?', [identifier]);
if (studentRows.length > 0) {
  await connection.execute('UPDATE students SET Profile = ? WHERE Regno = ?', [filename, identifier]);
} else {
  const [lecturerRows] = await connection.execute('SELECT Regno FROM lecturer WHERE Regno = ?', [identifier]);
  if (lecturerRows.length > 0) {
    await connection.execute('UPDATE lecturer SET Profile = ? WHERE Regno = ?', [filename, identifier]);
  } else {
    const [fondRows] = await connection.execute('SELECT Id FROM fond WHERE Id = ?', [identifier]);
    if (fondRows.length > 0) {
      await connection.execute('UPDATE fond SET Profile = ? WHERE Id = ?', [filename, identifier]);
    } else {
      return res.status(404).json({ error: 'User not found in students, lecturers, or founders' });
    }
  }
}

    } catch (sqlError) {
      console.error('Database Query Error:', sqlError);
      return res.status(500).json({ error: 'Failed to execute database query' });
    }

    res.json({ success:true ,message: 'Profile picture updated successfully' });

  } catch (error) {
    console.error('Unexpected Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

  module.exports = router;