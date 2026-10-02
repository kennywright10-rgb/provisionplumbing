// Vercel serverless function: POST /api/contact
// Sends the homepage lead form to the business by email via Resend (https://resend.com).
// Required env vars (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   your Resend API key
//   CONTACT_TO       where leads go, e.g. provisionplumbingsvc@gmail.com
// Optional:
//   CONTACT_FROM     verified sender, e.g. "Provision Plumbing <leads@yourdomain.com>"
//                    (defaults to Resend's onboarding sender, fine for testing)

const esc = (s) =>
  String(s || '')
    .slice(0, 2000)
    .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { name, phone, email, city, service, message, company } = body;

  // Honeypot: bots fill the hidden "company" field. Pretend success.
  if (company) return res.status(200).json({ ok: true });

  if (!name || !phone || String(phone).replace(/\D/g, '').length < 10) {
    return res.status(400).json({ ok: false, error: 'Name and phone are required.' });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO || 'provisionplumbingsvc@gmail.com';
  const from = process.env.CONTACT_FROM || 'Provision Plumbing Website <onboarding@resend.dev>';

  if (!key) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ ok: false, error: 'Email not configured' });
  }

  const html = `
    <h2 style="font-family:Arial,sans-serif">New estimate request — provisionplumbing website</h2>
    <table cellpadding="6" style="font-family:Arial,sans-serif;font-size:15px;border-collapse:collapse">
      <tr><td><b>Name</b></td><td>${esc(name)}</td></tr>
      <tr><td><b>Phone</b></td><td><a href="tel:${esc(phone)}">${esc(phone)}</a></td></tr>
      <tr><td><b>Email</b></td><td>${esc(email) || '—'}</td></tr>
      <tr><td><b>City</b></td><td>${esc(city)}</td></tr>
      <tr><td><b>Service</b></td><td>${esc(service)}</td></tr>
      <tr><td valign="top"><b>Details</b></td><td>${esc(message).replace(/\n/g, '<br>') || '—'}</td></tr>
    </table>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: to.split(',').map((s) => s.trim()),
        reply_to: email || undefined,
        subject: `New lead: ${String(service || 'Plumbing').slice(0, 60)} — ${String(name).slice(0, 60)} (${String(city || '').slice(0, 40)})`,
        html,
      }),
    });
    if (!r.ok) {
      console.error('Resend error', r.status, await r.text());
      return res.status(502).json({ ok: false, error: 'Send failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Send failed' });
  }
};
