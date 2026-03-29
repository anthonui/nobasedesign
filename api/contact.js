// Rate limiting in-memory (catches rapid abuse within same serverless instance)
const rateLimit = new Map();
const RATE_WINDOW = 60 * 1000; // 1 minute
const RATE_MAX    = 3;          // 3 submissions max par IP par minute

function checkRate(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip) || { count: 0, resetAt: now + RATE_WINDOW };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + RATE_WINDOW; }
  entry.count++;
  rateLimit.set(ip, entry);
  // Nettoyage périodique
  if (rateLimit.size > 500) {
    for (const [k, v] of rateLimit) { if (now > v.resetAt) rateLimit.delete(k); }
  }
  return entry.count <= RATE_MAX;
}

// Échapper les caractères HTML pour éviter l'injection dans le template email
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Validation email (RFC 5322 simplifié)
function isValidEmail(email) {
  return /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(email);
}

export default async function handler(req, res) {
  // Preflight CORS
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // ── 1. Anti-bot honeypot ──
  const { name, email, message, projectType, website } = req.body || {};
  if (website) {
    // Bot détecté : on répond 200 pour ne pas lui révéler qu'il est bloqué
    return res.status(200).json({ success: true });
  }

  // ── 2. Rate limiting ──
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRate(ip)) {
    return res.status(429).json({ error: 'Trop de demandes, réessayez dans une minute.' });
  }

  // ── 3. Validation présence ──
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  }

  // ── 4. Limites de longueur ──
  if (name.length > 100)    return res.status(400).json({ error: 'Nom trop long.' });
  if (email.length > 254)   return res.status(400).json({ error: 'Email trop long.' });
  if (message.length > 5000) return res.status(400).json({ error: 'Message trop long (5000 caractères max).' });

  // ── 5. Validation format email ──
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }

  // ── 6. Sanitisation HTML ──
  const safeName    = escapeHtml(name.trim());
  const safeEmail   = escapeHtml(email.trim());
  const safeType    = projectType ? escapeHtml(String(projectType).trim()) : '';
  const safeMessage = escapeHtml(message.trim()).replace(/\n/g, '<br>');

  // ── 7. Vérification clé API ──
  const apiKey       = process.env.RESEND_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL;
  if (!apiKey || !contactEmail) {
    console.error('Variables d\'environnement manquantes');
    return res.status(500).json({ error: 'Erreur de configuration serveur.' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:     'Nobase <contact@nobasedesign.com>',
        to:       contactEmail,
        reply_to: safeEmail,
        subject:  `Nouveau message de ${safeName}${safeType ? ' (' + safeType + ')' : ''} via nobasedesign.com`,
        html: `
          <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f0e0f8;">
            <div style="background:linear-gradient(135deg,#f36dd4,#c94fb8);padding:28px 32px;">
              <h1 style="color:#fff;margin:0;font-size:1.3rem;font-weight:700;">Nouveau message reçu</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:0.88rem;">Via nobasedesign.com</p>
            </div>
            <div style="padding:28px 32px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f5edf9;width:100px;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#b06aab;">Nom</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f5edf9;font-size:0.95rem;color:#2c2c3e;font-weight:600;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f5edf9;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#b06aab;">Email</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f5edf9;font-size:0.95rem;color:#2c2c3e;"><a href="mailto:${safeEmail}" style="color:#f36dd4;text-decoration:none;">${safeEmail}</a></td>
                </tr>
                ${safeType ? `<tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f5edf9;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#b06aab;">Projet</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f5edf9;font-size:0.95rem;color:#2c2c3e;font-weight:600;"><span style="background:#fef5fc;color:#c94fb8;padding:4px 12px;border-radius:20px;font-size:0.82rem;">${safeType}</span></td>
                </tr>` : ''}
                <tr>
                  <td style="padding:14px 0 0;vertical-align:top;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#b06aab;">Message</td>
                  <td style="padding:14px 0 0;font-size:0.95rem;color:#2c2c3e;line-height:1.65;">${safeMessage}</td>
                </tr>
              </table>
              <div style="margin-top:28px;">
                <a href="mailto:${safeEmail}?subject=Re%3A%20votre%20projet" style="display:inline-block;background:linear-gradient(135deg,#f36dd4,#c94fb8);color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:700;font-size:0.88rem;">
                  Répondre à ${safeName}
                </a>
              </div>
            </div>
            <div style="padding:16px 32px;background:#fdf5fc;border-top:1px solid #f0e0f8;">
              <p style="margin:0;font-size:0.78rem;color:#b06aab;">Nobase · nobasedesign.com · Toulon, Var</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Erreur lors de l\'envoi.' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}
