# Features/LapaMap/
The drawn map of Lapa, Rio (Figma "Map/Lapa illustrated"), the same drawing as Android and web.
- `LapaMapArt.swift`: the streets, parks and red zone as SVG path text on the map's 393 x 520 grid, copied from `web/js/map.js`.
- `SVGPath.swift`: turns that path text into a SwiftUI `Path` (M, L, C, Z only).
- `LapaMapView.swift`: draws the map, the place badges with names, the zone label and the green "you" dot.

The drawing is stylized, not to scale. Badge pictures come from `docs/design/landmarks/` through `ios/scripts/sync-landmarks.sh`.
