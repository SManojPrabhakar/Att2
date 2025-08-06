const express = require('express');
const router = express.Router();
const multer = require('multer')
const jwt = require('jsonwebtoken');
const pool = require('./config.js');
const s3 = require('./awsConfig');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

const Buck =process.env.Bucket


  
 



router.post('/UploadImg/', upload.any(), async (req, res) => {
  try {
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
 const { Regno, Id } = decoded;
    const identifier = Regno !== null ? Regno : Id;
    const { caption } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploadedFiles = [];

    await Promise.all(files.map(async (file) => {
      try {
        const uniqueFileName = `posts/${Date.now()}_${file.originalname}`;
        const params = {
          Bucket: Buck,
          Key:uniqueFileName,
          Body: file.buffer,
        };

        await s3.putObject(params).promise();
        uploadedFiles.push(uniqueFileName);
      } catch (err) {
        console.error(`Error uploading file ${file.originalname}:`, err);
      }
    }));

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ success: false, message: 'File upload failed' });
    }

    const connection = await pool.getConnection();

    try {
      const query = `INSERT INTO posts (Image, regno, Description, timestamp) VALUES (?, ?, ?, UNIX_TIMESTAMP())`;
      await Promise.all(
        uploadedFiles.map(async (filename) => {
          await connection.execute(query, [filename, identifier, caption || '']);
        })
      );
      res.status(200).json({ success: true, message: 'Files uploaded and post created successfully', uploadedFiles });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error during file upload or database update:', error);
    res.status(500).json({ success: false, message: 'Internal server error', errorMessage: error.message });
  }
});



router.delete('/delete/post/', async (req, res) => {
  try {
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
    const { postId } = req.query;
    
    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or expired token',
        errorMessage: error.message
      });
    }

    const { Regno, Id } = decoded;
    const identifier = Regno !== null ? Regno : Id;

    if (!postId) {
      return res.status(400).json({ success: false, message: 'postId is required' });
    }

    const connection = await pool.getConnection();
    try {
      // Step 1: Check if post exists and belongs to the user
      const [rows] = await connection.execute(
        'SELECT Image FROM posts WHERE id = ? AND regno = ?',
        [postId, identifier]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Post not found or not authorized' });
      }

      const filename = rows[0].Image;

      // Step 2: Delete from S3 if file exists
      const deleteParams = {
        Bucket: Buck,
        Key: filename,
      };

      try {
        await s3.headObject(deleteParams).promise(); // Confirm existence
        await s3.deleteObject(deleteParams).promise();
      } catch (err) {
        if (err.code === 'NotFound') {
          console.warn(`S3 file not found: ${filename}`);
        } else {
          console.error('S3 deletion error:', err);
          return res.status(500).json({ success: false, message: 'S3 deletion failed', errorMessage: err.message });
        }
      }

      // Step 3: Delete post from database
      const [result] = await connection.execute(
        'DELETE FROM posts WHERE id = ? AND regno = ?',
        [postId, identifier]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Post not found in database' });
      }

      res.json({ success: true, message: 'Post and associated image deleted successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error during post deletion:', error);
    res.status(500).json({ success: false, message: 'Internal server error', errorMessage: error.message });
  }
});



