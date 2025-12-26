const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// In-memory storage (will persist during serverless function lifetime)
// For production, use a database like PostgreSQL, MongoDB, or Redis
let leaderboardData = {
    'Kent': 0,
    'Rain': 0,
    'Dos': 0,
    'Khayie': 0,
    'Shane': 0,
    'Clyde Y': 0,
    'Anagen': 0,
    'Clyde C': 0,
    'Eve': 0,
    'JL': 0,
    'James': 0,
    'Clark': 0,
    'Star': 0,
    'Coco': 0,
    'Japh': 0,
    'JM': 0,
    'Sol': 0,
    'Harvey': 0
};

// Get all leaderboard data
app.get('/api/leaderboard', (req, res) => {
    res.json(leaderboardData);
});

// Increment bounce count for a specific colleague
app.post('/api/bounce', (req, res) => {
    const { name } = req.body;
    
    if (leaderboardData.hasOwnProperty(name)) {
        leaderboardData[name]++;
        res.json({ 
            success: true, 
            name, 
            bounces: leaderboardData[name] 
        });
    } else {
        res.status(404).json({ 
            success: false, 
            message: 'Colleague not found' 
        });
    }
});

// Reset leaderboard (optional - for testing)
app.post('/api/reset', (req, res) => {
    Object.keys(leaderboardData).forEach(key => {
        leaderboardData[key] = 0;
    });
    res.json({ success: true, message: 'Leaderboard reset' });
});

// Export for Vercel serverless
module.exports = app;