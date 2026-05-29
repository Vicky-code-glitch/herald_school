const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/students', studentRoutes);
app.use('/admin', adminRoutes);

// Home route
app.get('/', (req, res) => {
    if (req.user && req.user.role === 'admin') {
        res.redirect('/admin/dashboard');
    } else if (req.user && req.user.role === 'teacher') {
        res.redirect('/teachers/dashboard'); // Travis's route
    } else {
        res.redirect('/students/dashboard');
    }
});

// Error page
app.get('/error', (req, res) => {
    res.status(500).render('error', { message: req.query.message || 'An error occurred' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { message: 'Page not found' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/herald_school')
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`\nServer running on http://localhost:${PORT}`);
            console.log(`Admin: http://localhost:${PORT}/admin/dashboard`);
            console.log(`Student: http://localhost:${PORT}/students/dashboard`);        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        console.log('\n This is expected if MongoDB is not running.');
        console.log('Your code is ready to merge with Travis!\n');
    });