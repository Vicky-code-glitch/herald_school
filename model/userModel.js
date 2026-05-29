const mongoose = require('mongoose');

// User model
const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    username: String,
    password: String,
    status: { type: String, default: 'pending'},
    role: { type: String } // optional: student/admin
});


const User = mongoose.model('User', userSchema);
module.exports = User;
