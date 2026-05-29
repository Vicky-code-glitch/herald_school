const express = require('express')
const { login, studentRegister, teacherRegister, adminRegister, addResult } = require('../controller/authController')
const router = express.Router();
const multer = require("multer");

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
router.post('/login', login)
router.post('/register',studentRegister)
router.post('/teacher', teacherRegister)
router.post('/admin', adminRegister)
router.post('/add-result', addResult);

module.exports = router