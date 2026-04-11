# CLAUDE.md

Ce fichier guide Claude Code (claude.ai/code) pour travailler sur ce dépôt.

## Déploiement

- **Aucune étape de build.** Site statique déployé via **Vercel** avec auto-déploiement GitHub sur push vers `main`.
- Pour déployer : `git add <fichiers> && git commit -m "..." && git push origin main`
- Ne jamais pousser de fichiers non référencés (images, SVGs non utilisés dans index.html, etc.).

## Architecture

Site marketing one-page pour **Nobase**, agence web & mobile basée à Toulon, France (nobasedesign.com).

```
index.html          <- Frontend complet : HTML + CSS + JS dans un seul fichier (pas de framework)
admin.html          <- Panel admin protégé
api/
  contact.js        <- Fonction serverless Vercel : formulaire de contact (API Resend)
  admin-auth.js     <- Fonction serverless Vercel : auth admin (token HMAC, anti-brute-force)
vercel.json         <- Headers de sécurité + config CORS pour /api/*
sitemap.xml         <- Référence index.html et chene-dauge.html
robots.txt
favicon-32.png.png  <- Favicon officiel (logo rose sur fond rose)
```

### Structure de index.html (sections dans l'ordre)
Splash screen -> Navbar -> Hero -> Services -> Réalisations (cards) -> Tarifs -> Formulaire contact -> Footer

Tout le CSS et JS est inline dans `index.html`. Pas de feuille de style externe ni de bundler.

### API / Serverless
- `api/contact.js` : validation formulaire (honeypot, rate limiting 3 req/min/IP, échappement HTML), envoi email via Resend. Variables d'env requises : `RESEND_API_KEY`, `CONTACT_EMAIL`.
- `api/admin-auth.js` : auth par hash SHA-256 + token HMAC signé (expiration 8h). Variables d'env requises : `ADMIN_PASSWORD_HASH`, `ADMIN_TOKEN_SECRET`.

### SEO
- SEO local ciblant Toulon et les villes du Var 83 / région PACA.
- JSON-LD dans `<head>` : `LocalBusiness`, `Organization`, `WebSite`, `WebPage`, `Service`, `FAQPage`, `AggregateRating`.
- `sameAs` dans le JSON-LD pointe vers : Google Maps, Instagram (`nobase_design`), LinkedIn.
- Balises geo : `geo.region`, `geo.placename`, `geo.position`, `ICBM`.
- Garder tous les signaux SEO dans `<head>` et le footer uniquement, pas d'injection de mots-clés visible dans le body.

## Charte graphique

- **Couleurs principales :**
  - Rose : `#f36dd4` (--pink)
  - Teal : `#83abab` (--teal)
  - Jaune : `#fedc5a` (--yellow)
  - Sombre : `#2c2c3e` (--dark)
- **Polices :** Montserrat (titres, 800/900) et Nunito Sans (corps, 400/600), chargées depuis Google Fonts.
- **Tarifs :** Site vitrine dès 900 € HT, Application web dès 2 500 € HT, Application mobile dès 4 000 € HT.

## Règles de rédaction & copy

- **Ne jamais utiliser "—" (tiret em dash)** dans les textes visibles, meta descriptions, commentaires ou n'importe où dans le projet. Utiliser une virgule, deux-points ou reformuler.

## Conventions techniques

- **Modifier uniquement `index.html`** pour les changements front-end. Toujours faire `Read` avant d'éditer : le fichier est grand et se désynchronise facilement.
- **Hero :** fond photo `.webp` + overlay `linear-gradient`. Opacité desktop : `rgba(20,10,30,0.38)`. Opacité mobile (`max-width: 680px`) : `rgba(20,10,30,0.58)`.
- **Aurora hero :** 4 blobs animés (`.aurora-b1` à `.aurora-b4`) avec `mix-blend-mode: screen`. Opacités desktop : rose `0.43`, teal `0.61`, jaune `0.35`, rose bas `0.46`. Sur mobile les opacités sont drastiquement réduites (`0.06-0.08`) pour éviter un voile coloré.
- **Navbar :**
  - Glassmorphism avec `backdrop-filter: blur(44px)`.
  - Classe `.scrolled` ajoutée après 24px de scroll.
  - Classe `.nav-over-hero` ajoutée via `IntersectionObserver` tant que la nav chevauche le hero : textes et logo en blanc.
  - Classe `.nav-on-dark` gérée par détection de luminosité JS pour les autres sections sombres.
- **Logo SVG :** lettres en `fill="#f36dd4"` (rose). `.logo-dot` et `.logo-diag` ont une animation couleur CSS (`diag-color`, 6s). Sur hero : lettres passent en blanc via `#nav.nav-over-hero .logo-svg path:not(.logo-dot):not(.logo-diag)`.
- **Pills** (`.pill-pink`, `.pill-yellow`) : `text-shadow: none` intentionnel, ne pas ajouter de glow.
- **Animations :** classe `.rev` avec modificateurs de délai `d1`-`d4` pour révélation en scroll.
- **Favicon :** `favicon-32.png.png` (nom doublon conservé tel quel).
