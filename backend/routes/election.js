const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyAdmin } = require('../middleware/auth');

function computeStatus(start, end, now) {
  if (!start || !end) return 'not_configured';
  if (now < new Date(start)) return 'not_started';
  if (now <= new Date(end)) return 'open';
  return 'closed';
}

// Public: current election title, window, and status
router.get('/', async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT title, start_time, end_time FROM election_settings WHERE id = 1');
    const now = new Date();
    const status = computeStatus(row.start_time, row.end_time, now);
    res.json({
      title: row.title,
      start_time: row.start_time,
      end_time: row.end_time,
      server_time: now.toISOString(),
      status
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load election settings' });
  }
});

// Admin: update title and/or voting window
router.put('/', verifyAdmin, async (req, res) => {
  const { title, start_time, end_time } = req.body;
  if (!title || !start_time || !end_time) {
    return res.status(400).json({ message: 'Title, start time, and end time are all required' });
  }
  if (new Date(end_time) <= new Date(start_time)) {
    return res.status(400).json({ message: 'End time must be after start time' });
  }

  try {
    await pool.query(
      'UPDATE election_settings SET title = ?, start_time = ?, end_time = ? WHERE id = 1',
      [title, new Date(start_time), new Date(end_time)]
    );
    res.json({ message: 'Election schedule updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update election settings' });
  }
});

module.exports = router;
