const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const studentController = require('../controllers/studentController');
const { isStudent } = require('../middleware/roleCheck');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/submissions/');
    },
    filename: function (req, file, cb) {
        // Create unique filename: studentId_timestamp_originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `submission-${req.user._id}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All student routes require authentication AND student role

router.use(isStudent);

// Dashboard
router.get('/dashboard', studentController.getDashboard);

// Assignments
router.get('/assignments', studentController.getAllAssignments);
router.get('/assignments/:id', studentController.getAssignmentDetail);
router.post('/assignments/:id/submit', upload.single('assignmentFile'), studentController.submitAssignment);

// Submissions
router.get('/my-submissions', studentController.getMySubmissions);
router.delete('/submissions/:submissionId', studentController.deleteSubmission);

// Profile
router.put('/profile', studentController.updateProfile);

module.exports = router;