const express = require('express')
const { login, studentRegister, teacherRegister, adminRegister, addResult } = require('../controller/authController')
const router = express.Router()

router.post('/login', login)
router.post('/register',studentRegister)
router.post('/teacher', teacherRegister)
router.post('/admin', adminRegister)
router.post('/add-result', addResult);

module.exports = router