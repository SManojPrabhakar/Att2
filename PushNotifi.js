const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const cron = require('node-cron');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const serviceAccount = require('./att2-5950c-firebase-adminsdk-ifr80-c7176bc8d5.json'); // Path to Firebase service account JSON file
const multer = require('multer');
const s3 = require('./awsConfig.js');
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });
// Initialize Firebase Admin SDK

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

require('dotenv').config();
const secretKey =process.env.SECRET_KEY
const app = express();
app.use(express.json()); // To parse JSON bodies

const pool = require('./config.js');

// API to store or update user's last open time and FCM token
router.post('/api/updateUserActivity/', async (req, res) => {
 const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  const { fcm_token } = req.body;
   
 
  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token has expired or is invalid' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token', errorMessage: error.message });
  }

   const identifier = decoded.Regno !== null ? decoded.Regno : decoded.Id;
   
  if (!identifier) {
  
    return res.status(400).json({ error: 'Invalid token payload: missing Regno or id' });
  }

  if (!fcm_token) {
    
    return res.status(400).json({ error: 'Missing required field: fcm_token' });
  }

  const query = `
    INSERT INTO user_fcm_tokens (Regno, fcm_token, timestamp) 
    VALUES (?, ?, UNIX_TIMESTAMP()) 
    ON DUPLICATE KEY UPDATE timestamp = UNIX_TIMESTAMP();
  `;

  try {
    const [result] = await pool.query(query, [identifier, fcm_token]);

    res.status(200).json({ success: true, message: 'User activity updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database connection error', errorMessage: error.message });
  }
});



router.get("/get/notifications/", async (req, res) => {
 const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  try {
    // Verify JWT Token
    const decoded = jwt.verify(token, secretKey);
    const { Regno } = decoded;

    // Fetch Notifications from DB
    const query = `SELECT regno, title, body, image, Timestamp FROM notifications WHERE regno = ? ORDER BY Timestamp DESC;`;
    const [result] = await pool.query(query, [Regno]);

    if (result.length === 0) {
      return res.status(200).json({ success: true, notify: [], message: "No notifications available" });
    }

    // Generate S3 Signed URLs for Images
    const notifications = await Promise.all(
      result.map(async (notification) => {
        if (notification.image) {
          try {
            const params = {
              Bucket: process.env.Bucket,
              Key: notification.image,
            };
            notification.imageUrl = await s3.getSignedUrlPromise("getObject", params);
          } catch (s3Error) {
            console.error("S3 Error:", s3Error);
            notification.imageUrl = null; // If S3 fails, return null instead of breaking
          }
        }
        return notification;
      })
    );

    res.status(200).json({ success: true, notify: notifications });

  } catch (err) {
    console.error("Error fetching notifications:", err);

    // Handle Specific JWT Errors
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    // Handle Database Errors
    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "Database error: Table does not exist" });
    } else if (err.code === "ER_ACCESS_DENIED_ERROR") {
      return res.status(500).json({ success: false, message: "Database error: Access denied" });
    }

    // Handle AWS S3 Errors
    if (err.code === "NetworkingError") {
      return res.status(500).json({ success: false, message: "AWS S3 connection error" });
    }

    // Generic Server Error
    res.status(500).json({ success: false, message: "Failed to fetch notifications", error: err.message });
  }
});


// Function to send push notifications
/*
const sendPushNotification = async (token) => {
  const message = {
    notification: {
      title: 'We miss you!',
      body: 'It looks like you haven’t opened the app in a while. Come back and check what’s new!',
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Cron job to check for inactive users every day at 08:00
cron.schedule('00 08 * * *', async () => {
  // Find users who haven’t opened the app in the past 7 minutes
  const sevenMinsAgo = Date.now() - (7 * 60 * 1000); // 7 minutes ago

  console.log('Seven minutes ago (formatted):', sevenMinsAgo);

  const query = 'SELECT regno, fcm_token FROM students WHERE last_open_time < ?';

  try {
    const [result] = await pool.query(query, [sevenMinsAgo]); // Await MySQL query

    if (result.length === 0) {
      console.log('No inactive users found.');
      return;
    }

    for (const user of result) {
      console.log('User:', user);
      await sendPushNotification(user.fcm_token); // Await the notification sending
    }
  } catch (err) {
    console.error('Error fetching inactive users or sending notifications:', err);
  }
});
*/
async function sendFavoriteNotification(token, name,notificationBody) {

  const message = {
    notification: {
      title: name,
      body: notificationBody,
       
    },
   
    token: token,
  };
  

  try {
    const response = await admin.messaging().send(message);
   
    return { success: true, response };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error };
  }
}

