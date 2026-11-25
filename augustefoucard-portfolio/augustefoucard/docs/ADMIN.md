# Interface d'administration (phase 2)

Aujourd'hui, tous les contenus vivent dans `src/content/*.json`. C'est volontaire : ces fichiers sont
**déjà au bon format** pour être édités plus tard par un CMS « Git-based », sans rien reconstruire.

## Ce qu'il ne faut pas faire

Pas de mot de passe vérifié dans le navigateur (« fausse authentification côté client ») : n'importe qui
pourrait le contourner en lisant le code. L'authentification doit être faite par un service serveur.

## Option recommandée : Sveltia CMS (ou Decap CMS) + GitHub + Cloudflare Access

1. **Le CMS** est une page `/admin` qui modifie les fichiers JSON du dépôt GitHub via des commits.
   Chaque modification déclenche un nouveau déploiement Cloudflare Pages automatiquement.
2. **L'authentification** se fait avec ton compte GitHub (OAuth). Seuls les comptes qui ont le droit
   d'écrire dans le dépôt peuvent modifier quoi que ce soit : la sécurité est garantie par GitHub.
   Sveltia CMS fournit un petit Worker Cloudflare gratuit (`sveltia-cms-auth`) pour gérer l'OAuth.
3. **Double verrou (optionnel)** : protège `/admin*` avec **Cloudflare Zero Trust → Access** (gratuit
   jusqu'à 50 utilisateurs) pour que la page elle-même ne soit accessible qu'à ton adresse e-mail.
4. **Médias** : les images/vidéos téléversées vont dans `public/media/`. Pour de grosses vidéos,
   préférer Cloudflare Stream ou R2 et coller l'URL dans le champ correspondant.

## Étapes concrètes (le moment venu)

- Ajouter `public/admin/index.html` (charge le script du CMS) et `public/admin/config.yml`
  qui décrit les collections : `games.json`, `archives.json`, `music.json`, `sound.json`, `lab.json`, `about.json`, `site.json`.
- Déployer le Worker d'authentification et renseigner son URL dans `config.yml` (`backend.base_url`).
- Créer l'application OAuth GitHub (Settings → Developer settings → OAuth Apps).
- Activer Cloudflare Access sur `augustefoucard.fr/admin*`.

Alternative plus lourde si un jour tu veux des comptes multiples, des brouillons et des médias gérés :
un CMS headless (Sanity, Strapi…) avec reconstruction du site par webhook.
