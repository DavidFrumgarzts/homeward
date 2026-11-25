import MapKit
import SwiftUI

// The real street map on Home (Apple Maps), with the pack's zones drawn on it (green / yellow / red),
// the places to get help as badges, and a green dot where you are. Zones and places are drawn by
// Beacon from the saved pack, so they still show when the street tiles are not loaded.
struct HomeMap: View {
    var pack: SafetyPack
    var you: GeoPoint?
    var bottomCovered: CGFloat          // height hidden by the bottom sheet, so "you" stay in view
    @State private var camera: MapCameraPosition = .automatic
    @State private var followed = false

    var body: some View {
        Map(position: $camera) {
            ForEach(Array(pack.zones.enumerated()), id: \.offset) { _, zone in
                MapPolygon(coordinates: zone.polygon.map { CLLocationCoordinate2D(latitude: $0[0], longitude: $0[1]) })
                    .foregroundStyle(color(zone.level).opacity(0.18))
                    .stroke(color(zone.level), lineWidth: 2)
            }
            ForEach(Array(pack.zones.filter { $0.level != .safer }.enumerated()), id: \.offset) { _, zone in
                Annotation("", coordinate: center(of: zone)) { ZonePill(zone: zone) }
            }
            ForEach(Array(pack.safePlaces.enumerated()), id: \.offset) { _, place in
                Annotation(place.name, coordinate: CLLocationCoordinate2D(latitude: place.lat, longitude: place.lng)) { PlaceBadge(kind: place.kind, size: 28) }
            }
            if let you {
                Annotation("You", coordinate: CLLocationCoordinate2D(latitude: you.lat, longitude: you.lng)) { YouDot() }
            }
        }
        .mapStyle(.standard(pointsOfInterest: .excludingAll))
        .safeAreaPadding(.bottom, bottomCovered)
        .onAppear { recenter() }
        .onChange(of: you) { if !followed { recenter() } }
    }

    // Starts on the pack's area; jumps to you once, the first time GPS answers. After that the map is hers to move.
    private func recenter() {
        let lats = pack.zones.flatMap { $0.polygon.map { $0[0] } } + pack.safePlaces.map(\.lat)
        let lngs = pack.zones.flatMap { $0.polygon.map { $0[1] } } + pack.safePlaces.map(\.lng)
        var center = CLLocationCoordinate2D(latitude: ((lats.min() ?? 0) + (lats.max() ?? 0)) / 2, longitude: ((lngs.min() ?? 0) + (lngs.max() ?? 0)) / 2)
        if let you { center = CLLocationCoordinate2D(latitude: you.lat, longitude: you.lng); followed = true }
        camera = .region(MKCoordinateRegion(center: center, span: MKCoordinateSpan(latitudeDelta: 0.011, longitudeDelta: 0.011)))
    }

    private func center(of zone: SafetyZone) -> CLLocationCoordinate2D {
        let n = Double(max(1, zone.polygon.count))
        return CLLocationCoordinate2D(latitude: zone.polygon.map { $0[0] }.reduce(0, +) / n, longitude: zone.polygon.map { $0[1] }.reduce(0, +) / n)
    }

    private func color(_ level: ZoneLevel) -> Color {
        switch level { case .safer: BeaconColors.green; case .careful: BeaconColors.yellow; case .avoid: BeaconColors.red }
    }
}

// A small white pill on the map: a colored dot and "R. dos Inválidos · after 11pm".
private struct ZonePill: View {
    var zone: SafetyZone

    var body: some View {
        let hours = zone.riskyFromHour == 0 && zone.riskyToHour == 24 ? "" : " · after \(NearbyFeed.clock(zone.riskyFromHour))"
        HStack(spacing: 6) {
            Circle().fill(zone.level == .avoid ? BeaconColors.red : BeaconColors.yellow).frame(width: 8, height: 8)
            Text(zone.name.replacingOccurrences(of: "Rua ", with: "R. ") + hours).font(BeaconFonts.inter(11, weight: 600)).foregroundStyle(BeaconColors.text)
        }
        .padding(.horizontal, 8).padding(.vertical, 5).background(.white).clipShape(Capsule()).shadow(color: .black.opacity(0.15), radius: 2, y: 1)
    }
}

// The badge for a place to get help: Beacon's own police and hospital pictures, a plain pin for the rest.
struct PlaceBadge: View {
    var kind: String
    var size: CGFloat

    var body: some View {
        switch kind.lowercased() {
        case "police": Image("landmark_police").resizable().frame(width: size, height: size)
        case "hospital": Image("landmark_hospital").resizable().frame(width: size, height: size)
        default:
            Image(systemName: "mappin").font(.system(size: size * 0.5, weight: .bold)).foregroundStyle(.white).frame(width: size, height: size)
                .background(BeaconColors.green).clipShape(RoundedRectangle(cornerRadius: size * 0.3, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: size * 0.3, style: .continuous).stroke(.white, lineWidth: 2))
        }
    }
}

private struct YouDot: View {
    var body: some View {
        ZStack {
            Circle().fill(BeaconColors.green.opacity(0.2)).frame(width: 34, height: 34)
            Circle().fill(.white).frame(width: 20, height: 20)
            Circle().fill(BeaconColors.green).frame(width: 14, height: 14)
        }
    }
}