/*
// Endpoint to send favorite notification
router.post('/sendFavoriteNotification/', async (req, res) => {
  const token = req.headers.authorization;
  const { post_id } = req.body;
  

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
    await connection.beginTransaction();

    // Insert the like into the likes table
    try {
      const likeQuery = 'INSERT INTO likes (Regno, post_id, liked_at) VALUES (?, ?, UNIX_TIMESTAMP());';
      await connection.query(likeQuery, [Regno, post_id]);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Already liked this post' });
      }
      throw error;
    }

    // Fetch user details and FCM token
    const [rows] = await connection.query(`
      SELECT students.Fullname, students.Profile, user_fcm_tokens.fcm_token 
      FROM students
      JOIN user_fcm_tokens ON students.regno = user_fcm_tokens.regno
      WHERE students.regno = ?;
    `, [Regno]);

    if (rows.length === 0 || !rows[0].fcm_token) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'User or FCM token not found' });
    }

    const user = rows[0];
    const notificationBody = `liked your post`;

    // Send the notification
    const result = await sendFavoriteNotification(user.fcm_token, user.Fullname, notificationBody);

    if (!result.success) {
      await connection.rollback();
      return res.status(500).json({ success: false, message: 'Failed to send notification' });
    }

    // Store the notification details
    try {
      const insertNotificationQuery = `
        INSERT INTO notifications (regno, title, body, image, Timestamp)
        VALUES (?, ?, ?, ?, UNIX_TIMESTAMP());
      `;
      await connection.query(insertNotificationQuery, [Regno, user.Fullname, notificationBody, user.Profile]);
    } catch (error) {
      await connection.rollback();
      return res.status(500).json({ success: false, message: 'Failed to save notification', error: error.message });
    }

    await connection.commit();
    return res.status(200).json({ success: true, message: result.response });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});*/

