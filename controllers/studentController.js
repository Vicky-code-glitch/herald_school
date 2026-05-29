const Submission = require('../models/Submission');
const User = require('../models/User'); // Travis's User model
const Assignment = require('../models/Assignment'); // Travis's Assignment model

// Get student dashboard with their submissions
const getDashboard = async (req, res) => {
    try {
        const studentId = req.user._id;
        
        // Get all submissions by this student
        const submissions = await Submission.find({ studentId })
            .populate('assignmentId', 'title dueDate totalMarks')
            .sort('-submittedAt');
        
        // Get unsubmitted assignments (not submitted yet)
        const allAssignments = await Assignment.find({
            dueDate: { $gte: new Date() },
            isActive: true
        });

        const submittedAssignmentIds = submissions.map(s => s.assignmentId._id.toString());
        const pendingAssignments = allAssignments.filter(
            assignment => !submittedAssignmentIds.includes(assignment._id.toString())
        );

        res.render('student/dashboard', {
            user: req.user,
            submissions,
            pendingAssignments,
            activeTab: 'dashboard'
        });
    } 
    catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('error', { message: 'Failed to load dashboard' });
    }
};

// Show all assignments available to student
const getAllAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ isActive: true })
            .sort('-createdAt')
            .populate('createdBy', 'name');

        // Check which ones student already submitted
        const submissions = await Submission.find({ 
            studentId: req.user._id 
        }).select('assignmentId');

        const submittedIds = submissions.map(s => s.assignmentId.toString());

        res.render('student/assignments', {
            user: req.user,
            assignments,
            submittedIds,
            activeTab: 'assignments'
        });
    } 
    catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).render('error', { message: 'Failed to load assignments' });
    }
};

// Show single assignment details and submission form
const getAssignmentDetail = async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const assignment = await Assignment.findById(assignmentId)
            .populate('createdBy', 'name email');
        
        if (!assignment) {
            return res.status(404).render('error', { message: 'Assignment not found' });
        }

        // Check if student already submitted
        const existingSubmission = await Submission.findOne({
            studentId: req.user._id,
            assignmentId: assignmentId
        });

        const isLate = new Date() > assignment.dueDate;

        res.render('student/assignment-detail', {
            user: req.user,
            assignment,
            existingSubmission,
            isLate,
            activeTab: 'assignments'
        });
    } 
    catch (error) {
        console.error('Assignment detail error:', error);
        res.status(500).render('error', { message: 'Failed to load assignment' });
    }
};

// Assignment submission (file upload)
const submitAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const studentId = req.user._id;
        
        // Check if assignment exists
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if already submitted
        const existingSubmission = await Submission.findOne({
            studentId,
            assignmentId
        });

        if (existingSubmission) {
            return res.status(400).json({ message: 'You already submitted this assignment' });
        }

        // Check file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        // Check file size (max 10MB)
        if (req.file.size > 10 * 1024 * 1024) {
            return res.status(400).json({ message: 'File too large. Max 10MB' });
        }

        // If submission is late
        const status = new Date() > assignment.dueDate ? 'late' : 'submitted';

        // Create submission
        const submission = new Submission({
            studentId,
            assignmentId,
            fileUrl: `/uploads/submissions/${req.file.filename}`,
            originalFileName: req.file.originalname,
            status
        });

        await submission.save();

        res.json({ 
            success: true, 
            message: 'Assignment submitted successfully',
            submissionId: submission._id
        });
    } 
    catch (error) {
        console.error('Submit error:', error);
        res.status(500).json({ message: 'Submission failed. Please try again.' });
    }
};

// View student's own submissions and grades
const getMySubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({ studentId: req.user._id })
            .populate('assignmentId', 'title dueDate totalMarks description')
            .sort('-submittedAt');
        
        res.render('student/my-submissions', {
            user: req.user,
            submissions,
            activeTab: 'submissions'
        });
    } 
    catch (error) {
        console.error('My submissions error:', error);
        res.status(500).render('error', { message: 'Failed to load submissions' });
    }
};

// Update student profile
const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const updates = {};
        
        if (name) updates.name = name;
        if (email) updates.email = email;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { 
                new: true, 
                runValidators: true 
            }
        ).select('-password');

        res.json({ success: true, user: updatedUser });
    } 
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
};

// Delete a submission (only if not graded yet)
const deleteSubmission = async (req, res) => {
    try {
        const submissionId = req.params.submissionId;
        
        const submission = await Submission.findOne({
            _id: submissionId,
            studentId: req.user._id
        });

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Don't allow deletion if already graded
        if (submission.grade !== null) {
            return res.status(400).json({ message: 'Cannot delete graded submission' });
        }

        await Submission.findByIdAndDelete(submissionId);

        res.json({ success: true, message: 'Submission deleted successfully' });
    } 
    catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({ message: 'Failed to delete submission' });
    }
};

module.exports = {
    getDashboard,
    getAllAssignments,
    getAssignmentDetail,
    submitAssignment,
    getMySubmissions,
    updateProfile,
    deleteSubmission
};