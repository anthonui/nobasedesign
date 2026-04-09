# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Deployment

- **No build step.** This is a static site deployed via **Vercel** with GitHub auto-deploy on push to `main`.
- To deploy: `git add <files> && git commit -m "..." && git push origin main`
- Never push unrelated files (images, SVGs not referenced by index.html, etc.).

## Architecture

Single-page marketing site for **Nobase**, a web/mobile dev agency based in Toulon, France (nobasedesign.com).

```
index.html          ← Entire frontend: HTML + CSS + JS in one file (no framework)
admin.html          ← Protected admin panel
api/
  contact.js        ← Vercel serverless function — contact form (Resend API)
  admin-auth.js     ← Vercel serverless function — admin login (HMAC token, anti-brute-force)
vercel.json         ← Security headers + CORS config for /api/*
sitemap.xml         ← References index.html and chene-dauge.html
robots.txt
```

### index.html structure (sections in order)
Splash screen → Navbar → Hero → Services → Réalisations (cards) → Pricing → Contact form → Footer

All CSS and JS live inline in `index.html`. There is no external stylesheet or bundler.

### API / Serverless
- `api/contact.js`: validates form input (honeypot, rate limiting 3 req/min/IP, HTML escaping), sends email via Resend. Requires env vars: `RESEND_API_KEY`, `CONTACT_EMAIL`.
- `api/admin-auth.js`: password auth via SHA-256 hash comparison + HMAC-signed token (8h expiry). Requires env vars: `ADMIN_PASSWORD_HASH`, `ADMIN_TOKEN_SECRET`.

### SEO
- Local SEO targeting Toulon and surrounding cities (Var 83 / PACA region).
- JSON-LD schema in `<head>`: `LocalBusiness`, `Organization`, `WebSite`, `WebPage`, `Service`, `FAQPage`, `AggregateRating`.
- Geo meta tags: `geo.region`, `geo.placename`, `geo.position`, `ICBM`.
- Keep all SEO signals in `<head>` and footer only — no visible keyword injection in the body.

## Writing & copy rules

- **Never use "—" (em dash) anywhere** — not in visible text, meta descriptions, comments, or anywhere else in the project. Use a comma, a colon, or rephrase instead.

## Key conventions

- **Edit `index.html` only** for front-end changes. Always `Read` the file before editing — it's large and drifts easily.
- The hero background is a `.webp` image with a `linear-gradient` overlay for darkness control. Adjust the overlay opacity (currently `0.45`) to change brightness.
- Pills (`.pill-pink`, `.pill-yellow`) have `text-shadow: none` intentionally — do not add glow to them.
- Fonts: **Montserrat** (headings) and **Nunito Sans** (body), loaded from Google Fonts.
- Animations use the `.rev` class with `d1`–`d4` delay modifiers for staggered reveal on scroll.
