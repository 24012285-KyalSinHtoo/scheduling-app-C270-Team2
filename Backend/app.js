//*****MODULE IMPORTS*****//
const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();
const bcrypt = require('bcrypt');
const path = require('path');

//*****DATABASE CONNECTION*****//
const db = mysql.createConnection({
    host: 'your-db-host',
    user: 'your-db-user',
    password: 'your-db-password',
    database: 'your-db-name',
    port: 3306
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to database');
});

//*****MIDDLEWARE SETUP*****//
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.use(flash());

//*****SETTING UP EJS*****//
app.set('view engine', 'ejs');

//*****AUTH MIDDLEWARE*****//
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    req.flash('error', 'Please login to access this page');
    res.redirect('/login');
};

const checkAdmin = (req, res, next) => {
    if (req.session.user?.role === 'admin') return next();
    req.flash('error', 'Access denied');
    res.redirect('/dashboard');
};

//*****HOME / DASHBOARD*****//
app.get('/', (req, res) => {
    const user = req.session.user || null;
    res.render('welcome', { user });
});

app.get('/dashboard', checkAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    const sql = 'SELECT * FROM tasks WHERE userId = ? ORDER BY dueDate ASC';
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).send('Error loading tasks');
        res.render('dashboard', { user: req.session.user, tasks: results });
    });
});

//*****TASK CRUD*****//
// CREATE TASK
app.get('/task/add', checkAuthenticated, (req, res) => {
    res.render('addTask', { user: req.session.user });
});

app.post('/task/add', checkAuthenticated, (req, res) => {
    const { title, description, priority, dueDate } = req.body;
    const userId = req.session.user.id;

    const sql = 'INSERT INTO tasks (title, description, priority, dueDate, userId, status) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [title, description, priority, dueDate, userId, 'Pending'], err => {
        if (err) return res.status(500).send('Error creating task');
        res.redirect('/dashboard');
    });
});

// EDIT TASK
app.get('/task/edit/:id', checkAuthenticated, (req, res) => {
    const taskId = req.params.id;
    const sql = 'SELECT * FROM tasks WHERE taskId = ?';
    db.query(sql, [taskId], (err, results) => {
        if (err || results.length === 0) return res.status(404).send('Task not found');
        res.render('editTask', { task: results[0], user: req.session.user });
    });
});

app.post('/task/edit/:id', checkAuthenticated, (req, res) => {
    const taskId = req.params.id;
    const { title, description, priority, dueDate, status } = req.body;

    const sql = 'UPDATE tasks SET title = ?, description = ?, priority = ?, dueDate = ?, status = ? WHERE taskId = ?';
    db.query(sql, [title, description, priority, dueDate, status, taskId], err => {
        if (err) return res.status(500).send('Error updating task');
        res.redirect('/dashboard');
    });
});

// DELETE TASK
app.post('/task/delete/:id', checkAuthenticated, (req, res) => {
    const taskId = req.params.id;
    const userId = req.session.user.id;

    const sql = 'DELETE FROM tasks WHERE taskId = ? AND userId = ?';
    db.query(sql, [taskId, userId], err => {
        if (err) return res.status(500).send('Error deleting task');
        res.redirect('/dashboard');
    });
});

// SEARCH TASKS
app.get('/tasks/search', checkAuthenticated, (req, res) => {
    const query = req.query.q;
    const userId = req.session.user.id;
    const sql = 'SELECT * FROM tasks WHERE userId = ? AND (title LIKE ? OR description LIKE ?)';
    const likeQuery = `%${query}%`;
    db.query(sql, [userId, likeQuery, likeQuery], (err, results) => {
        if (err) return res.status(500).send('Search error');
        res.render('dashboard', { user: req.session.user, tasks: results });
    });
});

//*****AUTHENTICATION ROUTES*****//
// REGISTER
app.get('/register', (req, res) => {
    res.render('register', { user: null, errors: req.flash('error'), messages: req.flash('success') });
});

app.post('/register', (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        req.flash('error', 'All fields required');
        return res.redirect('/register');
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).send('Server error');

        const sql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
        db.query(sql, [username, email, hash, role], err => {
            if (err) return res.status(500).send('Error registering user');
            req.flash('success', 'Registration successful! Please log in.');
            res.redirect('/login');
        });
    });
});

// LOGIN
app.get('/login', (req, res) => {
    res.render('login', { user: null, errors: req.flash('error'), messages: req.flash('success') });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        req.flash('error', 'All fields required');
        return res.redirect('/login');
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err || results.length === 0) {
            req.flash('error', 'Invalid credentials');
            return res.redirect('/login');
        }

        bcrypt.compare(password, results[0].password, (err, match) => {
            if (match) {
                req.session.user = results[0];
                res.redirect('/dashboard');
            } else {
                req.flash('error', 'Invalid credentials');
                res.redirect('/login');
            }
        });
    });
});

// LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

//*****SERVER START*****//
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
