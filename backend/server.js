require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const electionRoutes = require('./routes/election');
const candidateRoutes = require('./routes/candidates');
const voterRoutes = require('./routes/voters');
const voteRoutes = require('./routes/vote');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/election', electionRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/vote', voteRoutes);

// Uploaded candidate photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer errors (bad file type / too large) land here instead of crashing
app.use((err, req, res, next) => {
  if (err && err.message) return res.status(400).json({ message: err.message });
  next(err);
});

// Serve the vanilla HTML/CSS/JS frontend from the same server
app.use(express.static(path.join(__dirname, '../frontend')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Voting system server running at http://localhost:${PORT}`);
});
