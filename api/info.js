// ============================================================
// PulseAI API — /api/info
// GET endpoint — cek status API, tidak butuh auth
// ============================================================

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.json({
    success: true,
    name: 'PulseAI API',
    version: '1.0.0',
    status: 'online',
    model: process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free',
    provider: 'OpenRouter',
    endpoints: {
      'POST /api/chat':  'Send messages to AI',
      'POST /api/auth':  'Register, login, logout, check session',
      'GET  /api/info':  'API status and info'
    },
    auth_methods: [
      'Header: Authorization: Bearer YOUR_PULSE_API_KEY',
      'Body: { "api_key": "YOUR_PULSE_API_KEY" }'
    ],
    timestamp: new Date().toISOString()
  });
};
