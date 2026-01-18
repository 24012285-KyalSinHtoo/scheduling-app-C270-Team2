const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();

//***** MIDDLEWARE SETUP *****//
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(flash());

//***** EJS SETUP *****//
app.set('view engine', 'ejs');

//***** IN-MEMORY DATA *****//
let users = [
    { id: 1, username: 'admin', email: 'admin@test.com', password: '1234', role: 'admin' },
    { id: 2, username: 'user', email: 'user@test.com', password: '1234', role: 'user' }
];

let tasks = [
    { id: 1, title: 'Buy groceries', description: 'Milk, eggs, bread', priority: 'High', dueDate: '2026-01-20', userId: 2, status: 'Pending' },
    { id: 2, title: 'Finish project', description: 'Complete backend logic', priority: 'Medium', dueDate: '2026-01-22', userId: 2, status: 'Pending' }
];

//***** AUTH MIDDLEWARE *****//
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    req.flash('error', 'Please login to access this page');
    res.redirect('/login');
};

//***** ROUTES *****//

// Home / Welcome
app.get('/', (req, res) => {
    const user = req.session.user || null;
    res.render('Welcome', { user });
});

// Dashboard
app.get('/dashboard', checkAuthenticated, (req, res) => {
    const userTasks = tasks.filter(task => task.userId === req.session.user.id);
    res.render('Dashboard', { user: req.session.user, tasks: userTasks });
});

// Add Task
app.get('/task/add', checkAuthenticated, (req, res) => {
    res.render('AddTask', { user: req.session.user });
});

app.post('/task/add', checkAuthenticated, (req, res) => {
    const { title, description, priority, dueDate } = req.body;
    const id = tasks.length ? tasks[tasks.length - 1].id + 1 : 1; // auto-increment
    tasks.push({ id, title, description, priority, dueDate, userId: req.session.user.id, status: 'Pending' });
    res.redirect('/dashboard');
});

// Edit Task
app.get('/task/edit/:id', checkAuthenticated, (req, res) => {
    const task = tasks.find(t => t.id == req.params.id);
    if (!task) return res.status(404).send('Task not found');
    res.render('EditTask', { task, user: req.session.user });
});

app.post('/task/edit/:id', checkAuthenticated, (req, res) => {
    const task = tasks.find(t => t.id == req.params.id);
    if (!task) return res.status(404).send('Task not found');
    const { title, description, priority, dueDate, status } = req.body;
    task.title = title;
    task.description = description;
    task.priority = priority;
    task.dueDate = dueDate;
    task.status = status;
    res.redirect('/dashboard');
});

// Delete Task
app.post('/task/delete/:id', checkAuthenticated, (req, res) => {
    tasks = tasks.filter(t => t.id != req.params.id || t.userId !== req.session.user.id);
    res.redirect('/dashboard');
});

// Register
app.get('/register', (req, res) => {
    res.render('Register', { errors: req.flash('error'), messages: req.flash('success') });
});

app.post('/register', (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
        req.flash('error', 'All fields required');
        return res.redirect('/register');
    }
    const id = users.length ? users[users.length - 1].id + 1 : 1;
    users.push({ id, username, email, password, role });
    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/login');
});

// Login
app.get('/login', (req, res) => {
    res.render('Login', { errors: req.flash('error'), messages: req.flash('success') });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        req.session.user = user;
        res.redirect('/dashboard');
    } else {
        req.flash('error', 'Invalid credentials');
        res.redirect('/login');
    }
});

// Guest view
app.get('/guest', (req, res) => {
    const sampleTasks = [
        { title: 'Finish Homework', priority: 'High' },
        { title: 'Read Book', priority: 'Medium' },
        { title: 'Exercise', priority: 'Low' }
    ];

    const categories = [
        { name: 'High Priority', description: 'Focus on these first', tasks: sampleTasks.filter(t => t.priority === 'High') },
        { name: 'Medium Priority', description: 'Do these next', tasks: sampleTasks.filter(t => t.priority === 'Medium') },
        { name: 'Low Priority', description: 'Optional tasks', tasks: sampleTasks.filter(t => t.priority === 'Low') }
    ];

    res.render('Guest', { user: null, categories });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Server Start
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
