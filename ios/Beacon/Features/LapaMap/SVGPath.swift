import SwiftUI

// Turns the small part of SVG path text that Beacon's drawn map uses into a SwiftUI Path:
// M (move), L (line), C (curve) and Z (close), with absolute numbers, e.g. "M78 153 L150 154 C…".
// This lets iOS draw the very same streets as web/js/map.js instead of a hand-made copy.
enum SVGPath {
    static func parse(_ text: String) -> Path {
        var path = Path()
        var command: Character = "M"
        var numbers: [CGFloat] = []
        var token = ""

        func flushToken() {
            if let value = Double(token) { numbers.append(CGFloat(value)) }
            token = ""
        }
        func flushCommand() {
            switch command {
            case "M": if numbers.count >= 2 { path.move(to: CGPoint(x: numbers[0], y: numbers[1])) }
                // Extra pairs after a move are lines.
                var i = 2
                while i + 1 < numbers.count { path.addLine(to: CGPoint(x: numbers[i], y: numbers[i + 1])); i += 2 }
            case "L": var i = 0
                while i + 1 < numbers.count { path.addLine(to: CGPoint(x: numbers[i], y: numbers[i + 1])); i += 2 }
            case "C": var i = 0
                while i + 5 < numbers.count {
                    path.addCurve(to: CGPoint(x: numbers[i + 4], y: numbers[i + 5]), control1: CGPoint(x: numbers[i], y: numbers[i + 1]), control2: CGPoint(x: numbers[i + 2], y: numbers[i + 3]))
                    i += 6
                }
            case "Z": path.closeSubpath()
            default: break
            }
            numbers = []
        }

        for ch in text {
            if "MLCZ".contains(ch) {
                flushToken(); flushCommand(); command = ch
            } else if ch == "-" && !token.isEmpty {
                flushToken(); token = "-"
            } else if ch.isNumber || ch == "." || ch == "-" {
                token.append(ch)
            } else {
                flushToken() // space or comma
            }
        }
        flushToken(); flushCommand()
        return path
    }
}
