const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Initialize Express app
const app = express();
const port = 3000;

// Use body-parser to parse JSON bodies into JS objects
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up PostgreSQL connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'astronomical_events',
    password: 'Your Postgres Sql Password',
    port: 5432
});

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Endpoint to get event information
app.get('/events/:id', async (req, res) => {
    const eventId = req.params.id;

    try {
        const result = await pool.query('SELECT description FROM events WHERE id = $1', [eventId]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Event not found' });
        }
    } catch (err) {
        console.error('Error fetching event:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Registration Route
app.post('/register', async (req, res) => {
    const { fullName, username, email, phoneNumber, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
  
    try {
        // Insert the new user into the database
        await pool.query(
            `INSERT INTO users (full_name, username, email, phone_number, password) 
             VALUES ($1, $2, $3, $4, $5)`,
            [fullName, username, email, phoneNumber, hashedPassword]
        );
        // Redirect to the login page after successful registration
        res.redirect('/login.html');
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Error registering user.');
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
        // Query the database for the user
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
  
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);
  
            if (isMatch) {
                // Redirect to the index page after successful login
                res.redirect('/index.html');
            } else {
                res.status(400).send('Invalid password.');
            }
        } else {
            res.status(400).send('User not found.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error logging in.');
    }
});

// Correct the route to fetch missions data
app.get('/fetch_missions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM missions');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching missions data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
