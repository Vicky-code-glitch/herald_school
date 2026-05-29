const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const User = require('./model/userModel');
const Result = require('./model/result model');
const connectDB = require('./config/db');
const authRoute = require('./routes/authRoutes');
const dotenv = require('dotenv');

connectDB;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.jwtsecretkey,
    resave: false,
    saveUninitialized: true,
}));

app.use(express.static(path.join(__dirname, 'public')));



/* ---------------- AUTH MIDDLEWARE ---------------- */
function checkAuth(req, res, next) {
    if (!req.session.userId) return res.send('Access denied ❌');

    next();
}

/* ---------------- ROUTES ---------------- */

// Home
app.get('/', (_, res) => {
    res.send(`
        <h1>Home route works ✅</h1>
        <a href='/register.html'>Register student</a>
        <a href='/teacher-register.html'>Register teacher</a>
        <a href='/admin-register.html'>Register admin</a>
        `);
});

// Login
app.use('/', authRoute)

app.get('/Error', (req, res) => {
    res.send(`
        <h3>Wrong logins. Check password or username</h3>
        <a href="register.html">Register</a>
        `)
})

app.get('/upload', (req, res) => {
    res.send(`
        <h3>Only admins can upload results</h3> <br >
        <a href="/dashboard">Back to dashboard</a>`);
});

app.get('/pending', async (req, res) => {
    const pend = await User.find({ status: "pending" });
    res.send(pend);
});

// Approve user
app.post('/approve/:userId', checkAuth, async (req, res) => {
    const { userId } = req.params;
    await User.findByIdAndUpdate(userId, { status: 'approved' });
    res.json({ message: 'User approved ✅' });
});

// Reject user
app.post('/reject/:userId', checkAuth, async (req, res) => {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.json({ message: 'User rejected ❌' });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login.html');
    });
});

/* ---------------- ADMIN DASHBOARD ---------------- */
app.get('/admindashboard', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admindashboard.html'));
})

/* ---------------- TEACHER DASHBOARD ---------------- */
app.get('/teachdashboard', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tdashboard.html'));
})

/* ---------------- DASHBOARD ---------------- */
app.get('/dashboard', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

/* ---------------- ADD RESULT (protected) ---------------- */


/* ---------------- VIEW RESULTS (student) ---------------- */
app.get('/results/:studentId', checkAuth, async (req, res) => {
    const { studentId } = req.params;
    const results = await Result.find({ studentId });
    if (!results.length) return res.send('No results found ❌');

    res.json(results);
});

app.get('/results', async (req, res) => {
    const resp = await User.find();
    res.send(resp);
});

/* ---------------- START SERVER ---------------- */
mongoose.connection.once('open', () => {
    app.listen(3000, () => console.log('Server running on http://localhost:3000'));
});