import crypto from 'crypto';

// Tentatives échouées par IP (anti-brute force)
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function isLocked(ip) {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.lockedUntil) { attempts.delete(ip); return false; }
  return entry.count >= MAX_ATTEMPTS;
}

function recordAttempt(ip, success) {
  if (success) { attempts.delete(ip); return; }
  const entry = attempts.get(ip) || { count: 0, lockedUntil: 0 };
  entry.count++;
  if (entry.count >= MAX_ATTEMPTS) entry.lockedUntil = Date.now() + LOCKOUT_DURATION;
  attempts.set(ip, entry);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

  if (isLocked(ip)) {
    // Délai pour pénaliser les attaques
    await new Promise(r => setTimeout(r, 1000));
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' });
  }

  const { password } = req.body || {};
  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  const tokenSecret = process.env.ADMIN_TOKEN_SECRET;

  if (!storedHash || !tokenSecret) {
    return res.status(500).json({ error: 'Configuration manquante.' });
  }

  // Délai fixe pour éviter les timing attacks
  await new Promise(r => setTimeout(r, 400));

  const submittedHash = crypto.createHash('sha256').update(String(password || '')).digest('hex');

  if (submittedHash !== storedHash) {
    recordAttempt(ip, false);
    return res.status(401).json({ error: 'Mot de passe incorrect.' });
  }

  recordAttempt(ip, true);

  // Token HMAC signé, valide 8h
  const expiry = Date.now() + 8 * 60 * 60 * 1000;
  const payload = `nb_admin:${expiry}`;
  const sig = crypto.createHmac('sha256', tokenSecret).update(payload).digest('hex');

  return res.status(200).json({ token: `${payload}.${sig}` });
}
