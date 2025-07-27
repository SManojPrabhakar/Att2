// routes.js
const express = require('express');
const path = require('path');
const router = express.Router();
const app = express();

app.use(express.static(path.join(__dirname, './public')));
// Serve HTML pages
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'mad.html'));
});

router.get('/registration', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'index.html'));
});

router.get('/aboutus', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'about.html'));
});

router.get('/report', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'report.html'));
});

router.get('/contactus', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'contact.html'));
});

router.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'help.html'));
});

/*router.get('/userui', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'Profile.html'));
});*/

router.get('/academics', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'academics.html'));
});

router.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'Profile.html'));
});

router.get('/feeportal', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'feeportal.html'));
});

router.get('/studentstuff', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'studentstuff.html'));
});

router.get('/colleges', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'colleges.html'));
});

router.get('/deactivate', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'deactivate.html'));
});

router.get('/studentreg/', (req, res) => {

  // You can pass the classId to the HTML page or handle it here
  res.sendFile(path.join(__dirname, 'htmlpages', 'studentreg.html'));
});

router.get('/campus/', (req, res) => {

  // You can pass the classId to the HTML page or handle it here
  res.sendFile(path.join(__dirname, 'htmlpages', 'campus.html'));
});

router.get('/fo/campus/:name/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'focampus.html'));
});


router.get('/fo/campus/', (req, res) => {

  // You can pass the classId to the HTML page or handle it here
  res.sendFile(path.join(__dirname, 'htmlpages', 'focampus.html'));
});


router.get('/campus/students/:role/', (req, res) => {

  // You can pass the classId to the HTML page or handle it here
  res.sendFile(path.join(__dirname, 'htmlpages', 'students.html'));
});


router.get('/students/page/:classId', (req, res) => {

  // You can pass the classId to the HTML page or handle it here
  res.sendFile(path.join(__dirname, 'htmlpages', 'studentlis.html'));
});


router.get('/students/pageatt/:subject/:id/:course/:sem/:section/:year/', (req, res) => {

  // You can pass the classId to the HTML page or handle it here
  res.sendFile(path.join(__dirname, 'htmlpages', 'Attendancesheet.html'));
});

module.exports = router;
