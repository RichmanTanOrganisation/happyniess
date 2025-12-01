const express = require('express');
const app = express();

app.get('/dangerious', (req, res) => {
    const userCode = req.query.code;
    eval(userCode); // Vulnerable to code injection
});