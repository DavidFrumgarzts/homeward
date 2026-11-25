import SwiftUI

// Setup step 1 (Figma "03 Welcome"): what Beacon does, in three lines.
struct WelcomeStep: View {
    var onNext: () -> Void

    var body: some View {
        StepLayout(step: .welcome, title: "Go anywhere.\nBeacon has your back, even with no signal.", button: "Set up in 1 minute",
                   header: AnyView(BeaconRings().frame(height: 190).clipShape(RoundedRectangle(cornerRadius: BeaconRadius.picture, style: .continuous))), onButton: onNext) {
            VStack(spacing: BeaconSpacing.cards) {
                FeatureRow(icon: "exclamationmark.triangle", tint: BeaconColors.red, tile: BeaconColors.redTint, title: "Warns you before a red zone", detail: "The phone buzzes before you turn into an unsafe street.")
                FeatureRow(icon: "text.bubble", title: "Ask Beacon, offline", detail: "The police number, a place to get help, what to do. No data needed.")
                FeatureRow(icon: "dot.circle", tint: BeaconColors.amber, tile: BeaconColors.amberTint, title: "SOS in a few words", detail: "Beacon writes the text for your family. You press send.")
            }
        }
    }
}

// The picture at the top: a beacon sending rings out over a night map.
private struct BeaconRings: View {
    var body: some View {
        Canvas { c, size in
            let w = size.width, h = size.height
            c.fill(Path(CGRect(origin: .zero, size: size)), with: .color(BeaconColors.night))
            for (a, b) in [((0.0, 0.26), (1.0, 0.21)), ((0.0, 0.63), (1.0, 0.71)), ((0.23, 0.0), (0.27, 1.0)), ((0.72, 0.0), (0.70, 1.0))] {
                c.stroke(Path { $0.move(to: CGPoint(x: a.0 * w, y: a.1 * h)); $0.addLine(to: CGPoint(x: b.0 * w, y: b.1 * h)) }, with: .color(BeaconColors.nightLine), lineWidth: 1.5)
            }
            let center = CGPoint(x: w / 2, y: h / 2)
            func circle(_ p: CGPoint, _ r: CGFloat) -> Path { Path(ellipseIn: CGRect(x: p.x - r, y: p.y - r, width: 2 * r, height: 2 * r)) }
            c.stroke(circle(center, 70), with: .color(BeaconColors.primary.opacity(0.25)), lineWidth: 2)
            c.stroke(circle(center, 46), with: .color(BeaconColors.primary.opacity(0.5)), lineWidth: 2)
            c.fill(circle(center, 24), with: .color(BeaconColors.primary))
            c.fill(circle(center, 9), with: .color(.white))
            c.fill(circle(CGPoint(x: w * 0.79, y: h * 0.27), 6), with: .color(Color(hex: 0xFF9B4A)))
            c.fill(circle(CGPoint(x: w * 0.19, y: h * 0.74), 5), with: .color(BeaconColors.green))
        }
        .accessibilityHidden(true)
    }
}
