const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { verifyAdmin } = require('../middleware/auth');
const upload = require('../config/upload');

// Public: candidates for the ballot
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, department, slogan, photo_path FROM candidates ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load candidates' });
  }
});

// Public: results — candidate name + vote count + total only.
// Deliberately never joins against voters, so no voter identity
// can ever appear here.
router.get('/results', async (req, res) => {
  try {
    const [candidates] = await pool.query(
      'SELECT id, name, department, photo_path, vote_count FROM candidates ORDER BY vote_count DESC'
    );
    const [[{ total_votes }]] = await pool.query('SELECT COUNT(*) AS total_votes FROM votes');
    const [[{ total_voters }]] = await pool.query('SELECT COUNT(*) AS total_voters FROM voters');
    res.json({ candidates, total_votes, total_voters });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load results' });
  }
});

// Admin: add a candidate, optionally with a photo
router.post('/', verifyAdmin, upload.single('photo'), async (req, res) => {
  const { name, department, slogan } = req.body;
  if (!name) return res.status(400).json({ message: 'Candidate name is required' });

  const photo_path = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await pool.query(
      'INSERT INTO candidates (name, department, slogan, photo_path) VALUES (?, ?, ?, ?)',
      [name, department || '', slogan || '', photo_path]
    );
    res.status(201).json({ message: 'Candidate added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add candidate' });
  }
});

// Admin: remove a candidate (and its photo file, if any)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const [[candidate]] = await pool.query('SELECT photo_path FROM candidates WHERE id = ?', [req.params.id]);
    await pool.query('DELETE FROM candidates WHERE id = ?', [req.params.id]);

    if (candidate && candidate.photo_path) {
      const filePath = path.join(__dirname, '..', candidate.photo_path);
      fs.unlink(filePath, () => {}); // best-effort cleanup, ignore errors
    }
    res.json({ message: 'Candidate removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not remove candidate (it may already have votes)' });
  }
});

module.exports = router;
