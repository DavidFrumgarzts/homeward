import SwiftUI

// The shapes of the drawn Lapa map, as SVG path text on the map's own 393 x 520 grid.
// Copied from web/js/map.js (which matches the Android drawing and the Figma frame), so all three
// apps show the same streets. The cream blocks and water are decoration, not real places.
// Each shape is turned into a Path once, the first time it is needed, not on every redraw.
enum LapaMapArt {
    static let parks: [Path] = [
        "M300 -10 C 330 20, 380 30, 410 70 L 410 -10 Z",
        "M14 292 C 44 278, 96 284, 106 312 C 114 340, 84 362, 50 358 C 20 354, 2 318, 14 292 Z",
        "M356 372 C 384 366, 410 378, 410 404 L 410 620 L 340 620 C 332 470, 338 392, 356 372 Z",
    ].map(SVGPath.parse)
    static let sand = SVGPath.parse("M158 66 L204 64 L204 98 L158 101 Z M276 208 L334 205 L333 244 L276 240 Z M44 409 L92 405 L93 456 L44 458 Z M216 344 L264 346 L263 394 L216 392 Z")
    static let ponds = [CGRect(x: 222, y: 424, width: 42, height: 26), CGRect(x: 50, y: 66, width: 38, height: 30)]
    static let stream = SVGPath.parse("M-10 498 C 40 486, 96 500, 124 530")
    static let redZone = SVGPath.parse("M118 118 C 130 98, 176 96, 188 116 C 199 150, 197 200, 190 226 C 180 245, 130 245, 120 228 C 108 196, 108 150, 118 118 Z")
    static let smallStreets: [Path] = [
        "M-10 62 C 100 54, 250 70, 403 54", "M-10 154 C 120 148, 260 160, 403 150", "M-10 196 C 60 192, 100 198, 116 196",
        "M190 198 C 260 204, 330 196, 403 200", "M-10 336 C 120 328, 250 344, 403 334", "M-10 402 C 130 394, 260 408, 403 400",
        "M-10 462 C 130 454, 260 468, 403 460", "M38 -10 C 44 150, 30 350, 36 620", "M270 -10 C 276 160, 262 380, 268 620",
        "M340 -10 C 346 200, 330 400, 338 620", "M96 -10 C 100 60, 92 110, 96 154", "M-10 108 L 96 104", "M210 100 L 270 97 L 340 102 L 403 98",
        "M64 196 L 62 236", "M230 152 L 232 200", "M304 56 L 306 150", "M306 200 L 304 270", "M96 336 L 99 400", "M300 402 L 303 462",
        "M184 464 L 186 620", "M150 300 L 210 304", "M60 404 L 58 462", "M96 462 L 98 620", "M38 250 L 36 280", "M270 300 L 340 297",
        "M100 240 L 100 290 L 150 292", "M340 150 L 403 144",
    ].map(SVGPath.parse)
    static let bigStreets: [Path] = ["M150 -10 C 156 180, 144 380, 150 620", "M210 -10 C 214 180, 204 380, 210 620"].map(SVGPath.parse)
    static let avenue = SVGPath.parse("M-10 232 C 90 238, 250 262, 403 290")
    static let trees: [CGPoint] = [(20, 306), (102, 316), (28, 334), (350, 10), (376, 36), (372, 410), (386, 446), (362, 470)].map { CGPoint(x: $0.0, y: $0.1) }

    // Place badges: the picture's name in the asset catalog, the label, and where it sits.
    static let places: [(image: String, name: String, at: CGPoint)] = [
        ("landmark_bar", "Bar", CGPoint(x: 41, y: 128)), ("landmark_catedral", "Cathedral", CGPoint(x: 321, y: 138)),
        ("landmark_police", "Police", CGPoint(x: 249, y: 298)), ("landmark_hospital", "Hospital", CGPoint(x: 63, y: 318)),
        ("landmark_arcos", "Arcos da Lapa", CGPoint(x: 334, y: 334)), ("landmark_steps", "Selarón steps", CGPoint(x: 309, y: 418)),
    ]
}
