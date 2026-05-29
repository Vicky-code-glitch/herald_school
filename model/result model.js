const mongoose = require('mongoose');

// Result model
const resultSchema = new mongoose.Schema({
    studentName: String,
    studentId: String,
    class: String,
    term: String,
    subject: String,
    score: Number
});

const Result = mongoose.model('Result', resultSchema);
module.exports = Result
