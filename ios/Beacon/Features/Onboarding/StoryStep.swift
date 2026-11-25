import SwiftUI

// The first thing a new user sees (Figma "01 Replay" and "02 Replay"): one night in Lapa, told twice.
// First without Beacon, then the same night with Beacon's red-zone warning. Then setup starts.
// The story is based on news reports and the person is not named.
struct StoryStep: View {
    var onNext: () -> Void
    @State private var withBeacon = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(withBeacon ? "The same night, with Beacon" : "").style(.small)
                Spacer()
                Button("Skip", action: onNext).font(TextLook.label.font).foregroundStyle(BeaconColors.textMuted).frame(minWidth: 44, minHeight: 44)
            }
            .padding(.horizontal, BeaconSpacing.screen)
            Text(withBeacon ? "01:56 · 200 M BEFORE THE TURN" : "01:58 · LAPA, RIO DE JANEIRO").style(.mapLabel, color: BeaconColors.text).padding(.horizontal, BeaconSpacing.screen).padding(.bottom, 10)

            ZStack(alignment: .bottom) {
                StoryMap(withBeacon: withBeacon).id(withBeacon)
                if withBeacon { redZoneAlert.padding(.horizontal, BeaconSpacing.screen).padding(.bottom, 20 + BeaconRadius.sheet) }
            }
            .frame(maxHeight: .infinity)

            VStack(alignment: .leading, spacing: 20) {
                Text(withBeacon
                     ? "Same streets, same hour. This time his phone buzzes 200 m before the turn, with no signal, and points him to the busy street home."
                     : "He'd been in Rio two days. The bars were closing, his phone had no signal, and the quickest way back ran down an empty street.")
                    .style(.heading).fixedSize(horizontal: false, vertical: true)
                if withBeacon { PrimaryButton(label: "Start with Beacon", action: onNext) }
                else { PrimaryButton(label: "See the same night with Beacon") { withBeacon = true } }
            }
            .padding(.horizontal, BeaconSpacing.screen).padding(.top, 28).padding(.bottom, 16)
            // Figma "01"/"02": the text sits on a warm panel with round top corners, overlapping the map.
            .background(BeaconColors.background.clipShape(UnevenRoundedRectangle(topLeadingRadius: BeaconRadius.sheet, topTrailingRadius: BeaconRadius.sheet, style: .continuous)).ignoresSafeArea(edges: .bottom))
            .padding(.top, -BeaconRadius.sheet)
        }
        .background(BeaconColors.background.ignoresSafeArea())
    }

    // The warning Beacon would have shown: what's ahead, and where to go instead.
    private var redZoneAlert: some View {
        WhiteCard {
            HStack(spacing: 8) {
                Image(systemName: "exclamationmark").font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                    .frame(width: 28, height: 28).background(BeaconColors.red).clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                Text("Red zone ahead").style(.label)
            }
            Text("Rua dos Inválidos empties out after 1 a.m. Turn left now and take Av. Mem de Sá, it stays busy.").style(.small).padding(.top, 6)
        }
        .shadow(color: .black.opacity(0.08), radius: 12, y: 4)
        .accessibilityElement(children: .combine)
    }
}
