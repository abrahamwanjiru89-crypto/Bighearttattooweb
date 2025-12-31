const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create uploads directory if not exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Initialize SQLite database
const db = new sqlite3.Database('./bigheart.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Gallery table
    db.run(`CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        url TEXT NOT NULL,
        category TEXT DEFAULT 'tattoo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        size TEXT,
        placement TEXT,
        design TEXT,
        service_type TEXT DEFAULT 'tattoo',
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Notifications table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
}

// ========== API ROUTES ==========

// Upload image endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl, filename: req.file.filename });
});

// Gallery endpoints
app.get('/api/gallery', (req, res) => {
    const category = req.query.category;
    let query = 'SELECT * FROM gallery ORDER BY created_at DESC';
    let params = [];
    
    if (category) {
        query = 'SELECT * FROM gallery WHERE category = ? ORDER BY created_at DESC';
        params.push(category);
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/gallery', (req, res) => {
    const { title, description, url, category } = req.body;
    
    db.run('INSERT INTO gallery (title, description, url, category) VALUES (?, ?, ?, ?)',
        [title, description, url, category || 'tattoo'],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, title, description, url, category });
        });
});

app.delete('/api/gallery/:id', (req, res) => {
    const id = req.params.id;
    
    // First get the image URL to delete the file
    db.get('SELECT url FROM gallery WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (row && row.url) {
            const filePath = path.join(__dirname, 'public', row.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        // Delete from database
        db.run('DELETE FROM gallery WHERE id = ?', [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, deletedId: id });
        });
    });
});

// Bookings endpoints
app.get('/api/bookings', (req, res) => {
    db.all('SELECT * FROM bookings ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/bookings', (req, res) => {
    const { name, email, phone, date, time, size, placement, design, serviceType } = req.body;
    
    db.run(`INSERT INTO bookings (name, email, phone, date, time, size, placement, design, service_type) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, phone, date, time, size, placement, design, serviceType || 'tattoo'],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Add notification
            db.run('INSERT INTO notifications (type, title, message) VALUES (?, ?, ?)',
                ['booking', 'New Booking', `${name} booked a ${serviceType || 'tattoo'} session`]);
            
            res.json({ 
                id: this.lastID, 
                message: 'Booking submitted successfully',
                status: 'pending'
            });
        });
});

app.put('/api/bookings/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    
    db.run('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Add notification
            db.get('SELECT name FROM bookings WHERE id = ?', [id], (err, row) => {
                if (row) {
                    db.run('INSERT INTO notifications (type, title, message) VALUES (?, ?, ?)',
                        ['booking', 'Booking Updated', `${row.name}'s booking status changed to ${status}`]);
                }
            });
            
            res.json({ success: true, id, status });
        });
});

// Notifications endpoints
app.get('/api/notifications', (req, res) => {
    db.all('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.put('/api/notifications/:id/read', (req, res) => {
    const id = req.params.id;
    
    db.run('UPDATE notifications SET read = 1 WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, id });
    });
});

app.put('/api/notifications/read-all', (req, res) => {
    db.run('UPDATE notifications SET read = 1 WHERE read = 0', function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

// Admin authentication
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    // In production, use proper authentication with hashed passwords
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password === adminPassword) {
        res.json({ success: true, token: 'admin-token' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin access: http://localhost:${PORT}/admin.html`);
});