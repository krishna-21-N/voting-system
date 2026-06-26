const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Voter login — no password. A voter is already on the pre-loaded
// roster (added by the admin), so logging in is just proving you
// are who the roster says you are: company ID + company email must
// both match the same record.
router.post('/login', async (req, res) => {
  const { company_id, company_email } = req.body;
  if (!company_id || !company_email) {
    return res.status(400).json({ message: 'Company ID and company email are required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, has_voted FROM voters WHERE company_id = ? AND company_email = ?',
      [company_id.trim(), company_email.trim().toLowerCase()]
    );
    if (rows.length === 0) {
      return res.status(401).json({
        message: 'No match found for that ID and email. Check your details or contact the election admin.'
      });
    }

    const voter = rows[0];
    const token = jwt.sign({ id: voter.id }, process.env.JWT_SECRET, { expiresIn: '4h' });
    res.json({ token, has_voted: !!voter.has_voted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });

  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid admin credentials' });

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: 'Invalid admin credentials' });

    const token = jwt.sign(
      { id: admin.id, username: admin.username, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );
    res.json({ token, username: admin.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

module.exports = router;