router.post('/sendFavoriteNotification/', async (req, res) => {
   const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  const { post_id } = req.body;



  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    const msg = error.name === 'TokenExpiredError'
      ? 'Token expired or invalid'
      : 'Invalid token';
    return res.status(401).json({ success: false, message: msg });
  }

  const { Regno, Id } = decoded;
  const identifier = Regno ?? Id;

  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Token payload missing Regno or Id' });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Step 1: Insert like or unlike if duplicate
    try {
      const likeQuery = `INSERT INTO likes (Regno, post_id, liked_at) VALUES (?, ?, UNIX_TIMESTAMP())`;
      await connection.query(likeQuery, [identifier, post_id]);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const deleteQuery = `DELETE FROM likes WHERE Regno = ? AND post_id = ?`;
        await connection.query(deleteQuery, [String(identifier), post_id]);
        await connection.commit();
        return res.status(200).json({ success: true, message: 'Unliked this post' });
      } else {
        throw error;
      }
    }

    // Step 2: Get post owner
    const [postRows] = await connection.query(`SELECT Regno FROM posts WHERE id = ? LIMIT 1`, [post_id]);
    if (postRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const postOwnerRegno = postRows[0].Regno;

    // Step 3: Prevent self-like notification
    if (postOwnerRegno === identifier) {
      await connection.commit();
      return res.status(200).json({ success: true, message: 'Like recorded. No notification sent (self-like).' });
    }

    // Step 4: Get liker info (name and profile)
    const [likerRows] = await connection.query(`
      SELECT 
        COALESCE(s.Fullname, l.Fullname, f.Fullname) AS Fullname,
        COALESCE(s.Profile, l.Profile, f.Profile) AS Profile
      FROM user_fcm_tokens u
      LEFT JOIN students s ON u.regno = s.Regno
      LEFT JOIN lecturer l ON u.regno = l.Regno
      LEFT JOIN fond f ON u.regno = f.Id
      WHERE u.regno = ?
      LIMIT 1
    `, [identifier]);

    if (likerRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Liker details not found' });
    }

    const liker = likerRows[0];
    const notificationBody = 'liked your post';
    const notificationTitle = liker.Fullname;

    // Step 5: Get ALL FCM tokens for post owner
    const [tokenRows] = await connection.query(
      `SELECT fcm_token FROM user_fcm_tokens WHERE regno = ? AND fcm_token IS NOT NULL`,
      [postOwnerRegno]
    );

    // Step 6: Send push notifications if tokens exist
    if (tokenRows.length > 0) {
      for (const row of tokenRows) {
        await sendFavoriteNotification(row.fcm_token, notificationTitle, notificationBody);
      }
    }

    // Step 7: Save the notification to DB regardless of FCM token availability
    const insertNotificationQuery = `
      INSERT INTO notifications (regno, title, body, image, Timestamp)
      VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())
    `;
    await connection.query(insertNotificationQuery, [
      postOwnerRegno,
      notificationTitle,
      notificationBody,
      liker.Profile
    ]);

    await connection.commit();
    return res.status(200).json({ success: true, message: 'Like recorded and notification saved.' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Transaction Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});



router.post('/add/comment/', async (req, res) => {
 const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];
  const { postId, Comment_text } = req.body;
 

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    const msg = error.name === 'TokenExpiredError'
      ? 'Token expired or invalid'
      : 'Invalid token';
    console.error('JWT verification failed:', error);
    return res.status(401).json({ success: false, message: msg, error: error.message });
  }

  const { Regno, Id } = decoded;
  const commenterId = Regno ?? Id;

  if (!commenterId) {
    console.warn('Token payload missing Regno or Id:', decoded);
    return res.status(400).json({ success: false, message: 'Token payload missing identifier (Regno or Id)' });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Step 1: Insert the comment
    try {
      const insertCommentQuery = `
        INSERT INTO comments_posts (post_id, Regno, comments_text, timestamp) 
        VALUES (?, ?, ?, UNIX_TIMESTAMP());
      `;
      await connection.query(insertCommentQuery, [postId, commenterId, Comment_text]);
    } catch (error) {
      console.error('Error inserting into comments_posts:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Duplicate comment not allowed' });
      }
      throw new Error('Failed to insert comment');
    }

    // Step 2: Get post owner regno
    const [postRows] = await connection.query(`SELECT Regno FROM posts WHERE id = ? LIMIT 1`, [postId]);
    if (postRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const postOwnerRegno = postRows[0].Regno;

    // Skip notification sending if self-comment, but still insert notification
    const isSelfComment = postOwnerRegno === commenterId;

    // Step 3: Get commenter's name and profile
    const [commenterRows] = await connection.query(`
      SELECT 
        COALESCE(s.Fullname, l.Fullname, f.Fullname) AS Fullname,
        COALESCE(s.Profile, l.Profile, f.Profile) AS Profile
      FROM user_fcm_tokens u
      LEFT JOIN students s ON u.regno = s.Regno
      LEFT JOIN lecturer l ON u.regno = l.Regno
      LEFT JOIN fond f ON u.regno = f.Id
      WHERE u.regno = ?
      LIMIT 1
    `, [commenterId]);

    if (commenterRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Commenter info not found' });
    }

    const commenter = commenterRows[0];
    const notificationBody = `commented on your post`;

    // Step 4: Get all FCM tokens of the post owner
    const [fcmRows] = await connection.query(
      `SELECT fcm_token FROM user_fcm_tokens WHERE regno = ?`,
      [postOwnerRegno]
    );

    let allSuccess = true;

    if (!isSelfComment && fcmRows.length > 0) {
      for (const row of fcmRows) {
        const result = await sendFavoriteNotification(row.fcm_token, commenter.Fullname, notificationBody);
        if (!result.success) {
          console.error(`Failed to send to token ${row.fcm_token}:`, result.message);
          allSuccess = false; // track failure
        }
      }
    }

    // Step 5: Save the notification into DB regardless of FCM availability
    try {
      const insertNotificationQuery = `
        INSERT INTO notifications (regno, title, body, image, Timestamp)
        VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())
      `;
      await connection.query(insertNotificationQuery, [
        postOwnerRegno,
        commenter.Fullname,
        notificationBody,
        commenter.Profile
      ]);
    } catch (error) {
      console.error('Error saving notification to DB:', error);
      await connection.rollback();
      return res.status(500).json({ success: false, message: 'Failed to save notification' });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: isSelfComment
        ? 'Comment added (self-comment, no push sent). Notification saved.'
        : fcmRows.length === 0
          ? 'Comment added. No FCM tokens available, but notification saved.'
          : allSuccess
            ? 'Comment added and notification sent to all tokens.'
            : 'Comment added. Some notifications failed but DB saved.'
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Unexpected Transaction Error:', error.stack || error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message || 'Unknown error'
    });
  } finally {
    if (connection) connection.release();
  }
});





