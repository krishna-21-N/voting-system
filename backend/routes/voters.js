const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyAdmin } = require('../middleware/auth');

// Admin: list the roster. Shows who HAS voted (for turnout tracking)
// but there is no column or join anywhere that reveals WHAT they
// voted for — that link does not exist in the database.
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, company_id, company_email, has_voted FROM voters ORDER BY full_name'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load voter roster' });
  }
});

// Admin: add an eligible voter to the roster
router.post('/', verifyAdmin, async (req, res) => {
  const { full_name, company_id, company_email } = req.body;
  if (!full_name || !company_id || !company_email) {
    return res.status(400).json({ message: 'Name, company ID, and company email are all required' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM voters WHERE company_id = ? OR company_email = ?',
      [company_id.trim(), company_email.trim().toLowerCase()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'That company ID or email is already on the roster' });
    }

    await pool.query(
      'INSERT INTO voters (full_name, company_id, company_email) VALUES (?, ?, ?)',
      [full_name.trim(), company_id.trim(), company_email.trim().toLowerCase()]
    );
    res.status(201).json({ message: 'Voter added to roster' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add voter' });
  }
});

// Admin: remove someone from the roster (e.g. added by mistake)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM voters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Voter removed from roster' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not remove voter' });
  }
});

module.exports = router;
