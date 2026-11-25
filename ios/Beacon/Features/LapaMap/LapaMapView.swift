import SwiftUI

// The drawn map of Lapa (Figma "Map/Lapa illustrated"): a light grey city map with white streets,
// small place badges with their names, the red zone, and a green dot where you are.
// Used in the opening story. `you` is a spot on the map's own grid; nil hides the dot.
// `heading` is degrees clockwise from north: the dot gets a small arrow pointing that way.
// `overlay` draws on top of the streets and under the badges, in the map's grid (the story's walk);
// `top` draws above everything.
struct LapaMapView: View {
    var you: LapaMapProjection.Spot? = nil
    var heading: Double? = nil
    var zoneLabel: [String] = ["RED ZONE"]
    var overlay: (inout GraphicsContext) -> Void = { _ in }
    var top: (inout GraphicsContext) -> Void = { _ in }

    var body: some View {
        Canvas { context, size in
            context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(BeaconColors.mapPaper))
            let unit = size.width / LapaMapProjection.width // one grid step in screen points
            context.scaleBy(x: unit, y: unit)
            drawBase(&context)
            overlay(&context)
            drawPlaces(&context)
            if let you { drawYou(&context, you) }
            top(&context)
        }
        .clipped()
        .accessibilityElement()
        .accessibilityLabel("Map of Lapa, Rio de Janeiro")
    }

    private func drawBase(_ c: inout GraphicsContext) {
        LapaMapArt.parks.forEach { c.fill($0, with: .color(BeaconColors.mapPark)) }
        c.fill(LapaMapArt.sand, with: .color(BeaconColors.mapSand))
        LapaMapArt.ponds.forEach { c.fill(Path(roundedRect: $0, cornerRadius: 11), with: .color(BeaconColors.mapWater)) }
        c.stroke(LapaMapArt.stream, with: .color(BeaconColors.mapWater), style: StrokeStyle(lineWidth: 13, lineCap: .round))
        c.fill(LapaMapArt.redZone, with: .color(BeaconColors.mapZone))
        let street = GraphicsContext.Shading.color(BeaconColors.mapStreet)
        LapaMapArt.smallStreets.forEach { c.stroke($0, with: street, style: StrokeStyle(lineWidth: 4, lineCap: .round, lineJoin: .round)) }
        LapaMapArt.bigStreets.forEach { c.stroke($0, with: street, style: StrokeStyle(lineWidth: 8, lineCap: .round)) }
        c.stroke(LapaMapArt.avenue, with: street, style: StrokeStyle(lineWidth: 16, lineCap: .round))
        for tree in LapaMapArt.trees {
            c.stroke(Path { $0.move(to: CGPoint(x: tree.x, y: tree.y + 4)); $0.addLine(to: CGPoint(x: tree.x, y: tree.y + 11)) }, with: .color(BeaconColors.mapTreeLine), style: StrokeStyle(lineWidth: 1.6, lineCap: .round))
            let crown = Path(ellipseIn: CGRect(x: tree.x - 6, y: tree.y - 6, width: 12, height: 12))
            c.fill(crown, with: .color(BeaconColors.mapTree))
            c.stroke(crown, with: .color(BeaconColors.mapTreeLine), lineWidth: 1.4)
        }
    }

    private func drawPlaces(_ c: inout GraphicsContext) {
        for place in LapaMapArt.places {
            c.draw(Image(place.image), in: CGRect(x: place.at.x - 12, y: place.at.y - 12, width: 24, height: 24))
            let label = Text(place.name).font(BeaconFonts.inter(10, weight: 600)).foregroundStyle(Color(hex: 0x3C4658))
            c.draw(label, at: CGPoint(x: place.at.x, y: place.at.y + 20), anchor: .center)
        }
        for (i, line) in zoneLabel.enumerated() {
            let text = Text(line).font(BeaconFonts.sora(10, weight: 600)).tracking(0.7).foregroundStyle(BeaconColors.mapZoneLabel)
            c.draw(text, at: CGPoint(x: 153, y: 120 + CGFloat(i) * 12), anchor: .center)
        }
        var avenue = c
        avenue.translateBy(x: 332, y: 258)
        avenue.rotate(by: .degrees(7.5))
        avenue.draw(Text("AV. MEM DE SÁ").font(BeaconFonts.sora(10, weight: 600)).tracking(0.7).foregroundStyle(BeaconColors.textMuted), at: .zero, anchor: .center)
    }

    // You: a green dot with a white edge, and an arrow on the side you are walking toward.
    private func drawYou(_ c: inout GraphicsContext, _ spot: LapaMapProjection.Spot) {
        let center = CGPoint(x: spot.x, y: spot.y)
        c.fill(Path(ellipseIn: CGRect(x: center.x - 16, y: center.y - 16, width: 32, height: 32)), with: .color(BeaconColors.green.opacity(0.2)))
        if let heading {
            var turned = c
            turned.translateBy(x: center.x, y: center.y)
            turned.rotate(by: .degrees(heading))
            let arrow = Path { $0.move(to: CGPoint(x: 0, y: -19)); $0.addLine(to: CGPoint(x: 6.5, y: -9)); $0.addLine(to: CGPoint(x: -6.5, y: -9)); $0.closeSubpath() }
            turned.stroke(arrow, with: .color(.white), style: StrokeStyle(lineWidth: 3, lineJoin: .round))
            turned.fill(arrow, with: .color(BeaconColors.green))
        }
        c.fill(Path(ellipseIn: CGRect(x: center.x - 9.5, y: center.y - 9.5, width: 19, height: 19)), with: .color(.white))
        c.fill(Path(ellipseIn: CGRect(x: center.x - 7, y: center.y - 7, width: 14, height: 14)), with: .color(BeaconColors.green))
    }
}
