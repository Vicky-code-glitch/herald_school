const express = require("express");
const User = require("../model/userModel");
const bcrypt = require("bcrypt");

const login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.redirect("/Error");

  const isMatch = await bcrypt.compare(password, user.password || "");
  if (!isMatch) return res.redirect("/Error");

  if (user.status !== "approved") {
    return res.send("Awaiting admin approval");
  }

  req.session.studentId = user.userId;
  req.session.userId = user._id;
  req.session.role = user.role;

  switch (user.role) {
    case "admin": {
      return res.redirect(`/admindashboard?userId=${user.userId}`);
    }
    case "teacher": {
      return res.redirect(`/teachdashboard?userId=${user.userId}`);
    }
    case "student": {
      return res.redirect(`/dashboard?userId=${user.userId}`);
    }
    default: {
      return res.redirect("/Error");
    }
  }
};

  const studentRegister = async (req, res) => {
  try {
    let { username, password, userId, status, role } = req.body;

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    userId = `STU-${Math.floor(1000 + Math.random() * 9000)}`; // Generate random user ID

    const user = new User({
      userId,
      username,
      password: hashedPassword,
      role: "student",
      status
    });

    await user.save();

    return res.redirect("login.html");

  } catch (err) {
    console.log(err);
    return res.status(500).send("Server error");
  }
};


const teacherRegister = async (req, res) => {
  try {
    let { username, password, role, status, userId } = req.body;

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.send("User already exists");
    }

    userId = `TCH-${Math.floor(1000 + Math.random() * 9000)}`; // Generate random user ID


    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = new User({
      userId,
      username,
      password: hashedPassword,
      role : "teacher",
      status
    });

    await teacher.save();

    return res.redirect("login.html");

  } catch (err) {
    console.log(err);
    return res.status(500).send("Server error");
  }
};


const adminRegister = async (req, res) => {
    let { username, password, role, status, userId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); 

    const existingUser = await User.findOne({ username });

    userId = `ADM-${Math.floor(1000 + Math.random() * 9000)}`;// Generate random user ID


if (existingUser) {
  return res.send("User already exists");
}

    const admin = new User({ userId, username, password: hashedPassword, role : "admin", status : "approved" });
    try {
   await admin.save();
} catch (err) {
   console.log(err);
   res.status(500).json(err);
}
    res.redirect('admin-login.html');
};

const addResult = async (req, res) => {
    let { studentName, studentId, class: studentClass, term, subject, score, role } = req.body;


    const result = new Result({
        studentName,
        studentId,
        class: studentClass,
        term,
        subject,
        score
    });

    await result.save();
    res.send(`Result added successfully ✅
            <a href="/dashboard">Back to dashboard</a>`);
}

module.exports = { login, studentRegister, teacherRegister, adminRegister, addResult };