router.get('/comments/', async (req, res) => {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

  const postId = parseInt(req.query.postId);

  

  if (isNaN(postId)) {
    return res.status(400).json({ success: false, message: 'Invalid post ID' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    const message = error.name === 'TokenExpiredError'
      ? 'Unauthorized: Token has expired'
      : 'Unauthorized: Invalid token';
    return res.status(401).json({ success: false, message, error: error.message });
  }

  // Extract Regno or Id from token just in case needed in future filtering
  const { Regno, Id } = decoded;


  let connection;

  try {
    connection = await pool.getConnection();

    const query = `
      SELECT 
        comments_posts.Cmt_id AS commentId,
        COALESCE(comment_students.Regno, comment_lecturer.Regno, fond.Id) AS regno,
        COALESCE(comment_students.Fullname, comment_lecturer.Fullname, fond.Fullname) AS username,
        comments_posts.comments_text AS comment,
        COALESCE(comment_students.Profile, comment_lecturer.Profile, fond.Profile) AS profile
      FROM comments_posts
      LEFT JOIN students AS comment_students ON comments_posts.regno = comment_students.Regno
      LEFT JOIN lecturer AS comment_lecturer ON comments_posts.regno = comment_lecturer.Regno
      LEFT JOIN fond ON comments_posts.regno = fond.Id
      WHERE comments_posts.post_id = ?
    `;

    const [rows] = await connection.query(query, [postId]);

    // Get signed URLs for profile images if available
    const commentsWithProfileUrls = await Promise.all(
      rows.map(async (comment) => {
        if (comment.profile) {
          const profileParams = {
            Bucket: Buck,
            Key: comment.profile,
          };
          try {
            comment.profile = await s3.getSignedUrlPromise('getObject', profileParams);
          } catch (error) {
            console.error(`S3 Error for ${comment.username}:`, error);
            comment.profile = null;
          }
        }
        return comment;
      })
    );
  

    res.status(200).json(commentsWithProfileUrls );

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve comments', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});



router.delete('/delete/comment/', async (req, res) => {
  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  const { commentId } = req.query; // Get commentId from the request body
 try {
    const query = `
      DELETE FROM comments_posts
      WHERE Cmt_id = ?;
    `;

    // Execute the query with the specified commentId
    const [result] = await pool.execute(query, [commentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found or already deleted' });
    }

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

router.post('/add/like/', async (req, res) => {
  const { postId, Regno} = req.body; // Get postId, Regno, and Comment_text from the request body

  if (!postId || !Regno || !Comment_text) {
      return res.status(400).json({ error: 'Missing required fields: postId, Regno, or Comment_text' });
  }


  try {
      const query = `
          INSERT INTO likes ( Regno, postId, timestamp)
          VALUES (?, ?, UNIX_TIMESTAMP());
      `;

      // Execute the query with parameters
      const [rows] = await pool.execute(query, [ Regno,postId]);
      res.status(200).json({ success: true, message: 'Comment added successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to add comment' });
  }
});


router.get('/likes/', async (req, res) => {
  const { postId} = req.body; 

  if (!postId || !Regno || !Comment_text) {
      return res.status(400).json({ error: 'Missing required fields: postId, Regno, or Comment_text' });
  }


  try {
      const query = `
          INSERT INTO likes ( Regno, postId, timestamp)
          VALUES (?, ?, UNIX_TIMESTAMP());
      `;

      // Execute the query with parameters
      const [rows] = await pool.execute(query, [ Regno,postId]);
      res.status(200).json({ success: true, message: 'Comment added successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to add comment' });
  }
});



















router.get('/search/timeline/Id/', async (req, res) => {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
    } else {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
  }

  const { Regno } = decoded;
  const regno = req.query.regno;
  
  const pagenum = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.per_page) || 10;
  const offset = (pagenum - 1) * limit;

  let connection;
  try {
    // Get a database connection
    connection = await pool.getConnection();

    // Query to get the total count of posts
    const totalQuery = 'SELECT COUNT(*) AS total FROM posts WHERE regno = ?';
    const [totalResult] = await connection.query(totalQuery, [Regno]);
    const total = totalResult[0].total || 0;
    const totalPages = Math.ceil(total / limit);

    // Query to get the paginated records
    const [results] = await connection.query(
      `
     SELECT posts.*, 
       COALESCE(students.fullname, lecturer.fullname, fond.fullname) AS fullname,
       COALESCE(students.college_name, lecturer.college_name) AS collegename,
       COALESCE(students.Profile, lecturer.Profile, fond.Profile) AS profilepic,
       COALESCE(students.Active, lecturer.Active) AS active,
       COUNT(likes.id) AS likes
FROM posts
LEFT JOIN students 
    ON posts.Regno = students.Regno AND (students.Active IS NULL OR students.Active = 'true')
LEFT JOIN lecturer 
    ON posts.Regno = lecturer.Regno AND (lecturer.Active IS NULL OR lecturer.Active = 'true')
LEFT JOIN fond 
    ON posts.Regno = fond.id
LEFT JOIN likes 
    ON posts.id = likes.post_id
WHERE posts.Regno = ?
GROUP BY posts.id, fullname, collegename, profilepic, active
ORDER BY posts.id DESC
LIMIT ? OFFSET ?

      `,
      [regno, limit, offset]
    );

     if (results.length === 0) {
          return res.status(200).json({
              paging: { total: 0, totalPages: 0, currentPage: pagenum, limit },
              data: [],
          });
      }
    // Fetch image URLs and combine them with post data
    const postsData = await Promise.all(
      results.map(async (post) => {
        const { Image, profilepic, ...postData } = post;

        // Set up S3 params for the post image and profile image
        const postImageParams = { Bucket: Buck, Key: Image };
        const profileImageParams = { Bucket: Buck, Key: profilepic };

        let postUrl = '';
        let profileUrl = '';

        try {
          // Get the signed URL for the post image
          if (Image) {
            postUrl = await s3.getSignedUrlPromise('getObject', postImageParams);
          }

          // Get the signed URL for the profile image
          if (profilepic) {
            profileUrl = await s3.getSignedUrlPromise('getObject', profileImageParams);
          }
        } catch (err) {
          console.error('Error generating S3 signed URLs:', err);
        }

        // Return the post data with the URLs
        return { ...postData, profilepic: profileUrl, posts: postUrl };
      })
    );

    // Send the response with pagination metadata and posts data
    return res.json({
      paging: {
        total,
        totalPages,
        currentPage: pagenum,
        limit,
      },
      data: postsData,
    });
  } catch (error) {
    console.error('Error in /search/timeline/Id/ route:', error);
    return res.status(500).json({ result: [], error: 'Internal Server Error' });
  } finally {
    // Ensure the database connection is released
    if (connection) connection.release();
  }
});


router.get('/timeline/Id/', async (req, res) => {
    const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid Token' });
    }

    const { Regno, Id } = decoded;
    const identifier = Regno !== null ? Regno : Id;
  
    if (identifier === null || identifier === undefined) {
        return res.status(400).json({ success: false, message: 'Invalid Token Data' });
    }

    const pagenum = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.per_page) || 10;
    const offset = (pagenum - 1) * limit;

    let connection;
    try {
        connection = await pool.getConnection();

        // Count total posts by this Regno or Id
        const totalQuery = 'SELECT COUNT(*) AS total FROM posts WHERE Regno = ?';
        const [totalResult] = await connection.query(totalQuery, [identifier]);
        const total = totalResult[0].total || 0;
        const totalPages = Math.ceil(total / limit);

        const [results] = await connection.query(
            `SELECT posts.*, 
       COALESCE(students.fullname, lecturer.fullname, fond.fullname) AS fullname,
       COALESCE(students.college_name, lecturer.college_name) AS collegename,
       COALESCE(students.Profile, lecturer.Profile, fond.Profile) AS profilepic,
       COALESCE(students.Active, lecturer.Active) AS active,
       COUNT(likes.id) AS likes
FROM posts
LEFT JOIN students 
    ON posts.Regno = students.Regno AND (students.Active IS NULL OR students.Active = 'true')
LEFT JOIN lecturer 
    ON posts.Regno = lecturer.Regno AND (lecturer.Active IS NULL OR lecturer.Active = 'true')
LEFT JOIN fond 
    ON posts.Regno = fond.id
LEFT JOIN likes 
    ON posts.id = likes.post_id
WHERE posts.Regno = ?
GROUP BY posts.id, fullname, collegename, profilepic, active
ORDER BY posts.id DESC
LIMIT ? OFFSET ?
`,
            [identifier, limit, offset]
        );

        if (results.length === 0) {
          return res.status(200).json({
              paging: { total: 0, totalPages: 0, currentPage: pagenum, limit },
              data: [],
          });
      }

        const postsData = await Promise.all(results.map(async (post) => {
            const { Image, profilepic, ...postData } = post;

            const postUrl = Image
                ? await s3.getSignedUrlPromise('getObject', { Bucket: Buck, Key: Image })
                : '';
            const profileUrl = profilepic
                ? await s3.getSignedUrlPromise('getObject', { Bucket: Buck, Key: profilepic })
                : '';

            return {
                ...postData,
                posts: postUrl,
                profilepic: profileUrl
            };
        }));

        return res.json({
            paging: { total, totalPages, currentPage: pagenum, limit },
            data: postsData
        });

    } catch (error) {
        console.error('Error in /timeline/Id/ route:', error);
        return res.status(500).json({ result: [], error: 'Internal Server Error' });
    } finally {
        if (connection) connection.release();
    }
});


router.get('/api/poster/', async (req, res) => {

  const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

let decoded;
try {
    decoded = jwt.verify(token, secretKey);
    const isExpired = Date.now() >= decoded.exp * 1000;
    if (isExpired) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired' });
    }
} catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
}

  const pagenum = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.per_page) || 10;
  const offset = (pagenum - 1) * limit;

  let connection;
  try {
      connection = await pool.getConnection();

      // Get the total count of posts
      const totalQuery = 'SELECT COUNT(*) AS total FROM posts';
      const [totalResult] = await connection.query(totalQuery);
      const total = totalResult[0].total || 0;
      const totalPages = Math.ceil(total / limit);

      // Fetch paginated posts
      const [results] = await connection.query(`
        SELECT posts.*, 
       COALESCE(students.fullname, lecturer.fullname, fond.fullname) AS fullname,
       COALESCE(students.college_name, lecturer.college_name) AS collegename,
       COALESCE(students.Profile, lecturer.Profile, fond.Profile) AS profilepic,
       COALESCE(students.Active, lecturer.Active) AS active,
       COUNT(likes.id) AS likes
FROM posts
LEFT JOIN students 
    ON posts.Regno = students.Regno AND (students.Active IS NULL OR students.Active = 'true')
LEFT JOIN lecturer 
    ON posts.Regno = lecturer.Regno AND (lecturer.Active IS NULL OR lecturer.Active = 'true')
LEFT JOIN fond 
    ON posts.Regno = fond.id
LEFT JOIN likes 
    ON posts.id = likes.post_id
GROUP BY posts.id, fullname, collegename, profilepic, active
ORDER BY RAND()
LIMIT ? OFFSET ?;

      `, [limit, offset]);

      if (results.length === 0) {
          return res.status(200).json({
              paging: { total: 0, totalPages: 0, currentPage: pagenum, limit },
              data: [],
          });
      }

      // Generate signed URLs for images
      const postsData = await Promise.all(results.map(async (post) => {
          const { Image, profilepic, ...postData } = post;

          let postUrl 
          let profileUrl

          try {
              if (Image) {
                  postUrl = await s3.getSignedUrlPromise('getObject', { Bucket: Buck, Key: Image });
              }
              if (profilepic) {
                  profileUrl = await s3.getSignedUrlPromise('getObject', { Bucket: Buck, Key: profilepic });
              }
          } catch (err) {
              console.error('Error generating S3 signed URLs:', err);
          }

          return { ...postData, profilepic: profileUrl, posts: postUrl };
      }));

      // Return the final response
      return res.json({
          paging: {
              total,
              totalPages,
              currentPage: pagenum,
              limit,
          },
          data: postsData,
      });

  } catch (error) {
      console.error('Error in /poster/ route:', error);
      return res.status(500).json({ result: [], error: 'Internal Server Error' });
  } finally {
      if (connection) {
          try {
              connection.release();
          } catch (releaseError) {
              console.error('Error releasing connection:', releaseError);
          }
      }
  }
});

   


module.exports = router;