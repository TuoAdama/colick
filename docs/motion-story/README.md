# Coliclic — Un colis. Tout un lien.

Publicité illustrée de **50 secondes**, master **1080 × 1920, 30 i/s**.
Un même colis va de Sam à Paris à Léa à Abidjan, accompagné par Aya.

## Livrables

- `output/coliclic-motion-vertical.mp4` : H.264, YUV 4:2:0, AAC stéréo 48 kHz, démarrage web rapide.
- `output/storyboard.jpg` : les sept scènes avec leurs timings.
- `voiceover.md` : texte français et plages d’enregistrement.
- `output/voiceover.srt` : repères temporels du **script à enregistrer**, pas une transcription de la bande-son.
- `film.json` : scénario, textes, couleurs, personnages et bruitages modifiables.
- `render.py` : personnages articulés, carton en perspective, animations, carte, interfaces, musique originale et export.
- `assets/DM-Sans.ttf` et `assets/OFL.txt` : typographie déjà employée dans les écrans de l’application, fournie sous licence SIL OFL.
- `output/validation.json` : contrôle du fichier réellement encodé.

La bande-son livrée contient **la musique instrumentale originale et les bruitages, sans voix enregistrée**. Le script voix off est prêt pour l’enregistrement. Le film se comprend intégralement sans son.

## Reproduire

Version testée : Python 3.14. Aucun service distant, clé API, moteur vidéo système ou police installée n’est nécessaire au rendu. FFmpeg est fourni par la dépendance `imageio-ffmpeg`.

Depuis la racine du dépôt :

```sh
python3 -m venv docs/motion-story/.venv
docs/motion-story/.venv/bin/pip install -r docs/motion-story/requirements.txt
docs/motion-story/.venv/bin/python docs/motion-story/render.py
./back-office/mvnw -B -f docs/motion-story/pom.xml -Dmotion.python="$PWD/docs/motion-story/.venv/bin/python" test
```

Les quatre tests **JUnit** exécutent sept contrôles Python portant sur le scénario, les images, le son et le MP4 final. Pour exécuter directement ces contrôles :

```sh
docs/motion-story/.venv/bin/python -m unittest discover -s docs/motion-story -p 'test_*.py' -v
```

Dans l’archive autonome, ouvrir le dossier des sources puis lancer `python render.py` et `python -m unittest -v`. Le contrôle du MP4 exige d’avoir d’abord généré le master. Avec Maven installé : `mvn -Dmotion.python=/chemin/absolu/vers/python test`.

Prévisualisation sans encodage : `python render.py --previews-only`.
Copie de travail : `python render.py --width 540 --fps 15 --output /tmp/coliclic-draft`.
Le master par défaut reste toujours vertical, 1080 × 1920 à 30 i/s.
Les pistes séparées `music.wav`, `foley.wav` et le mix `soundtrack.wav` sont régénérés à chaque export, ce qui permet d’ajouter une voix au montage.

## Modifier

Les textes et timings se changent dans `film.json`. Les scènes restent jointives ; les plages de voix off doivent rester à l’intérieur de leur scène. Le poids, le tarif et les notes ne sont pas chiffrés dans la démonstration.

Les positions, tailles et rotations du carton sont définies dans `PARCEL_KEYS`. Un seul carton est dessiné au-dessus des décors, y compris pendant les transitions. Les déplacements utilisent une interpolation quintique qui annule la vitesse et l’accélération aux points de repos. Le même rig `person()` produit les avatars et les personnages des deux remises. Les mains accompagnent le transfert puis se retirent. Les changements de décor durent 600 ms et conservent le carton au premier plan.

Le motif du carton vient de `mockup/logo.svg` : corps marine et ruban orange croisé. Le mot-symbole reprend **le header actuel** (`Coli` orange, `clic` marine), car le texte du SVG historique porte encore l’ancienne orthographe « Colick ». Le fond crème, le marine `#023047` et l’orange `#FB8500` sont repris dans tout le film. Aucun visuel client ou nom réel n’est utilisé. La carte et l’avion illustrent le voyage, sans représenter une fonctionnalité de suivi.

Le script musical produit un instrumental doux à 100 BPM : accords de clavier, nappes, basse et percussion brossée. Les bruitages correspondent à la fermeture du carton, à la recherche, à l’envoi et l’acceptation, aux remises et au départ. Les synthèses sont déterministes et n’utilisent aucun échantillon tiers.

## Vérifier

Le rendu décode automatiquement **l’intégralité** du MP4 et écrit le nombre d’images, les dimensions, la cadence, les codecs et les caractéristiques audio dans `validation.json`. Les tests contrôlent aussi la présence du bloc `moov` avant les images compressées, pour une lecture web immédiate.

Les tests d’image vérifient les marges des textes, les images aux raccords, la continuité du carton et le mouvement de chaque scène. Les tests audio vérifient la durée exacte, la stéréo, les fondus, l’absence de saturation et chaque bruitage à son timing. Les planches `output/review/` servent au contrôle visuel des gestes et des raccords. Leur génération ne remplace pas l’inspection visuelle du film.

Le format principal réserve 150 px en haut, plus de 230 px en bas pour les messages principaux et au moins 80 px à droite pour le contenu des interfaces. Les textes narratifs de 70 px restent lisibles à une réduction au tiers ; les mentions de démonstration sont secondaires. Les titres demandés, les gestes et le CTA restent visibles sans voix off.

Ce dossier est autonome et ne modifie pas les applications Angular ou Spring Boot. Le contexte produit vérifié et les sources consultées sont consignés dans `product-context.md`.

Validation de cette livraison : **4 tests JUnit / 7 contrôles du film**, **297 tests back-office**, **672 tests front-office** réussis. Build Angular de production réussi, avec les avertissements de budget CSS déjà présents sur landing, détail de trajet et gestion des trajets. Master décodé intégralement : **1 500 images, 50,00 s, H.264 1080 × 1920 à 30 i/s, AAC stéréo 48 kHz**. Les images réellement encodées ont aussi été inspectées à 360 × 640, ainsi que les planches des gestes et des raccords.
