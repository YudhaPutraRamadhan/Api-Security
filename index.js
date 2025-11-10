const express = require ('express');
const path = require('path');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./apikeys.db');
const crypto = require('crypto');
const port = 3000;

app.use(express.json());

db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/create', (req, res) => {
    const key = crypto.randomBytes(16).toString('hex');
    
    db.run(`INSERT INTO api_keys (key) VALUES (?)`, [key], function (err) {
        if (err) {
            console.error('Gagal menyimpan ke database:', err);
            return res.status(500).json({ message: 'Gagal menyimpan ke database' });
        }
        res.json({ apikey: key, message: 'API Key berhasil dibuat dan disimpan!' });
    });
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});

app.post('/valid', (req, res) => {
    const { key } = req.body;
    if (!key) {
        return res.status(400).json({ valid: false, message: 'Body JSON harus berisi field "apikey"' });
    }

    const row = db.prepare('SELECT * FROM apikeys WHERE key = ?');
    if (row) {
        return res.json({ valid: true, message: 'API Key valid dan terdaftar' });
    } else {
        return res.status(404).json({ valid: false, message: 'API Key tidak valid dan tidak terdaftar' });
    }
});