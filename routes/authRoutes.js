const express = require('express')
const { login, studentRegister, teacherRegister, adminRegister, addResult } = require('../controller/authController')
const router = express.Router();
const multer = require("multer");
const checkAuth = require('../middleware/checkAuth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

module.exports = router;

router.post(
  "/upload-results",
  upload.single("excelFile"),
  addResult
);
router.post('/login', checkAuth, login)
router.post('/register', checkAuth, studentRegister)
router.post('/teacher', checkAuth, teacherRegister)
router.post('/admin', checkAuth, adminRegister)
router.post('/add-result', checkAuth, addResult);

module.exports = router