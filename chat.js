// ============================================================
// PulseAI API — /api/chat
// POST endpoint untuk kirim pesan ke AI
// ============================================================

if (!global._pulse_sessions) global._pulse_sessions = {};

const SYSTEM_PROMPT = `You are PulseAI, an intelligent and helpful assistant. You are thoughtful, concise, and always aim to provide accurate and useful responses. You speak naturally and clearly. You do not promote harmful, illegal, or unethical content. You assist with questions, ideas, writing, coding, analysis, and general knowledge. Always maintain a respectful and professional tone while being friendly and approachable.`;

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  // Auth via API key header atau body
  const authHeader = req.headers['authorization'] || '';
  const bodyKey    = req.body?.api_key || '';
  const apiKey     = authHeader.replace('Bearer ', '').trim() || bodyKey;

  const PULSE_API_KEY = process.env.PULSE_API_KEY;
  if (!PULSE_API_KEY || apiKey !== PULSE_API_KEY) {
    return res.status(401).json({ success: false, error: 'Invalid or missing API key.' });
  }

  const { messages, session_id, system_prompt } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, error: 'messages array is required.' });
  }

  // Sanitasi messages
  const clean = messages
    .filter(m => m.role && m.content && ['user', 'assistant'].includes(m.role))
    .slice(-20)
    .map(m => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

  if (clean.length === 0) {
    return res.status(400).json({ success: false, error: 'No valid messages found.' });
  }

  // Gunakan custom system prompt jika dikirim, atau pakai default
  const sysPrompt = system_prompt ? String(system_prompt).slice(0, 2000) : SYSTEM_PROMPT;

  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
  const MODEL          = process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';

  if (!OPENROUTER_KEY) {
    return res.status(500).json({ success: false, error: 'Server not configured.' });
  }

  try {
    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': req.headers.origin || 'https://pulseai.vercel.app',
        'X-Title': 'PulseAI'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        temperature: 0.7,
        messages: [{ role: 'system', content: sysPrompt }, ...clean]
      })
    });

    const data = await orRes.json();

    if (!orRes.ok) {
      return res.status(orRes.status).json({ success: false, error: data.error?.message || 'ada kendala sedikit error' });
    }

    const reply = data.choices?.[0]?.message?.content || '';

    return res.json({
      success: true,
      reply,
      model: data.model || MODEL,
      usage: data.usage || null,
      session_id: session_id || null
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Connection failed: ' + err.message });
  }
};
