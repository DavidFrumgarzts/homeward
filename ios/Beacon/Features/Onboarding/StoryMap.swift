import SwiftUI

// The map in the opening story: the drawn Lapa map with a walk on top.
//   withBeacon = false -> the green dot walks from the bar into the red zone, leaving a dotted trail; a red ring marks where it ends
//   withBeacon = true  -> the dot waits at the corner, its arrow pointing the new way, and a blue route draws the way around
// Takes about two and a half seconds. Route numbers are in the map's 393 x 520 grid (same as Android and web).
struct StoryMap: View {
    var withBeacon: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var began = Date()
    @State private var finished = false // the walk has been drawn: stop redrawing every frame

    private static let start = CGPoint(x: 78, y: 153) // just outside the bar
    private static let oldWay = SVGPath.parse("M78 153 L150 154 L151 208")
    private static let safeWay = SVGPath.parse("M78 153 L38 155 L37 236 C90 240,150 249,210 259 C232 263,254 266,274 269")
    private static let wouldHaveGone = SVGPath.parse("M78 153 L150 154 L151 190")

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30, paused: reduceMotion || finished)) { timeline in
            let t = reduceMotion || finished ? 1 : min(1, max(0, (timeline.date.timeIntervalSince(began) - 0.4) / 2.4))
            let walk = withBeacon ? Self.safeWay : Self.oldWay
            let head = point(on: walk, at: t)
            let you = withBeacon ? Self.start : head
            let heading = withBeacon ? direction(from: Self.start, to: point(on: walk, at: 0.02)) : direction(from: point(on: walk, at: max(0, t - 0.02)), to: point(on: walk, at: min(1, t + 0.02)))
            LapaMapView(you: LapaMapProjection.Spot(x: you.x, y: you.y), heading: heading, zoneLabel: ["RUA DOS", "INVÁLIDOS"], overlay: { c in
                let drawn = walk.trimmedPath(from: 0, to: max(0.001, t))
                if withBeacon {
                    // The way he would have gone, faint.
                    c.stroke(Self.wouldHaveGone, with: .color(BeaconColors.mapNavy.opacity(0.45)), style: StrokeStyle(lineWidth: 2, dash: [2, 6]))
                    c.stroke(drawn, with: .color(BeaconColors.primary), style: StrokeStyle(lineWidth: 5, lineCap: .round, lineJoin: .round))
                } else {
                    c.stroke(drawn, with: .color(BeaconColors.mapNavy), style: StrokeStyle(lineWidth: 3.5, lineCap: .round, dash: [2, 8]))
                }
            }, top: { c in
                guard t >= 1 else { return }
                if withBeacon { // where the safe walk ends
                    c.fill(circle(head, 9), with: .color(.white)); c.fill(circle(head, 6), with: .color(BeaconColors.primary))
                } else {
                    c.stroke(circle(head, 22), with: .color(BeaconColors.red.opacity(0.5)), lineWidth: 2)
                    c.fill(circle(head, 14), with: .color(BeaconColors.red.opacity(0.3)))
                }
            })
        }
        .task {
            began = Date()
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            finished = true
        }
    }

    private func point(on path: Path, at t: Double) -> CGPoint {
        path.trimmedPath(from: 0, to: max(0.001, min(1, t))).currentPoint ?? Self.start
    }

    // Degrees clockwise from up, for the dot's arrow.
    private func direction(from a: CGPoint, to b: CGPoint) -> Double? {
        let dx = b.x - a.x, dy = b.y - a.y
        if hypot(dx, dy) < 0.5 { return 180 }
        return (atan2(dx, -dy) * 180 / .pi + 360).truncatingRemainder(dividingBy: 360)
    }

    private func circle(_ center: CGPoint, _ radius: CGFloat) -> Path {
        Path(ellipseIn: CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2))
    }
}
