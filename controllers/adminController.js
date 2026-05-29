const User = require('../models/User'); // Travis's User model
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');

// DASHBOARD 
const getAdminDashboard = async (req, res) => {
    try {
        // Get statistics for admin dashboard
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        const totalAssignments = await Assignment.countDocuments();
        const totalSubmissions = await Submission.countDocuments();
        
        // Get recent submissions (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentSubmissions = await Submission.find({
            submittedAt: { $gte: sevenDaysAgo }
        })
        .populate('studentId', 'name email')
        .populate('assignmentId', 'title')
        .sort('-submittedAt')
        .limit(10);

        // Get pending graded submissions
        const pendingGrading = await Submission.countDocuments({ grade: null });

        res.render('admin/dashboard', {
            user: req.user,
            stats: {
              totalStudents,
              totalTeachers,
              totalAssignments,
              totalSubmissions,
              pendingGrading
            },
            recentSubmissions,
            activeTab: 'dashboard'
        });
    } 
    catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).render('error', { message: 'Failed to load admin dashboard' });
    }
};

// List all users (students and teachers)
const getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        let filter = {};
        
        // Filter by role if specified
        if (role && role !== 'all') {
            filter.role = role;
        }

        // Search by name or email
        if (search) {
            filter.$or = [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(filter)
            .select('-password') // Don't send passwords
            .sort('-createdAt');

        res.render('admin/users', {
            user: req.user,
            users,
            filters: { role: role || 'all', search: search || '' },
            activeTab: 'users'
        });
    } 
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).render('error', { message: 'Failed to load users' });
    }
};

// Get single user details with their submissions
const getUserDetails = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).render('error', { message: 'User not found' });
        }

        // Get user's submissions if they're a student
        let submissions = [];
        if (user.role === 'student') {
            submissions = await Submission.find({ studentId: userId })
                .populate('assignmentId', 'title dueDate totalMarks')
                .sort('-submittedAt');
        }

        res.render('admin/user-details', {
            user: req.user,
            targetUser: user,
            submissions,
            activeTab: 'users'
        });
    } 
    catch (error) {
        console.error('User details error:', error);
        res.status(500).render('error', { message: 'Failed to load user details' });
    }
};

// Update user role (promote/demote)
const updateUserRole = async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;
        
        // Don't allow changing your own role (would lock yourself out)
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot change your own role' 
            });
        }

        // Validate role
        if (!['student', 'teacher', 'admin'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid role' 
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                role: role 
            },
            { 
                new: true, 
                runValidators: true 
            }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ 
            success: true, 
            message: `User role updated to ${role}`,
            user: updatedUser
        });
    } 
    catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user role' });
    }
};

// Delete a user
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Don't allow deleting yourself
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot delete your own account' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // If user is a student, delete their submissions too
        if (user.role === 'student') {
            await Submission.deleteMany({ studentId: userId });
        }

        // If user is a teacher, their assignments will remain but show "deleted user" as creator

        await User.findByIdAndDelete(userId);

        res.json({ 
            success: true, 
            message: `${user.name} (${user.role}) has been deleted` 
        });
    } 
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
};

// SUBMISSION MANAGEMENT 
const getAllSubmissions = async (req, res) => {
    try {
        const { status, assignmentId } = req.query;
        let filter = {};
        
        if (status && status !== 'all') {
            filter.status = status;
        }

        if (assignmentId && assignmentId !== 'all') {
            filter.assignmentId = assignmentId;
        }

        const submissions = await Submission.find(filter)
            .populate('studentId', 'name email rollNumber')
            .populate('assignmentId', 'title dueDate totalMarks')
            .sort('-submittedAt');

        // Get all assignments for filter dropdown
        const allAssignments = await Assignment.find().select('title');

        res.render('admin/submissions', {
            user: req.user,
            submissions,
            allAssignments,
            filters: { status: status || 'all', assignmentId: assignmentId || 'all' },
            activeTab: 'submissions'
        });
    } 
    catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).render('error', { message: 'Failed to load submissions' });
    }
};

// Grade a submission (teacher/admin)
const gradeSubmission = async (req, res) => {
    try {
        const submissionId = req.params.id;
        const { grade, feedback } = req.body;
        
        if (grade < 0 || grade > 100) {
            return res.status(400).json({ 
                success: false, 
                message: 'Grade must be between 0 and 100' 
            });
        }

        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        submission.grade = grade;
        submission.feedback = feedback || '';
        submission.status = 'graded';

        await submission.save();

        res.json({ 
            success: true, 
            message: 'Submission graded successfully',
            submission
        });
    } 
    catch (error) {
        console.error('Grade submission error:', error);
        res.status(500).json({ success: false, message: 'Failed to grade submission' });
    }
};

// View a single submission in detail
const getSubmissionDetails = async (req, res) => {
    try {
        const submissionId = req.params.id;
        
        const submission = await Submission.findById(submissionId)
            .populate('studentId', 'name email rollNumber')
            .populate('assignmentId', 'title description dueDate totalMarks');
        
        if (!submission) {
            return res.status(404).render('error', { message: 'Submission not found' });
        }

        res.render('admin/submission-detail', {
            user: req.user,
            submission,
            activeTab: 'submissions'
        });
    } 
    catch (error) {
        console.error('Submission detail error:', error);
        res.status(500).render('error', { message: 'Failed to load submission' });
    }
};  

// SYSTEM MANAGEMENT
const getSystemStats = async (req, res) => {
    try {
        // Get dates for this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const stats = {
            users: {
                total: await User.countDocuments(),
                students: await User.countDocuments({ role: 'student' }),
                teachers: await User.countDocuments({ role: 'teacher' }),
                admins: await User.countDocuments({ role: 'admin' }),
                newThisMonth: await User.countDocuments({ 
                    createdAt: { $gte: startOfMonth } 
                })
            },  
            assignments: {
                total: await Assignment.countDocuments(),
                active: await Assignment.countDocuments({ isActive: true }),
                dueThisWeek: await Assignment.countDocuments({
                    dueDate: { $gte: startOfWeek, $lte: new Date() }
                })
            },
            submissions: {
                total: await Submission.countDocuments(),
                graded: await Submission.countDocuments({ grade: { $ne: null } }),
                pendingGrading: await Submission.countDocuments({ grade: null }),
                lateSubmissions: await Submission.countDocuments({ status: 'late' }),
                thisMonth: await Submission.countDocuments({
                    submittedAt: { $gte: startOfMonth }
                })
            }
        };  

        // Get top performing students (average grade)
        const topStudents = await Submission.aggregate([
            { 
                $match: { 
                    grade: { 
                        $ne: null 
                    } 
                } 
            },
            { 
                $group: {
                    _id: '$studentId',
                    averageGrade: { 
                        $avg: '$grade' 
                    },
                    submissionsCount: { 
                        $sum: 1 
                    }
            }   },
            { 
                $sort: { 
                    averageGrade: -1 
                } 
            },
            { 
                $limit: 10 
            }
        ]);

        // Populate student names
        for (let student of topStudents) {
            const user = await User.findById(student._id).select('name email');
            student.user = user;
        }

        res.render('admin/stats', {
            user: req.user,
            stats,
            topStudents,
            activeTab: 'stats'
        });
    }   
    catch (error) {
        console.error('System stats error:', error);
        res.status(500).render('error', { message: 'Failed to load statistics' });
    }
};  

module.exports = {
    getAdminDashboard,
    getAllUsers,
    getUserDetails,
    updateUserRole,
    deleteUser,
    getAllSubmissions,
    gradeSubmission,
    getSubmissionDetails,
    getSystemStats
};