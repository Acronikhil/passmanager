const express = require('express');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const { log } = require('console');

const app = express();
const saltRounds = 10;
const filePath = path.join(__dirname, 'passwords.json');

// Configure express-session with cookie settings
app.use(session({
    secret: 'your-secret-key',  // Use a secret string
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,  // For security reasons, this prevents client-side JS from accessing the cookie
        secure: false,   // If you're using HTTPS, set this to true
        maxAge: 1000 * 60 * 60 * 24,  // Cookie expires in 1 day
    }
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let users = {};

function loadPasswords() {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading file:", err);
        return {};
    }
}

function savePasswords() {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    users = loadPasswords();

    if (users[username]) {
        bcrypt.compare(password, users[username].password, (err, result) => {
            if (result) {
                req.session.user = username;  // Store the username in session
                console.log(req.session.user);
                res.json({ success: true });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        });
    } else {
        res.status(401).json({ message: 'User does not exist' });
    }
});

// Register endpoint
app.post('/register', (req, res) => {
    let { username, 'pass': password, 'confirm-password': confirmPassword } = req.body;

    password = password.trim();
    confirmPassword = confirmPassword.trim();

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    users = loadPasswords();

    if (users[username]) {
        return res.status(400).json({ message: 'User already exists' });
    }

    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ message: 'Error hashing password' });
        }

        users[username] = {
            password: hashedPassword,
            passwords: {}
        };
        savePasswords();
        res.redirect('/');
    });
});

// Get passwords (requires login)
app.get('/get-passwords', (req, res) => {
    const currentUser = req.session.user;  // Get the current user from session
    if (!currentUser) return res.status(401).json({ message: 'Please log in' });

    const userPasswords = users[currentUser].passwords || {};
    res.json({ success: true, passwords: userPasswords });
});

app.get('/get-user', (req, res) => {
    const currentUser = req.session.user;  // Get the current user from session
    if (!currentUser) return res.status(401).json({ message: 'Please log in' });

    res.json({ success: true, user: currentUser });
});

// Add password (requires login)
app.post('/add-password', (req, res) => {
    const currentUser = req.session.user;  // Get the current user from session
    if (!currentUser) return res.status(401).json({ message: 'Please log in' });

    const { site, password } = req.body;
    const userPasswords = users[currentUser].passwords || {};

    const currentPassword = userPasswords[site] ? userPasswords[site].password : null;
    const lastUpdated = new Date().toLocaleDateString();

    userPasswords[site] = {
        password: password,
        lastUpdated: lastUpdated,
        previousPassword: currentPassword
    };

    users[currentUser].passwords = userPasswords;
    savePasswords();

    res.json({ success: true });
});

// Update password (requires login)
app.post('/update-password', (req, res) => {
    const currentUser = req.session.user;  // Get the current user from session
    if (!currentUser) return res.status(401).json({ message: 'Please log in' });

    const { site, password } = req.body;
    const userPasswords = users[currentUser].passwords || {};

    if (!userPasswords[site]) return res.status(404).json({ message: 'Site not found' });

    const currentPassword = userPasswords[site].password;
    userPasswords[site] = {
        password: password,
        lastUpdated: new Date().toLocaleDateString(),
        previousPassword: currentPassword
    };

    users[currentUser].passwords = userPasswords;
    savePasswords();

    res.json({ success: true });
});

// Logout endpoint
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to logout' });
        }
        res.json({ success: true });
    });
});

// Check if user is logged in on page load
app.get('/check-login', (req, res) => {
    if (req.session.user) {
        return res.json({ loggedIn: true, username: req.session.user });
    }
    res.json({ loggedIn: false });
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        console.log("SESSION NO:",req.session.user);
        return res.redirect('/');  // Redirect to login page if not logged in
    }
    console.log("ELSE");
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
