const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database table
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS colleagues (
                name VARCHAR(50) PRIMARY KEY,
                bounces INTEGER DEFAULT 0,
                wins INTEGER DEFAULT 0
            )
        `);

        // Insert initial colleagues if they don't exist
        const colleagues = [
            'Kent', 'Rain', 'Dos', 'Khayie', 'Shane', 'Clyde Y',
            'Anagen', 'Clyde C', 'Eve', 'JL', 'James', 'Clark',
            'Star', 'Coco', 'Japh', 'JM', 'Sol', 'Harvey'
        ];

        for (const name of colleagues) {
            await pool.query(
                `INSERT INTO colleagues (name, bounces, wins) 
                 VALUES ($1, 0, 0) 
                 ON CONFLICT (name) DO NOTHING`,
                [name]
            );
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
};

initDB();

// Get all leaderboard data
app.get('/api/leaderboard', async (req, res) => {
    try {
        const result = await pool.query('SELECT name, bounces, wins FROM colleagues ORDER BY bounces DESC');
        
        const data = {};
        result.rows.forEach(row => {
            data[row.name] = {
                bounces: row.bounces,
                wins: row.wins
            };
        });
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Increment bounce count for a specific colleague
app.post('/api/bounce', async (req, res) => {
    const { name } = req.body;
    
    try {
        // Increment bounce count
        const result = await pool.query(
            `UPDATE colleagues 
             SET bounces = bounces + 1 
             WHERE name = $1 
             RETURNING name, bounces, wins`,
            [name]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Colleague not found' 
            });
        }

        const colleague = result.rows[0];

        // Check if they reached 999 bounces (winner!)
        if (colleague.bounces >= 999) {
            // Increment wins and reset ALL bounces to 0
            await pool.query(
                `UPDATE colleagues 
                 SET wins = wins + 1 
                 WHERE name = $1`,
                [name]
            );

            await pool.query('UPDATE colleagues SET bounces = 0');

            return res.json({
                success: true,
                name,
                bounces: 0,
                wins: colleague.wins + 1,
                winner: true
            });
        }

        res.json({ 
            success: true, 
            name, 
            bounces: colleague.bounces,
            wins: colleague.wins
        });
    } catch (error) {
        console.error('Error incrementing bounce:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Reset leaderboard (for testing)
app.post('/api/reset', async (req, res) => {
    try {
        await pool.query('UPDATE colleagues SET bounces = 0, wins = 0');
        res.json({ success: true, message: 'Leaderboard reset' });
    } catch (error) {
        console.error('Error resetting leaderboard:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;