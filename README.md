# Herald School - Student & Admin Modules

## What I built

### Student Features
- Dashboard with pending assignments
- View all assignments
- Submit assignments with file upload (PDF, DOC, TXT, JPG, PNG - max 10MB)
- View submission history and grades
- Delete ungraded submissions

### Admin Features
- Dashboard with system statistics
- User management (view all users, change roles, delete users)
- View all submissions across all students
- Grade submissions and add feedback
- System statistics page

### Files I Created

**Models:**
- `models/Submission.js` - Tracks student submissions with grades

**Controllers:**
- `controllers/studentController.js` - All student logic
- `controllers/adminController.js` - All admin logic

**Routes:**
- `routes/studentRoutes.js` - Student endpoints
- `routes/adminRoutes.js` - Admin endpoints

**Middleware:**
- `middleware/roleCheck.js` - Role-based access (isStudent, isAdmin)

**Views (EJS):**
- `views/student/` - dashboard, assignments, assignment-detail, my-submissions
- `views/admin/` - dashboard, users, user-details, submissions, submission-detail, stats
- `views/error.ejs` - Error page

## What I Need From 
1. **User Model** - Must have `role` field (student/teacher/admin)
2. **Assignment Model** - Must have fields: title, description, dueDate, totalMarks, createdBy
3. **Auth Middleware** - Must attach `req.user` from JWT
4. **Teacher Routes** - Keep your existing routes

## How to Merge

1. Copy my files into the project
2. Run `npm install multer` (for file uploads)
3. Create `public/uploads/submissions/` folder
4. Remove my temp auth (marked with comments in server.js)
5. Add your auth middleware
6. Add my route imports to your server.js:
   ```javascript
   const studentRoutes = require('./routes/studentRoutes');
   const adminRoutes = require('./routes/adminRoutes');
   app.use('/students', studentRoutes);
   app.use('/admin', adminRoutes);