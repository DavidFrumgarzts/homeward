import SwiftUI

// A row of pill-shaped choices that wraps onto more lines when it runs out of room
// (the quick picks on the SOS screen, the ready-made questions in Ask Beacon).
struct QuickPickChips: View {
    var options: [String]
    var onPick: (String) -> Void

    var body: some View {
        WrapLayout(spacing: 8) {
            ForEach(options, id: \.self) { option in
                Button { onPick(option) } label: {
                    Text(option).style(.small, color: BeaconColors.text)
                        .padding(.horizontal, 14).frame(minHeight: 44)
                        .overlay(Capsule().stroke(BeaconColors.border, lineWidth: 1))
                        .contentShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// Lays children out left to right and starts a new line when the next one doesn't fit.
struct WrapLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = arrange(subviews, width: proposal.width ?? .infinity)
        return CGSize(width: proposal.width ?? rows.map(\.width).max() ?? 0, height: rows.last.map { $0.y + $0.height } ?? 0)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for row in arrange(subviews, width: bounds.width) {
            for item in row.items { subviews[item.index].place(at: CGPoint(x: bounds.minX + item.x, y: bounds.minY + row.y), proposal: .unspecified) }
        }
    }

    private struct Row { var y: CGFloat; var height: CGFloat; var width: CGFloat; var items: [(index: Int, x: CGFloat)] }

    private func arrange(_ subviews: Subviews, width: CGFloat) -> [Row] {
        var rows: [Row] = []
        var x: CGFloat = 0, y: CGFloat = 0
        for (index, view) in subviews.enumerated() {
            let size = view.sizeThatFits(.unspecified)
            if rows.isEmpty || x + size.width > width {
                if let last = rows.last { y = last.y + last.height + spacing }
                rows.append(Row(y: y, height: 0, width: 0, items: []))
                x = 0
            }
            rows[rows.count - 1].items.append((index, x))
            rows[rows.count - 1].height = max(rows[rows.count - 1].height, size.height)
            rows[rows.count - 1].width = x + size.width
            x += size.width + spacing
        }
        return rows
    }
}