/*
router.post('/add/comment/', async (req, res) => {
  const token = req.headers.authorization;
  const { postId, Comment_text } = req.body; // Removed aRegno, using authenticated Regno

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
    await connection.beginTransaction();

    // Insert the comment into comments_posts table
    try {
      const insertCommentQuery = `
        INSERT INTO comments_posts (post_id, Regno, comments_text, timestamp) 
        VALUES (?, ?, ?, UNIX_TIMESTAMP());
      `;
      await connection.query(insertCommentQuery, [postId, Regno, Comment_text]);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Duplicate comment not allowed' });
      }
      throw error;
    }

    // Fetch user details and FCM token
    const [rows] = await connection.query(`
      SELECT students.Fullname, students.Profile, user_fcm_tokens.fcm_token 
      FROM students
      JOIN user_fcm_tokens ON students.regno = user_fcm_tokens.regno
      WHERE students.regno = ?;
    `, [Regno]);

    if (rows.length === 0 || !rows[0].fcm_token) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'User or FCM token not found' });
    }

    const user = rows[0];
    const notificationBody = `commented on your post`;

    // Send the notification
    const result = await sendFavoriteNotification(user.fcm_token, user.Fullname, notificationBody);

    if (!result.success) {
      await connection.rollback();
      return res.status(500).json({ success: false, message: 'Failed to send notification' });
    }

    // Store the notification details
    try {
      const insertNotificationQuery = `
        INSERT INTO notifications (regno, title, body, image, Timestamp)
        VALUES (?, ?, ?, ?, UNIX_TIMESTAMP());
      `;
      await connection.query(insertNotificationQuery, [Regno, user.Fullname, notificationBody, user.Profile]);
    } catch (error) {
      await connection.rollback();
      return res.status(500).json({ success: false, message: 'Failed to save notification', error: error.message });
    }

    await connection.commit();
    return res.status(200).json({ success: true, message: result.response });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

*/


router.get("/liked/posts/", async (req, res) => {
  let connection;
  try {
     const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing or malformed' });
}

const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    const { Regno, Id } = decoded;

    const identifier = Regno !== null && Regno !== undefined ? Regno : Id;

    if (!identifier) {
      return res.status(400).json({ success: false, message: "Invalid token payload: Missing Regno or Id" });
    }
     
    // Query to get liked post IDs
    const likedPostsQuery = `
      SELECT post_id
      FROM likes 
      WHERE regno = ?
    `;

    connection = await pool.getConnection();

    const [rows] = await connection.query(likedPostsQuery, [identifier]);
     
    if (rows.length === 0) {
      connection.release();
      return res.status(200).json({ success: true, message:[] });
    }

    connection.release();

    return res.status(200).json(rows);

  } catch (error) {
    console.error("Error fetching liked posts:", error);

    if (connection) connection.release();

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else {
      return res.status(500).json({ success: false, message: "Failed to retrieve liked posts", error: error.message });
    }
  }
});



module.exports = router;
