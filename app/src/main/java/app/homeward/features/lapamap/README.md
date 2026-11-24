# lapamap

The illustrated map of Lapa, Rio: a light grey city map with white streets and small place badges (Figma component "Map/Lapa illustrated").
Home shows it when you are inside Lapa; everywhere else Home uses the real street map in `safetymap/`.

- `LapaMapProjection.kt`: PURE LOGIC. Turns a GPS point into a spot on the drawing, and says if a point is inside the drawn area. Tested in `LapaMapProjectionTest`.
- `Heading.kt`: PURE LOGIC. Which way you are walking, from two GPS points. Tested in `HeadingTest`.
- `LapaBadges.kt`: PURE LOGIC. Where the drawn police and hospital badges sit, so a recommended one is ringed on its badge. Tested in `LapaBadgesTest`.
- `LapaMapDrawing.kt`: draws the ground, parks, cream blocks, water, the red zone, streets and trees.
- `LapaIllustratedMap.kt`: the map you see: the drawing plus small place badges with names, the red zone label, a green dot where you are with an arrow for the way you're walking, two pulsing rings (police badge, under your dot), and the yellow ring around a recommended place.

The drawing is stylized, not to scale. Landmark positions are approximate.
Landmark pictures live in `res/drawable/landmark_*.xml`. Don't edit those by hand: they are made by `docs/design/landmarks/make_landmarks.py`, which also writes the matching `.svg` files for Figma.
