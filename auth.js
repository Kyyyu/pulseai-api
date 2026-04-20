// ============================================================
// PulseAI API — /api/auth
// POST endpoint untuk register, login, logout, check session
// ============================================================

const crypto = require('crypto');

if (!global._pulse_users)    global._pulse_users    = [];
if (!global._pulse_sessions) global._pulse_sessions = {};

function hash(pass) {
  return crypto.createHash('sha256').update(pass + 'pulseai_2024_salt').digest('hex');
}

function genSession() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { action, name, email, password, confirm, session_id } = req.body || {};

  // ---- REGISTER ----
  if (action === 'register') {
    if (!name || !email || !password || !confirm)
      return res.json({ success: false, message: 'All fields are required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.json({ success: false, message: 'Invalid email.' });
    if (password.length < 8)
      return res.json({ success: false, message: 'Password must be at least 8 characters.' });
    if (password !== confirm)
      return res.json({ success: false, message: 'Passwords do not match.' });

    const exists = global._pulse_users.find(u => u.email === email.toLowerCase().trim());
    if (exists) return res.json({ success: false, message: 'Email already registered.' });

    global._pulse_users.push({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash(password),
      created_at: Date.now()
    });

    return res.json({ success: true, message: 'Account created successfully.' });
  }

  // ---- LOGIN ----
  if (action === 'login') {
    if (!email || !password)
      return res.json({ success: false, message: 'Email and password required.' });

    const user = global._pulse_users.find(
      u => u.email === email.toLowerCase().trim() && u.password === hash(password)
    );
    if (!user) return res.json({ success: false, message: 'Incorrect email or password.' });

    const sid = genSession();
    global._pulse_sessions[sid] = { name: user.name, email: user.email, created_at: Date.now() };

    return res.json({ success: true, name: user.name, email: user.email, session_id: sid });
  }

  // ---- LOGOUT ----
  if (action === 'logout') {
    if (session_id) delete global._pulse_sessions[session_id];
    return res.json({ success: true });
  }

  // ---- CHECK SESSION ----
  if (action === 'check') {
    if (!session_id || !global._pulse_sessions[session_id])
      return res.json({ success: false, message: 'Session invalid or expired.' });
    return res.json({ success: true, user: global._pulse_sessions[session_id] });
  }

  return res.status(400).json({ success: false, error: 'Unknown action.' });
};
