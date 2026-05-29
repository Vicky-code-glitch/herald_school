const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/roleCheck');

router.use(isAdmin);

// Dashboard
router.get('/dashboard', adminController.getAdminDashboard);
router.get('/', (req, res) => res.redirect('/admin/dashboard'));

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

router.get('/submissions', adminController.getAllSubmissions);
router.get('/submissions/:id', adminController.getSubmissionDetails);
router.put('/submissions/:id/grade', adminController.gradeSubmission);

router.get('/stats', adminController.getSystemStats);

module.exports = router;