const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;

const connection = mysql.createConnection({
    user: "root",
    password: "smp13486340@",
    database: "buer",
    host: "127.0.0.1"
});

connection.connect((err) => {
    if(err) throw err;
    console.log("Connect to MySQL database");
});

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(cors());

// 회원가입 
app.post('/signup', (req, res) => {
    const { id, email, password } = req.body;
    const query = 'INSERT INTO user (user_id, email, password) VALUES (?, ?, ?)';
    connection.query(query, [id, email, password], (err, result) => {
    if (err) {
        console.error('Error during signup:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } else {
        res.status(200).json({ message: 'Signup successful' });
    }
    });
});

// 로그인
app.post('/login', (req, res) => {
    const { id, password } = req.body;
    const query = 'SELECT * FROM user WHERE user_id = ? AND password = ?';
    connection.query(query, [id, password], (err, result) => {
    if (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } else {
        if (result.length > 0) {
        const userId = result[0].id;
        const accessToken = jwt.sign({ id: userId }, 'access_secret_key', { expiresIn: '3h' });
        const refreshToken = jwt.sign({ id: userId }, 'refresh_secret_key', { expiresIn: '7d' });
        res.status(200).json({ message: 'Login successful', access_token: accessToken, refresh_token: refreshToken });
        } else {
        res.status(401).json({ error: 'Invalid credentials' });
        }
    }
    });
});

//토큰 재발급
app.post('/token/refresh', (req, res) => {
    const { refresh_token } = req.body;
    try {
        const decodedToken = jwt.verify(refresh_token, 'refresh_secret_key');
        const userId = decodedToken.id;
        const accessToken = jwt.sign({ id: userId }, 'access_secret_key', { expiresIn: '15m' });
        res.status(200).json({ access_token: accessToken });
    } catch (error) {
        console.error('Error during token refresh:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});