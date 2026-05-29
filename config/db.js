const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = mongoose.connect(process.env.URL)
.then(() => console.log('MongoDB connected ✅'))
.catch(err => console.error(err));

module.exports = connectDB;