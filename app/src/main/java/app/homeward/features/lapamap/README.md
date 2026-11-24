# lapamap

The illustrated map of Lapa, Rio (the travel-map look from the Figma design, component "Map/Lapa illustrated").
Home shows it when you are inside Lapa; everywhere else Home uses the real street map in `safetymap/`.

- `LapaMapProjection.kt`: PURE LOGIC. Turns a GPS point into a spot on the drawing, and says if a point is inside the drawn area. Tested in `LapaMapProjectionTest`.
- `LapaMapDrawing.kt`: draws the paper, parks, the red zone, streets, the avenue and the trees.
- `LapaIllustratedMap.kt`: the map you see: the drawing plus landmark pictures, labels, a small person where you are, and three small animations (police lights, tram, pulse under the person).

The drawing is stylized, not to scale. Landmark positions are approximate.
Landmark pictures live in `res/drawable/landmark_*.xml`. Don't edit those by hand: they are made by `docs/design/landmarks/make_landmarks.py`, which also writes the matching `.svg` files for Figma.
