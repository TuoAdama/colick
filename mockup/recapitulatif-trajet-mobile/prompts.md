# Prompts ImageGen

Les images ont été produites avec l’outil ImageGen intégré. Chaque génération associe le prompt commun à la directive de sa variante. La carte de la variante 03 a ensuite été retouchée avec le dernier prompt.

## Prompt commun

```text
Use case: ui-mockup
Asset type: high fidelity prototype screenshot for the Coliclic French mobile web app, immediately after successful publication of a parcel-carrying trip. Generate exactly one mobile screen per image.
Composition: portrait 9:16, full-bleed flat straight-on real UI screenshot, single centered mobile viewport fills the artwork, no device bezel or status bar, no hands, no backdrop or watermark. All important content legible and visible. Use realistic mobile spacing, strong contrast, DM Sans-like body, General Sans-like headings, restrained thin line icons. Brand palette: #023047 deep blue, #219EBC turquoise, #FB8500 orange accent, #FAFAFA and white.
Required exact French UI strings and example values: “Coliclic”, “Trajet publié”, “Paris”, “Abidjan”, “Départ”, “15 déc. 2026 · 10 h 30”, “Arrivée”, “15 déc. 2026 · 16 h 05”, “Point de rendez-vous”, “Aéroport Paris–Charles de Gaulle”, “Capacité”, “12 kg”, “Kilos disponibles”, “12 kg”, “Tarif”, “10 €/kg”, “Mode de réservation”, “Sur approbation”, “Partager”, “Générer une image du trajet”, “Mes trajets”. Dates and cities clearly pair with their departure and arrival labels. Render all content in French and proofread.
The share row has a primary button labeled “Partager” with share/export icon and exactly three recognizable social media logos immediately beside it, horizontally: WhatsApp green phone speech bubble, Instagram gradient camera, and Facebook blue f. The caption “Générer une image du trajet” belongs to this group and clarifies the action. The three logos are near the button. “Mes trajets” is a secondary navigation link in the footer. Avoid filler badges, gibberish text, extra decorative numbers and extra buttons. The result must feel viable for a real mobile web implementation.
```

## 01-frise

```text
Layout direction: Calm, spacious list and vertical route timeline. Compact white wordmark header, then small green check and prominent Trajet publié heading. White rounded itinerary panel with origin and arrival stacked along a turquoise dotted vertical line, and the meeting point as a subordinate row. Price, capacity and available kilos in a slim three-column strip, reservation mode in a single aligned row. In-flow navy share row below the data. Clean white and pale cool-gray canvas. This is the most conservative design-system proposal.
```

## 02-billet

```text
Layout direction: Make the hero itinerary look like a clean modern ticket with two small perforation notches and a dotted divider. An upper navy ticket section carries the two cities across the width joined by a subtle directional motif, then a white body contains both dates in columns and a meeting point row. Below it, a simple set of small structured rows contains pricing, both weights and booking mode. Warm off-white background, very small orange accent to evoke a physical ticket. Share row in flow near bottom, no ornamental barcodes.
```

## 03-carte

```text
Layout direction: Map-led. After a short header and success title, add a shallow sea-blue and ivory stylized geographic panel showing a curved dashed air route between approximate locations of France and Côte d’Ivoire, with only the labels Paris and Abidjan. No extra place labels. The app data below uses compact aligned departure and arrival rows, a meeting point row and a small data grid. Keep map around 17% of canvas so all requested details and share group remain visible. The map is only a visual in this concept.
```

## 04-partage

```text
Layout direction: Share-first. Immediately beneath Trajet publié, place a miniature but readable preview of the image that could be generated: a pale ice-blue branded travel card with Paris → Abidjan, the date 15 déc. 2026, 12 kg and 10 €/kg, with a tiny subtle route motif. Directly below the preview, place the required strong Partager button and three logos. Below this group, show all details as a clearly separate, compact recap with the required date/time values, meeting point, both weights, tariff and booking mode. No second share button, no extra headings except “Aperçu de l’image” and “Détails du trajet” if needed.
```

## 05-barre-fixe

```text
Layout direction: Compact dashboard-style mobile UI, teal-tinted confirmation header with light check emblem and “Trajet publié”, then a two-column itinerary panel with cities, dates and direction. Place the meeting point and booking mode as compact list rows, and price/capacity/availability in three readable unboxed tiles on a pale blue strip. A distinct white sticky bottom action bar with a thin top edge always displays the navy Partager button and three adjacent branded social logos, the helper text below and the small Mes trajets link. Make visible separation between the main body and the sticky bottom bar. No thumbnail, map or ticket notches.
```

## Retouche de la carte

```text
Use case: precise-object-edit
Asset type: corrected mobile UI mockup
Input image: existing Coliclic mobile recap screenshot, edit target.
Change only the geographic map panel below “Trajet publié”. Redraw that panel as a clean stylized atlas map of western Europe and northwestern Africa, with a single turquoise dotted arc directed from Paris, France (48.86°N, 2.35°E) to Abidjan, Côte d’Ivoire (5.35°N, 4.03°W, on the southern coast of West Africa along the Gulf of Guinea). Place a tiny arrowhead pointing toward Abidjan at the end of the route, no plane icon in the map. Keep the two labels “Paris” and “Abidjan”, with both necessary markers, while removing any other labels from the map. Keep dimensions, crop, colors and layout of the rest of the screenshot identical, including all text and the Share row and all three logos. The starting point and destination must be geographically plausible.
```
