package app.homeward.features.lapamap

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import app.homeward.design.HomewardColors

// The colors of the illustrated map. Day is the warm paper look on Home;
// Night is the same map after dark, used in the opening story.
data class LapaMapPalette(
    val paper: Color, val street: Color, val streetMajor: Color, val park: Color,
    val tree: Color, val treeLine: Color, val avenue: Color,
    val label: Color, val zone: Color, val zoneLabel: Color, val avenueLabel: Color,
) {
    companion object {
        val Day = LapaMapPalette(
            paper = HomewardColors.MapPaper, street = HomewardColors.MapStreet, streetMajor = HomewardColors.MapStreetMajor, park = HomewardColors.MapPark,
            tree = HomewardColors.MapTree, treeLine = HomewardColors.MapTreeLine, avenue = HomewardColors.MapNavy,
            label = HomewardColors.MapNavy, zone = Color(0xFFF4C3BC), zoneLabel = Color(0xFFB4282D), avenueLabel = Color.White,
        )
        val Night = LapaMapPalette(
            paper = HomewardColors.Night, street = Color(0xFF16284F), streetMajor = Color(0xFF1D3363), park = Color(0xFF10303F),
            tree = Color(0xFF2F7D5B), treeLine = Color(0xFF1B4F3A), avenue = Color(0xFF34569B),
            label = HomewardColors.OnNightMuted, zone = Color(0xFF4A2334), zoneLabel = Color(0xFFFF8A8E), avenueLabel = HomewardColors.OnNight,
        )
    }
}

// Draws the base of the illustrated Lapa map: paper, parks, the red zone, streets, the main avenue and trees. All numbers are in the drawing's own 393 x 520 grid (copied from the Figma frame);
// `unit` is how many screen pixels one grid step is. `extra` draws on top of the streets, in the same grid
// (the story uses it for the walking route).
fun DrawScope.drawLapaBase(unit: Float, palette: LapaMapPalette = LapaMapPalette.Day, extra: DrawScope.() -> Unit = {}) {
    drawRect(palette.paper)
    scale(unit, unit, pivot = Offset.Zero) {
        // Parks
        drawPath(path { moveTo(300f, -10f); cubicTo(330f, 20f, 380f, 30f, 410f, 70f); lineTo(410f, -10f); close() }, palette.park)
        drawPath(path { moveTo(14f, 292f); cubicTo(44f, 278f, 96f, 284f, 106f, 312f); cubicTo(114f, 340f, 84f, 362f, 50f, 358f); cubicTo(20f, 354f, 2f, 318f, 14f, 292f); close() }, palette.park)
        drawPath(path { moveTo(356f, 372f); cubicTo(384f, 366f, 410f, 378f, 410f, 404f); lineTo(410f, 620f); lineTo(340f, 620f); cubicTo(332f, 470f, 338f, 392f, 356f, 372f); close() }, palette.park)

        // Red zone on Rua dos Inválidos: a soft red patch, drawn the same way as the green parks.
        drawPath(path { moveTo(118f, 118f); cubicTo(130f, 98f, 176f, 96f, 188f, 116f); cubicTo(199f, 150f, 197f, 200f, 190f, 226f); cubicTo(180f, 245f, 130f, 245f, 120f, 228f); cubicTo(108f, 196f, 108f, 150f, 118f, 118f); close() }, palette.zone)

        // Small streets, then the two bigger ones (Rua dos Inválidos and Av. Gomes Freire).
        val small = Stroke(5f, cap = StrokeCap.Round)
        listOf(
            curve(-10f, 62f, 100f, 54f, 250f, 70f, 403f, 54f), curve(-10f, 154f, 120f, 148f, 260f, 160f, 403f, 150f),
            curve(-10f, 196f, 60f, 192f, 100f, 198f, 116f, 196f), curve(190f, 198f, 260f, 204f, 330f, 196f, 403f, 200f),
            curve(-10f, 336f, 120f, 328f, 250f, 344f, 403f, 334f), curve(-10f, 402f, 130f, 394f, 260f, 408f, 403f, 400f),
            curve(-10f, 462f, 130f, 454f, 260f, 468f, 403f, 460f), curve(38f, -10f, 44f, 150f, 30f, 350f, 36f, 620f),
            curve(270f, -10f, 276f, 160f, 262f, 380f, 268f, 620f), curve(340f, -10f, 346f, 200f, 330f, 400f, 338f, 620f),
            curve(96f, -10f, 100f, 60f, 92f, 110f, 96f, 154f),
        ).forEach { drawPath(it, palette.street, style = small) }
        val big = Stroke(9f, cap = StrokeCap.Round)
        drawPath(curve(150f, -10f, 156f, 180f, 144f, 380f, 150f, 620f), palette.streetMajor, style = big)
        drawPath(curve(210f, -10f, 214f, 180f, 204f, 380f, 210f, 620f), palette.streetMajor, style = big)

        // Av. Mem de Sá: the bold navy band, like the river on a travel map.
        drawPath(curve(-10f, 232f, 90f, 238f, 250f, 262f, 403f, 290f), palette.avenue, style = Stroke(17f, cap = StrokeCap.Round))

        listOf(20f to 306f, 102f to 316f, 28f to 334f, 350f to 10f, 376f to 36f, 372f to 410f, 386f to 446f, 362f to 470f).forEach { (x, y) -> tree(x, y, palette) }

        extra()
    }
}

private fun DrawScope.tree(x: Float, y: Float, palette: LapaMapPalette) {
    drawLine(palette.treeLine, Offset(x, y + 4f), Offset(x, y + 11f), strokeWidth = 1.6f, cap = StrokeCap.Round)
    drawCircle(palette.tree, 6f, Offset(x, y))
    drawCircle(palette.treeLine, 6f, Offset(x, y), style = Stroke(1.4f))
}

private fun path(build: Path.() -> Unit): Path = Path().apply(build)

// One smooth street: start point, two pull points, end point.
private fun curve(x0: Float, y0: Float, x1: Float, y1: Float, x2: Float, y2: Float, x3: Float, y3: Float): Path =
    path { moveTo(x0, y0); cubicTo(x1, y1, x2, y2, x3, y3) }
