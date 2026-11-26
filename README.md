# augustefoucard.fr — Portfolio

Site de **Auguste Foucard** : Game Designer · Sound Designer · Music Composer.

React 19 · Vite · TypeScript · Motion · Cloudflare Pages (+ Pages Functions pour le formulaire).
Versions française (`/`) et anglaise (`/en/...`).

> ⚠️ **Contenus temporaires** : tout ce qui porte le badge violet « Contenu temporaire » / « Visuel à venir »
> est à remplacer. Les musiques et sons actuels sont des **démos générées** pour tester le lecteur.
> Rien n'a été inventé sur ton parcours : les champs inconnus sont marqués « À compléter » ou « À préciser ».

---

## 1. Lancer le site sur ton ordinateur

Prérequis : [Node.js 20+](https://nodejs.org).

```bash
npm install
npm run dev          # http://localhost:5173 (ajoute --host pour le tester sur ton iPhone en Wi-Fi)
```

Autres commandes :

| Commande | Rôle |
|---|---|
| `npm run build` | Build de production dans `dist/` (vérifie aussi les types et régénère le sitemap) |
| `npm run preview` | Sert le build localement |
| `npm run typecheck` | Vérifie le code et la forme des fichiers de contenu |
| `npm run audio:demo` | Régénère les sons de démonstration (nécessite ffmpeg) |
| `npm run build:single` | Génère un fichier HTML unique autonome (aperçu hors ligne) dans `dist-single/` |

---

## 2. Modifier tes contenus

**Tout est dans `src/content/`.** Tu n'as pas besoin de toucher aux composants.

| Fichier | Contenu |
|---|---|
| `site.json` | Nom, rôles, phrase d'accroche, showreel, e-mail public, CV, réseaux, « univers » de l'accueil |
| `games.json` | Jeux vidéo (galerie + pages détaillées) |
| `archives.json` | Anciens projets, jams, prototypes… (frise chronologique) |
| `music.json` | Pistes et playlists |
| `sound.json` | Sons, comparaisons avec/sans sound design, vidéos |
| `lab.json` | Expérimentations du LAB |
| `about.json` | Présentation, parcours, formations, expériences, compétences, logiciels, philosophie |

Les textes bilingues s'écrivent `{ "fr": "…", "en": "…" }`. Si `en` est vide, le français s'affiche.
Retire `"placeholder": true` d'un élément quand il est définitif : le badge disparaît.

Les fichiers médias vont dans `public/media/` et se référencent avec un chemin commençant par `/media/…`.

### Ajouter un jeu

1. Dépose les fichiers : `public/media/games/mon-jeu/cover.webp`, `public/media/games/mon-jeu/gameplay.mp4`.
2. Ajoute une entrée dans `games.json` (copie une entrée existante) :

```json
{
  "slug": "mon-jeu",
  "title": "Mon Jeu",
  "featured": true,
  "accent": "#8b5cf6",
  "genre": { "fr": "Plateformes", "en": "Platformer" },
  "year": 2026,
  "role": { "fr": "Game Designer, Sound Designer", "en": "Game Designer, Sound Designer" },
  "status": "released",
  "cover": "/media/games/mon-jeu/cover.webp",
  "video": "/media/games/mon-jeu/gameplay.mp4",
  "summary": { "fr": "…", "en": "…" },
  "concept": { "fr": "…", "en": "…" },
  "mechanics": [{ "fr": "…", "en": "…" }],
  "intentions": { "fr": "…", "en": "…" },
  "work": [{ "fr": "…", "en": "…" }],
  "gallery": [{ "src": "/media/games/mon-jeu/shot-1.webp", "alt": { "fr": "…", "en": "…" } }],
  "play": { "type": "embed", "url": "https://…/index.html", "aspect": "16/9", "orientation": "landscape" },
  "links": [{ "label": { "fr": "Page itch.io", "en": "itch.io page" }, "url": "https://…" }]
}
```

- `status` : `released`, `in-development`, `prototype` ou `paused`.
- `featured: true` → affiché sur l'accueil.
- `play` : `"embed"` intègre un jeu web jouable (chargé seulement au clic, avec bouton plein écran — plein écran simulé sur iPhone) ; `"external"` ouvre un lien. `null` si pas de version jouable.
- **Jeux web hébergés sur ton site** : place le build (Phaser, Unity WebGL, Godot…) dans `public/play/mon-jeu/` et mets `"url": "/play/mon-jeu/index.html"`. Pour Unity WebGL, active la compression Brotli ou Gzip *avec* « Decompression Fallback ».
- Vidéo de gameplay : courte (10–20 s), **muette**, en boucle, ~1280 px de large, < 4 Mo.

### Ajouter une musique

Dépose `public/media/music/mon-titre.mp3` puis ajoute dans `music.json → tracks` :

```json
{ "id": "mon-titre", "title": "Mon Titre", "src": "/media/music/mon-titre.mp3", "cover": "/media/music/mon-titre.webp", "genre": "Orchestral", "year": 2026, "context": { "fr": "BO de …", "en": "OST for …" }, "accent": "#a78bfa" }
```

Ajoute ensuite son `id` dans une ou plusieurs `playlists`. Les filtres par genre se créent tout seuls.
Formats conseillés : MP3 192–256 kb/s ou AAC (.m4a). Les formes d'onde sont calculées automatiquement.

### Ajouter un son (Sound Design)

`sound.json → items` : `category` = `sfx`, `ambience`, `ui`, `feedback` ou `combat`.
Comparaisons avec/sans : `media` = `"video"` (deux vidéos de même durée, synchronisées) ou `"audio"`.
Vidéos : `src` (fichier mp4) **ou** `embed` (URL d'intégration YouTube `https://www.youtube-nocookie.com/embed/ID`).

### Ajouter un projet aux archives

`archives.json` : `kind` = `game`, `student`, `jam`, `prototype`, `video` ou `experimental`. Le tri par année est automatique.

### AURA (jeu sensoriel intégré au site)

AURA est un jeu web autonome (aucune dépendance, aucun build) dans `public/play/aura/`. Il est publié dans
« Mes créations » via l'entrée `aura` de `games.json` (catégories Expérimentations et Jeux mobiles) et
s'ouvre aussi seul sur `/play/aura/`, où il s'installe sur l'iPhone (Partager → Sur l'écran d'accueil) et fonctionne hors connexion.

| Fichier | Rôle |
|---|---|
| `js/economy.js` | Formes et niveaux de déblocage, pouvoirs, harmonies, arbre d'évolution, coûts, courbe de niveaux |
| `js/shapes.js` | Reconnaissance (très permissive) des formes dessinées |
| `js/creations.js` · `js/reactions.js` | Animation de chaque forme · effets des harmonies |
| `js/powers.js` | Feux d'artifice, eau, magnétisme (le kaléidoscope est dans `main.js`) |
| `js/universe.js` | Univers persistant : étoiles, fleurs, galaxies, nébuleuse |
| `js/audio.js` | Son 100 % synthétisé (gamme pentatonique, nappes, réverbération) |
| `js/i18n.js` | Textes FR / EN |

- Après une modification, incrémente `CACHE` dans `public/play/aura/sw.js` (`aura-v2`, …) pour que les joueurs hors ligne reçoivent la mise à jour.
- La progression est sauvegardée dans le navigateur du joueur (`localStorage`, clé `aura.save.v1`).
- Captures et tests : `/play/aura/?demo=30&up=5` lance une démo sans sauvegarde (niveau 30, améliorations au niveau 5, formes qui se dessinent seules ;
  ajoute `&still` pour dessiner soi-même, `&clean` pour masquer l'interface).

### Ajouter une expérimentation au LAB

- Texte simple ou prototype web : entrée dans `lab.json`, avec `embed` pour une URL à intégrer.
- Expérience interactive codée dans le site : crée `src/lab/MonExperience.tsx`, référence-la dans `src/lab/registry.ts`, puis mets `"interactive": "mon-experience"` dans `lab.json`. Voir `src/lab/VoiceMove.tsx` (déplacement à la voix) comme modèle.

### Photo, CV, showreel, réseaux

- Photo : `public/media/about/photo.webp` → `"photo": "/media/about/photo.webp"` dans `about.json`.
- CV : `public/cv/auguste-foucard-cv-fr.pdf` → `"cv": { "fr": "/cv/auguste-foucard-cv-fr.pdf", "en": "/cv/…-en.pdf" }` dans `site.json`.
- Showreel d'accueil : `"showreel": { "src": "/media/video/showreel.mp4", "poster": "/media/video/showreel.webp" }`. La vidéo est toujours **muette**, et ne se lance pas si l'utilisateur préfère réduire les animations ou économiser ses données.
- Réseaux : renseigne les `url` dans `site.json → socials` (les entrées sans URL s'affichent « bientôt »).
- E-mail public : `site.json → email` (laisse `null` pour ne pas l'afficher ; le formulaire suffit).

### Images et vidéos : compression

- Images : **WebP** (ou AVIF), 1600–2000 px de large max pour les grandes illustrations, ~200–400 Ko.
  Avec ffmpeg : `ffmpeg -i cover.png -vf scale=1920:-1 -q:v 80 cover.webp`
- Vidéos : `ffmpeg -i in.mov -vf scale=1280:-2 -c:v libx264 -crf 26 -preset slow -an -movflags +faststart out.mp4`
  (`-an` retire le son pour les vidéos d'aperçu).
- Remplace aussi `public/og-image.png` (image de partage 1200×630) et `public/apple-touch-icon.png`.

---

## 3. Publier en ligne (GitHub + Cloudflare Pages)

### a) Mettre le code sur GitHub

```bash
git init
git add .
git commit -m "Portfolio v0.1"
git branch -M main
git remote add origin https://github.com/<ton-compte>/augustefoucard.git
git push -u origin main
```

### b) Créer le projet Cloudflare Pages

1. Crée un compte gratuit sur [dash.cloudflare.com](https://dash.cloudflare.com).
2. **Workers & Pages → Create → Pages → Connect to Git** → choisis ton dépôt.
3. Réglages de build :
   - Framework preset : **Vite** (ou None)
   - Build command : `npm run build`
   - Build output directory : `dist`
   - Variable d'environnement : `NODE_VERSION` = `22`
4. Deploy. Le site est en ligne sur `https://<projet>.pages.dev`.
   Chaque `git push` redéploie automatiquement ; chaque branche a son URL de prévisualisation.

Le dossier `functions/` est détecté automatiquement : `/api/contact` devient une fonction serveur.
Le routage des pages (`/games/...`, `/en/...`) fonctionne sans configuration : Cloudflare Pages sert
`index.html` pour les chemins inconnus tant qu'il n'y a pas de `404.html` à la racine.

### c) Activer le formulaire de contact

Le formulaire utilise **Cloudflare Turnstile** (anti-spam, sans cookies publicitaires) et **Resend** (envoi des e-mails).

1. **Turnstile** : Cloudflare → Turnstile → Add widget → domaine `augustefoucard.fr` (+ ton `*.pages.dev`).
   Tu obtiens une *site key* (publique) et une *secret key*.
2. **Resend** : crée un compte sur [resend.com](https://resend.com), ajoute le domaine `augustefoucard.fr`
   et ajoute les enregistrements DNS demandés (dans Cloudflare une fois le domaine connecté, voir §4). Crée une clé API.
3. Dans **Pages → ton projet → Settings → Variables and Secrets** (Production) :

| Nom | Type | Valeur |
|---|---|---|
| `VITE_TURNSTILE_SITE_KEY` | Variable (build) | la site key Turnstile |
| `TURNSTILE_SECRET_KEY` | Secret | la secret key Turnstile |
| `RESEND_API_KEY` | Secret | la clé API Resend |
| `CONTACT_TO` | Variable | ton adresse de réception |
| `CONTACT_FROM` | Variable | `Portfolio <contact@augustefoucard.fr>` |

4. Redéploie (Deployments → Retry deployment). Tant que ces variables manquent, le formulaire affiche
   honnêtement « pas encore relié au service d'envoi » au lieu de faire semblant d'envoyer.

Tester la fonction en local : copie `.dev.vars.example` en `.dev.vars`, puis
`npm run build && npx wrangler pages dev dist`.

---

## 4. Connecter ton domaine LWS

Pour utiliser `augustefoucard.fr` (sans `www`) sur Cloudflare Pages, Cloudflare doit gérer le DNS du domaine.
Le domaine **reste acheté chez LWS** : on change seulement ses serveurs DNS.

1. **Cloudflare** → *Add a domain* (ou *Onboard a domain*) → `augustefoucard.fr` → plan **Free**.
   Cloudflare importe les enregistrements DNS existants. **Vérifie qu'il a bien repris les MX** si tu as
   une boîte e-mail chez LWS, sinon recopie-les depuis l'espace LWS.
2. Cloudflare t'indique **deux serveurs de noms** (ex. `xxx.ns.cloudflare.com`).
3. **Espace client LWS** → *Mes domaines* → `augustefoucard.fr` → **Serveurs DNS** → choisis des serveurs
   personnalisés et remplace ceux de LWS par les deux de Cloudflare. Désactive DNSSEC chez LWS avant
   le changement s'il est actif (tu pourras le réactiver ensuite depuis Cloudflare).
4. Attends la propagation (quelques minutes à 24 h ; jusqu'à 48 h). Cloudflare t'envoie un e-mail quand le domaine est actif.
5. **Pages → ton projet → Custom domains → Set up a custom domain** → `augustefoucard.fr`, puis recommence
   avec `www.augustefoucard.fr`. Cloudflare crée les enregistrements et le certificat HTTPS tout seul.
6. Redirige `www` vers la version sans `www` : *Rules → Redirect Rules* → `www.augustefoucard.fr/*`
   → `https://augustefoucard.fr/${1}` (301).

Si le domaine est « en cours de configuration » chez LWS, attends que son statut soit actif avant l'étape 3.

---

## 5. Architecture

```
src/
  content/        ← TES CONTENUS (JSON) + types
  i18n/           textes d'interface FR/EN, détection de langue par l'URL
  components/     en-tête, menu, cartes, forme d'onde, lecteur persistant (player/)…
  pages/          une page par rubrique
  lab/            expériences interactives du LAB + registre
  styles/         design system (couleurs, typographie, espacements)
functions/api/    formulaire de contact (Cloudflare Pages Function)
public/           médias, favicon, robots.txt, sitemap.xml, _headers
scripts/          sitemap, sons de démonstration
docs/ADMIN.md     plan pour l'interface d'administration sécurisée
```

**Choix notables**
- Le lecteur musical est monté au-dessus des routes : la musique continue d'une page à l'autre.
  Aucune lecture automatique ; sur iPhone le volume est géré par les boutons du téléphone (limitation iOS),
  donc le curseur de volume n'y est pas affiché. Commandes de l'écran verrouillé via Media Session.
- `prefers-reduced-motion` est respecté partout (Motion `reducedMotion="user"` + CSS).
- Effets magnétiques, inclinaisons et lumières de survol uniquement à la souris ; sur tactile, les vidéos
  d'aperçu se lancent quand la carte est bien visible.
- Pages chargées à la demande (code splitting), polices auto-hébergées, iframes de jeux chargées au clic.
- SEO : titre, description, `canonical` et `hreflang` FR/EN par page, sitemap généré à chaque build,
  données structurées `Person`. Piste d'amélioration future : pré-rendu statique des pages (SSG) pour
  que les moteurs reçoivent le HTML complet sans exécuter le JavaScript.

## 6. Administration

Voir [`docs/ADMIN.md`](docs/ADMIN.md) : CMS basé sur Git, connexion GitHub OAuth, et Cloudflare Access.
Aucune fausse authentification côté navigateur n'a été mise en place.

---

## Mise à jour V2 — « Ciel vivant »

- **Ciel étoilé** (`src/components/Sky.tsx`, `src/lib/sky.ts`) : canvas fixe, étoiles scintillantes, étoiles filantes rares, nébuleuse très douce, poussières de lumière, parallaxe. Trois niveaux de qualité choisis selon l'appareil (cœurs, mémoire, économie de données) et **réduits automatiquement si la fluidité baisse**. Avec « réduire les animations » : ciel statique.
- **Typographie** : Cormorant Garamond (auto-hébergée, `@fontsource`) pour la voix éditoriale, Archivo pour le reste.
- **Musique réactive** : analyseur audio en temps réel (non disponible sur iPhone, où un repli synthétique est utilisé), fondus entre morceaux, halo du lecteur qui respire (`--energy`), mini-visualiseur.
- **Mode contemplatif** (`Contemplate.tsx`) : bouton lune dans le lecteur ; le site s'efface, il reste le ciel, la pochette et sa couronne lumineuse. `Échap` pour quitter.
- **Lumière du curseur** et **étincelles** au clic (appareils à pointeur précis / légères sur mobile).
- Couleur d'ambiance par jeu : champ `accent` dans `games.json`.


---

## Refonte artistique V3 — « Le calme avant les mondes »

- **Navigation** : trois entrées seulement (Créations, À propos, Contact). Musique, Sound Design, Archives et Laboratoire restent accessibles (menu, pied de page) mais discrets ; leurs contenus sont conservés. Une petite note ♪ dans l'en-tête lance la musique, uniquement au clic.
- **Accueil** : nom, métier, phrase, un bouton. Rien d'autre. Textes dans `src/i18n/ui.ts` (`home.*`).
- **Galerie** (`/games`) : grandes illustrations en compositions asymétriques, zoom lent au survol, vidéo de gameplay au survol si `video` est renseigné.
- **Filtres** : Tous / Jeux à impact / RPG & Aventure / Jeux mobiles / Expérimentations. Dans `src/content/games.json`, le champ `categories` d'un jeu accepte `"impact"`, `"rpg"`, `"mobile"`, `"experiment"` (plusieurs possibles). **Seul Echoes of Aether est classé** (RPG & Aventure, Mobile) ; les autres jeux sont à classer par vos soins : tant que `categories` est vide, ils n'apparaissent que dans « Tous ».
- **Ciel** (`Sky.tsx`) : voile bleu nuit, étoiles fines, lune, horizon en collines, étoiles filantes très rares. Plus de particules ni de lumière de curseur.
- **À propos** : une photo (`about.json` → `photo`), quelques lignes, CV / LinkedIn / contact (renseignez `site.json` → `cv`, `socials`).

## V4 — Refonte « menu de jeu vidéo »

- Accueil : paysage nocturne illustré (SVG en couches : cerisier, lune et rayons, aurores, lac, porte de pierre lumineuse comme seuil vers d autres mondes ; parallaxe, pétales, lucioles, particules du portail, étoiles filantes rares), nom, rôles, accroche, bouton lumineux.
- Galerie sous l'accueil et sur `/games` : 5 filtres (un jeu peut avoir plusieurs catégories : `impact`, `rpg`, `mobile`, `experiment`).
- **Aucun jeu publié pour l'instant** : `src/content/games.json` est vide, la galerie affiche des emplacements réservés. Pour publier un jeu, copier son entrée depuis `src/content/games.draft.json` (ou en créer une) dans `games.json` et renseigner `categories`.
- Illustration d'accueil réelle : déposer un fichier dans `public/` (ex. `/hero.webp`) puis mettre `"hero": { "image": "/hero.webp" }` dans `src/content/site.json`.
- Musique : icône discrète en haut ; lecteur rétractable, jamais d'autoplay.
