# Coliclic — Expédiez vos colis avec des voyageurs de confiance

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

- Desktop : titre et formulaire dans la colonne de gauche, photo circulaire limitée à 440 px à droite. Départ et destination sont côte à côte, suivis de la date et du bouton pleine largeur. Tablette : titre et petite photo au-dessus du formulaire, avec les villes côte à côte dès 768 px. Mobile : bandeau compact avec miniature, menu déroulant et formulaire vertical ; une variante compacte s’applique aux écrans de 640 px de haut ou moins.
- Le texte principal est « Expédiez vos colis avec des voyageurs de confiance », avec « confiance » en orange. Il se répartit naturellement sur plusieurs lignes selon la largeur, sans sous-titre répété. Le titre conserve son entrée légère de 500 ms, désactivée avec la réduction des mouvements.
- Le titre, les onglets, les champs et le bouton sont visibles dès le rendu HTML : aucune animation au scroll ne peut les masquer. Le formulaire n’est pas déplacé par JavaScript et la page ne défile ni ne prend le focus automatiquement à l’ouverture.
- Les modes Envoyer et Voyager partagent villes et date ; le mode est reflété dans `?mode=transport`. La recherche utilise les noms des villes sélectionnées ou la saisie libre. En mode Envoyer, la date représente une borne de départ minimum ; en mode Voyager, une date souhaitée.
- Suggestions après deux caractères et 250 ms, sélection à la souris ou avec les flèches/Entrée ; Échap ferme la liste. Les anciennes réponses sont invalidées dès une nouvelle saisie ou une inversion.
- Jusqu’à trois trajets réels sont chargés sans demander la géolocalisation. Le pays est déduit du fuseau horaire selon la correspondance existante de l’application ; sans correspondance, le pays est omis. Aucun exemple ne remplace les résultats de l’API.
- Le flux présente chargement, vide, erreur et Réessayer ; délai maximum de 8 secondes. Sans référence publique, la carte reste visible sans lien de réservation ; le profil reste accessible.
- Animations au défilement réservées aux recommandations : titre de section et cartes remontent progressivement, avec un décalage de 90 ms entre les cartes. Les éléments sortis par le bas se réaniment lorsqu’ils reviennent dans le cadre. La grande photo desktop conserve une entrée légère et une parallaxe/zoom au scroll ; la miniature mobile et tablette utilise uniquement un fondu court. Le trajet/avion reste animé sur 1,5 seconde à l’ouverture sur desktop, dans la zone photo sans chevaucher la recherche.
- `prefers-reduced-motion: reduce` désactive aussi la parallaxe, y compris lorsque la préférence change pendant la visite. Le contenu reste visible sans JavaScript ou sans IntersectionObserver. Une prise de focus au clavier révèle immédiatement le formulaire ou la carte.

## Vérifications

```sh
npm test
npm run build
```

22 tests Jasmine couvrent la logique du formulaire, les réponses obsolètes, le formatage, les liens, les flux vide/erreur et le proxy HTTP (routes autorisées, suppression des cookies, interdiction des écritures, délai d’attente), ainsi que les animations au scroll : entrée/sortie, focus clavier, changement de préférence de mouvement, absence d’observateur et regroupement des événements dans une frame. Ils garantissent aussi l’exclusion du titre/formulaire des révélations et la suppression de la parallaxe lors du passage à une miniature.

Contrôles fonctionnels effectués dans le navigateur Codex :

- Premier écran vérifié avant cet ajustement à 320×568, 375×667, 390×844, 768×1024, 1024×768, 1366×768, 1440×900 et 1920×1080 pixels CSS : tous les champs, les onglets et le bouton sont entièrement visibles à scroll zéro, dans les deux modes, sans débordement horizontal.
- Menu mobile et fermeture par Échap ; validation et focus sur le champ manquant.
- Autocomplétion réelle de Nantes et sélection au clavier ; conservation de la date et inversion des villes entre les modes. Les suggestions dans la colonne de recherche ne sont coupées par aucun conteneur de la photo.
- Recherches expéditeur et voyageur ouvertes dans l’application, avec les bons paramètres.
- Trajet réel Nantes → Abidjan, profil voyageur et ouverture de la page de demande de réservation ; aucune demande soumise.
- États vide et erreur/Réessayer via des serveurs de test temporaires, arrêtés après vérification.
- Règles de réduction du mouvement activées dans une feuille de style de test : `animation-name: none`, opacité 1 et trajet visible. La préférence du système de l’utilisateur n’a pas été modifiée.

Vérification du titre et du sous-titre : 375×667, 768×1024, 1024×768, 1204×695, 1440×900 et 1920×1080 pixels CSS, sans débordement horizontal. Le bouton reste visible sur les six formats ; le titre se répartit sur plusieurs lignes selon la largeur.

## Photo

`public/assets/handoff.webp` est une photographie générée avec l’outil intégré **imagegen**, puis optimisée avec cwebp (1200 × 1200, qualité 85). Le cercle, le trajet et les pictogrammes sont des éléments HTML/CSS/SVG distincts.

Prompt utilisé, avec la maquette mobile sélectionnée comme référence visuelle :

> Use case: photorealistic-natural. Generate ONLY a premium natural editorial photograph to use as circular hero image on Coliclic website. Reference image shows approved visual direction; ignore all its text, logo, icons, circles, UI and graphics. Photo subject: friendly smiling adult woman with shoulder-length wavy brown hair wearing burnt orange jacket and black backpack, on left facing a friendly curly dark-haired adult male traveler wearing dark navy jacket and backpack on right. They are passing a small brown cardboard parcel between their hands in a bright modern airy train/airport station with large windows and soft background bokeh. Both faces and the parcel clearly within central 85 percent square crop. Medium waist-up shot, natural warm daylight, authentic approachable expressions, realistic anatomy, beautiful tactile cardboard. Square composition, full bleed real photographic background. NO text, NO logos, NO interface, NO overlays, NO watermark, NO orange dotted lines.
