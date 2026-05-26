const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;

  if (!fullName || !email || !password || !confirmPassword)
    return res.status(400).json({ error: 'All fields are required' });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email format' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  if (password !== confirmPassword)
    return res.status(400).json({ error: 'Passwords do not match' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already exists' });

  const passwordHash = bcrypt.hashSync(password, 10);
  const id = uuidv4();

  db.prepare('INSERT INTO users (id, fullName, email, passwordHash) VALUES (?, ?, ?, ?)')
    .run(id, fullName.trim(), email.toLowerCase(), passwordHash);

  const token = jwt.sign({ id, fullName: fullName.trim(), email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    message: 'Account created successfully',
    token,
    user: { id, fullName: fullName.trim(), email: email.toLowerCase() }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: user.id, fullName: user.fullName, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, fullName: user.fullName, email: user.email }
  });
});

module.exports = router;
