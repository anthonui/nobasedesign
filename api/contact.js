export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nobase Contact <onboarding@resend.dev>',
        to: 'demailanthony@gmail.com',
        reply_to: email,
        subject: `Nouveau message de ${name} via nobasedesign.com`,
        html: `
          <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #f0e0f8;">
            <div style="background: linear-gradient(135deg, #f36dd4, #c94fb8); padding: 28px 32px;">
              <h1 style="color: #fff; margin: 0; font-size: 1.3rem; font-weight: 700; letter-spacing: -0.02em;">Nouveau message reçu</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 0.88rem;">Via le formulaire de contact de nobasedesign.com</p>
            </div>
            <div style="padding: 28px 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f5edf9; width: 100px;">
                    <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #b06aab;">Nom</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f5edf9; font-size: 0.95rem; color: #2c2c3e; font-weight: 600;">
                    ${name}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f5edf9;">
                    <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #b06aab;">Email</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f5edf9; font-size: 0.95rem; color: #2c2c3e;">
                    <a href="mailto:${email}" style="color: #f36dd4; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 0 0; vertical-align: top;">
                    <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #b06aab;">Message</span>
                  </td>
                  <td style="padding: 14px 0 0; font-size: 0.95rem; color: #2c2c3e; line-height: 1.65;">
                    ${message.replace(/\n/g, '<br>')}
                  </td>
                </tr>
              </table>
              <div style="margin-top: 28px;">
                <a href="mailto:${email}?subject=Re: votre projet&body=Bonjour ${name},%0A%0A" style="display: inline-block; background: linear-gradient(135deg, #f36dd4, #c94fb8); color: #fff; padding: 12px 24px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 0.88rem; letter-spacing: 0.02em;">
                  Répondre à ${name}
                </a>
              </div>
            </div>
            <div style="padding: 16px 32px; background: #fdf5fc; border-top: 1px solid #f0e0f8;">
              <p style="margin: 0; font-size: 0.78rem; color: #b06aab;">Nobase · nobasedesign.com · Toulon, Var</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Erreur envoi email' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
