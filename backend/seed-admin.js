// Run once after setting up the database: npm run seed-admin
// Creates an admin login -> username: admin | password: admin123
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function seedAdmin() {
  const username = 'admin';
  const password = 'admin123';

  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO admins (username, password) VALUES (?, ?)', [username, hashed]);
    console.log('Admin account created.');
    console.log('  username: admin');
    console.log('  password: admin123');
    console.log('Change this password before running a real election.');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('An admin named "admin" already exists — nothing to do.');
    } else {
      console.error('Could not create admin:', err.message);
    }
  } finally {
    process.exit();
  }
}

seedAdmin();
