const express = require('express');
const session = require('express-session');

function checkAuth(req, res, next) {
    if (!req.session.userId) return res.send('Access denied ❌');

    next();
}

module.exports = checkAuth;