# Coliclic — De main en main

Prototype indépendant en HTML, Tailwind CSS 3 et JavaScript natif. La landing Angular n’est pas modifiée. Aucun déploiement n’est effectué.

## Lancer dans Codex

Depuis la racine du dépôt :

```sh
cd mockup/landing-v2
npm ci
npm start
```

Ouvrir **http://localhost:4300/** dans le navigateur intégré de Codex. `npm start` compile Tailwind localement avant de lancer le serveur ; il n’y a pas de CDN Tailwind. Après une modification du HTML ou du CSS, relancer `npm run build` puis rafraîchir la page.

Prérequis : Node.js 22+, API locale sur **http://localhost:8080**, application sur **http://localhost:4200**. Les polices General Sans et DM Sans sont chargées depuis Fontshare et Google Fonts, avec repli Arial/sans-serif si le réseau est indisponible. La photo est locale.

Options serveur (variables d’environnement, jamais exposer de secrets) :

```sh
PORT=4300 API_ORIGIN=http://localhost:8080 APP_ORIGIN=http://localhost:4200 npm start
```

Le serveur écoute uniquement sur `127.0.0.1`. Il sert les fichiers de `public/` et transmet exclusivement des **GET publics**, sans cookies ni authentification, vers `/api/locations/search` et `/api/trips/landing-feed`. Il ne crée ni réservation ni trajet. Les liens de recherche, profil et réservation ouvrent l’application configurée, dont la session reste gérée par celle-ci.

## Comportement

- Desktop : titre à gauche, photo circulaire à droite, formulaire horizontal. Tablette : date et bouton sur une seconde ligne. Mobile : menu déroulant et formulaire vertical.
- Les modes Envoyer et Voyager partagent villes et date ; le mode est reflété dans `?mode=transport`. La recherche utilise les noms des villes sélectionnées ou la saisie libre. En mode Envoyer, la date représente une borne de départ minimum ; en mode Voyager, une date souhaitée.
- Suggestions après deux caractères et 250 ms, sélection à la souris ou avec les flèches/Entrée ; Échap ferme la liste. Les anciennes réponses sont invalidées dès une nouvelle saisie ou une inversion.
- Jusqu’à trois trajets réels sont chargés sans demander la géolocalisation. Le pays est déduit du fuseau horaire selon la correspondance existante de l’application ; sans correspondance, le pays est omis. Aucun exemple ne remplace les résultats de l’API.
- Le flux présente chargement, vide, erreur et Réessayer ; délai maximum de 8 secondes. Sans référence publique, la carte reste visible sans lien de réservation ; le profil reste accessible.
- Animation d’entrée de 600 ms, trajet/avion sur 1,5 seconde une seule fois, cartes révélées au défilement. `prefers-reduced-motion: reduce` désactive les animations et conserve tout le contenu visible.

## Vérifications

```sh
npm test
npm run build
```

15 tests Jasmine couvrent la logique du formulaire, les réponses obsolètes, le formatage, les liens, les flux vide/erreur et le proxy HTTP (routes autorisées, suppression des cookies, interdiction des écritures, délai d’attente).

Contrôles fonctionnels effectués dans le navigateur Codex :

- Rendus de 375, 768, 1440 et 1920 pixels CSS, sans débordement horizontal.
- Menu mobile et fermeture par Échap ; validation et focus sur le champ manquant.
- Autocomplétion réelle de Nantes et sélection au clavier ; conservation de la date et inversion des villes entre les modes.
- Recherches expéditeur et voyageur ouvertes dans l’application, avec les bons paramètres.
- Trajet réel Nantes → Abidjan, profil voyageur et ouverture de la page de demande de réservation ; aucune demande soumise.
- États vide et erreur/Réessayer via des serveurs de test temporaires, arrêtés après vérification.
- Règles de réduction du mouvement activées dans une feuille de style de test : `animation-name: none`, opacité 1 et trajet visible. La préférence du système de l’utilisateur n’a pas été modifiée.

## Photo

`public/assets/handoff.webp` est une photographie générée avec l’outil intégré **imagegen**, puis optimisée avec cwebp (1200 × 1200, qualité 85). Le cercle, le trajet et les pictogrammes sont des éléments HTML/CSS/SVG distincts.

Prompt utilisé, avec la maquette mobile sélectionnée comme référence visuelle :

> Use case: photorealistic-natural. Generate ONLY a premium natural editorial photograph to use as circular hero image on Coliclic website. Reference image shows approved visual direction; ignore all its text, logo, icons, circles, UI and graphics. Photo subject: friendly smiling adult woman with shoulder-length wavy brown hair wearing burnt orange jacket and black backpack, on left facing a friendly curly dark-haired adult male traveler wearing dark navy jacket and backpack on right. They are passing a small brown cardboard parcel between their hands in a bright modern airy train/airport station with large windows and soft background bokeh. Both faces and the parcel clearly within central 85 percent square crop. Medium waist-up shot, natural warm daylight, authentic approachable expressions, realistic anatomy, beautiful tactile cardboard. Square composition, full bleed real photographic background. NO text, NO logos, NO interface, NO overlays, NO watermark, NO orange dotted lines.
