const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

async function getElectionStatus(conn) {
  const [[row]] = await conn.query('SELECT start_time, end_time FROM election_settings WHERE id = 1');
  const now = new Date();
  if (!row.start_time || !row.end_time) return 'not_configured';
  if (now < new Date(row.start_time)) return 'not_started';
  if (now <= new Date(row.end_time)) return 'open';
  return 'closed';
}

// Cast a vote. The vote row stores ONLY candidate_id + timestamp —
// no voter_id at all, so the choice can never be traced back to a
// person. The voter row only ever records THAT they voted, via a
// row-locked transaction so a double-click can't double-count.
router.post('/', verifyToken, async (req, res) => {
  const { candidate_id } = req.body;
  const voterId = req.voter.id;
  if (!candidate_id) return res.status(400).json({ message: 'candidate_id is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const status = await getElectionStatus(conn);
    if (status !== 'open') {
      await conn.rollback();
      const messages = {
        not_configured: 'Voting has not been set up yet. Check back later.',
        not_started: 'Voting has not started yet.',
        closed: 'Voting has closed. Check the results page.'
      };
      return res.status(403).json({ message: messages[status] });
    }

    const [[voter]] = await conn.query('SELECT has_voted FROM voters WHERE id = ? FOR UPDATE', [voterId]);
    if (!voter) {
      await conn.rollback();
      return res.status(404).json({ message: 'Voter not found' });
    }
    if (voter.has_voted) {
      await conn.rollback();
      return res.status(409).json({ message: 'You have already voted' });
    }

    const [[candidate]] = await conn.query('SELECT id FROM candidates WHERE id = ?', [candidate_id]);
    if (!candidate) {
      await conn.rollback();
      return res.status(404).json({ message: 'Candidate not found' });
    }

    await conn.query('INSERT INTO votes (candidate_id) VALUES (?)', [candidate_id]);
    await conn.query('UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?', [candidate_id]);
    await conn.query('UPDATE voters SET has_voted = TRUE WHERE id = ?', [voterId]);

    await conn.commit();
    res.json({ message: 'Vote cast successfully' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error while casting vote' });
  } finally {
    conn.release();
  }
});

// Check whether the logged-in voter has already voted
router.get('/status', verifyToken, async (req, res) => {
  try {
    const [[voter]] = await pool.query('SELECT has_voted FROM voters WHERE id = ?', [req.voter.id]);
    if (!voter) return res.status(404).json({ message: 'Voter not found' });
    res.json({ has_voted: !!voter.has_voted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not check voting status' });
  }
});

module.exports = router;
