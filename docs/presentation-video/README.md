# Coliclic — Les voyages créent des liens

Film de présentation commerciale, **50 secondes, 1920 × 1080, 30 i/s**, en français.
Première version avec musique instrumentale originale et textes intégrés, sans voix enregistrée.

## Direction artistique

Bleu marine `#023047`, orange `#FB8500`, blanc crème ; typographie Avenir Next.
Photographie reprise du site (`front-office/public/images/landing-handoff.webp`).
Colis vectoriels, tracé animé Paris–Abidjan, mouvements typographiques, interfaces
illustrées et fondus de 650 ms. Les cartes sont des démonstrations, pas des captures
de réservations réelles. Aucun nom de client, prix, avis chiffré, disponibilité,
promesse de délai ou garantie de livraison n’est inventé.

Le scénario suit le README métier et le parcours existant de la page « Comment ça marche ».
Les allusions au paiement et à la commission sont omises pour rester utilisable
dans les deux modes commerciaux. Le prix au kilo reste fixé par le voyageur.

## Livrables

- `output/coliclic-presentation.mp4` : H.264, YUV 4:2:0, AAC stéréo 48 kHz,
  métadonnées faststart pour lecture web ; master livré avec les sources (environ 4 Mo).
- `output/storyboard.jpg` : les six séquences en une planche.
- `output/poster.jpg` : affiche pour la vidéo.
- `film.json` : timings, textes et proposition de voix off modifiables.
- `render.py` : composition, animations, musique et export reproductibles.

## Reproduire

Python 3.12 et dépendances de `requirements.txt`. Le moteur H.264 est fourni par
`imageio-ffmpeg`, sans installation système de FFmpeg. Sur macOS, la police locale
est `/System/Library/Fonts/Avenir Next.ttc` (Bold index 0, Regular index 7) ; elle
n’est pas redistribuée. L’option `--font` accepte un autre emplacement de ce TTC.

```sh
python3 -m venv docs/presentation-video/.venv
docs/presentation-video/.venv/bin/pip install -r docs/presentation-video/requirements.txt
docs/presentation-video/.venv/bin/python -m unittest discover -s docs/presentation-video -p 'test_*.py'
docs/presentation-video/.venv/bin/python docs/presentation-video/render.py
```

Prévisualisation seule : `--previews-only`.
Export allégé : `--width 1280 --fps 24`.
Le moteur décode intégralement le MP4 après chaque rendu pour vérifier sa lecture.

## Séquençage et voix off proposée

| Temps | Séquence | Voix off à enregistrer si souhaité |
|---|---|---|
| 00–07 s | Un colis. Tout un lien. | Il y a des colis qui transportent bien plus que des objets. Ils rapprochent ceux qui comptent. |
| 07–15 s | Votre destination. Son prochain voyage. | Avec Coliclic, trouvez un voyageur qui se rend à la destination de votre colis. |
| 15–24 s | Le bon trajet. Pour votre colis. | Indiquez votre départ et votre destination. Consultez les trajets, les profils et les avis pour choisir votre voyageur. |
| 24–32 s | Une demande. Le lien se crée. | Décrivez votre colis et envoyez votre demande. Échangez avec le voyageur pour organiser la remise. |
| 32–41 s | Votre voyage peut aller plus loin. | Vous voyagez ? Publiez votre trajet, proposez votre espace disponible et fixez votre tarif au kilo. Votre voyage devient un service utile. |
| 41–50 s | Le prochain lien commence avec vous. | Coliclic. Des voyages, des colis, des liens. Trouvez un voyageur, ou proposez votre prochain trajet. |

La voix off reste une proposition ; elle devra être calée sur une lecture réelle.
La vidéo comporte déjà tous les messages nécessaires à une lecture sans son.
Le CTA affiche `coliclic.com`, le domaine de production configuré dans
`deploy/compose.production.yml` et utilisé par les cartes de partage de l’application.

## Vérification

Tests du minutage, des marges typographiques, du rendu à chaque raccord et de
l’audio (durée, stéréo, absence de saturation, fondus). Vérification visuelle de
la planche des six séquences, des images aux raccords et du fichier exporté.
Ce dossier ne modifie ni le front-office, ni le back-office de l’application.

Validation locale de cette livraison : 4 tests du film, 297 tests back-office
(`./mvnw -B verify`) et 672 tests front-office (`npm test -- --watch=false
--browsers=ChromeHeadless`) réussis. Export final décodé intégralement, durée
50,00 s, vidéo 1920 × 1080 à 30 i/s, audio AAC stéréo 48 kHz.
Build de production Angular réussi ; avertissements CSS existants sur les pages
landing, détail et gestion des trajets, sans modification des budgets.
