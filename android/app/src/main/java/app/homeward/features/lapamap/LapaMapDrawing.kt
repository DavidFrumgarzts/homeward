package app.homeward.features.lapamap

import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import app.homeward.design.HomewardColors

// The colors of the illustrated map, in one place so the whole look can be swapped.
data class LapaMapPalette(
    val paper: Color, val street: Color, val park: Color, val sand: Color, val water: Color,
    val tree: Color, val treeLine: Color,
    val label: Color, val zone: Color, val zoneLabel: Color, val avenueLabel: Color,
) {
    companion object {
        // Light grey ground, white streets, soft green parks (Figma "Map/Lapa illustrated").
        val Day = LapaMapPalette(
            paper = HomewardColors.MapPaper, street = HomewardColors.MapStreet, park = HomewardColors.MapPark,
            sand = HomewardColors.MapSand, water = HomewardColors.MapWater,
            tree = HomewardColors.MapTree, treeLine = HomewardColors.MapTreeLine,
            label = Color(0xFF4A5876), zone = Color(0xFFF4C3BC), zoneLabel = Color(0xFFB4282D), avenueLabel = HomewardColors.TextMuted,
        )
    }
}

// Draws the base of the illustrated Lapa map: ground, parks, cream blocks, water, the red zone, streets and trees.
// The cream blocks and water are decoration, not real places. All numbers are in the drawing's own 393 x 520 grid (copied from the Figma frame);
// `unit` is how many screen pixels one grid step is. `extra` draws on top of the streets, in the same grid
// (the story uses it for the walking route).
fun DrawScope.drawLapaBase(unit: Float, palette: LapaMapPalette = LapaMapPalette.Day, extra: DrawScope.() -> Unit = {}) {
    drawRect(palette.paper)
    scale(unit, unit, pivot = Offset.Zero) {
        // Parks
        drawPath(path { moveTo(300f, -10f); cubicTo(330f, 20f, 380f, 30f, 410f, 70f); lineTo(410f, -10f); close() }, palette.park)
        drawPath(path { moveTo(14f, 292f); cubicTo(44f, 278f, 96f, 284f, 106f, 312f); cubicTo(114f, 340f, 84f, 362f, 50f, 358f); cubicTo(20f, 354f, 2f, 318f, 14f, 292f); close() }, palette.park)
        drawPath(path { moveTo(356f, 372f); cubicTo(384f, 366f, 410f, 378f, 410f, 404f); lineTo(410f, 620f); lineTo(340f, 620f); cubicTo(332f, 470f, 338f, 392f, 356f, 372f); close() }, palette.park)

        // A few cream blocks and bits of water, for variety.
        listOf(
            path { moveTo(158f, 66f); lineTo(204f, 64f); lineTo(204f, 98f); lineTo(158f, 101f); close() },
            path { moveTo(276f, 208f); lineTo(334f, 205f); lineTo(333f, 244f); lineTo(276f, 240f); close() },
            path { moveTo(44f, 409f); lineTo(92f, 405f); lineTo(93f, 456f); lineTo(44f, 458f); close() },
            path { moveTo(216f, 344f); lineTo(264f, 346f); lineTo(263f, 394f); lineTo(216f, 392f); close() },
        ).forEach { drawPath(it, palette.sand) }
        drawRoundRect(palette.water, Offset(222f, 424f), Size(42f, 26f), CornerRadius(11f))
        drawRoundRect(palette.water, Offset(50f, 66f), Size(38f, 30f), CornerRadius(12f))
        drawPath(curve(-10f, 498f, 40f, 486f, 96f, 500f, 124f, 530f), palette.water, style = Stroke(13f, cap = StrokeCap.Round))

        // Red zone on Rua dos Inválidos: a soft red patch, drawn the same way as the green parks.
        drawPath(path { moveTo(118f, 118f); cubicTo(130f, 98f, 176f, 96f, 188f, 116f); cubicTo(199f, 150f, 197f, 200f, 190f, 226f); cubicTo(180f, 245f, 130f, 245f, 120f, 228f); cubicTo(108f, 196f, 108f, 150f, 118f, 118f); close() }, palette.zone)

        // Streets, all white: the long ones first, then short side streets, then the two bigger ones
        // (Rua dos Inválidos and Av. Gomes Freire) and the wide avenue, Av. Mem de Sá.
        val small = Stroke(4f, cap = StrokeCap.Round, join = StrokeJoin.Round)
        listOf(
            curve(-10f, 62f, 100f, 54f, 250f, 70f, 403f, 54f), curve(-10f, 154f, 120f, 148f, 260f, 160f, 403f, 150f),
            curve(-10f, 196f, 60f, 192f, 100f, 198f, 116f, 196f), curve(190f, 198f, 260f, 204f, 330f, 196f, 403f, 200f),
            curve(-10f, 336f, 120f, 328f, 250f, 344f, 403f, 334f), curve(-10f, 402f, 130f, 394f, 260f, 408f, 403f, 400f),
            curve(-10f, 462f, 130f, 454f, 260f, 468f, 403f, 460f), curve(38f, -10f, 44f, 150f, 30f, 350f, 36f, 620f),
            curve(270f, -10f, 276f, 160f, 262f, 380f, 268f, 620f), curve(340f, -10f, 346f, 200f, 330f, 400f, 338f, 620f),
            curve(96f, -10f, 100f, 60f, 92f, 110f, 96f, 154f),
        ).forEach { drawPath(it, palette.street, style = small) }
        listOf(
            floatArrayOf(-10f, 108f, 96f, 104f), floatArrayOf(210f, 100f, 270f, 97f, 340f, 102f, 403f, 98f), floatArrayOf(64f, 196f, 62f, 236f),
            floatArrayOf(230f, 152f, 232f, 200f), floatArrayOf(304f, 56f, 306f, 150f), floatArrayOf(306f, 200f, 304f, 270f),
            floatArrayOf(96f, 336f, 99f, 400f), floatArrayOf(300f, 402f, 303f, 462f), floatArrayOf(184f, 464f, 186f, 620f),
            floatArrayOf(150f, 300f, 210f, 304f), floatArrayOf(60f, 404f, 58f, 462f), floatArrayOf(96f, 462f, 98f, 620f),
            floatArrayOf(38f, 250f, 36f, 280f), floatArrayOf(270f, 300f, 340f, 297f), floatArrayOf(100f, 240f, 100f, 290f, 150f, 292f),
            floatArrayOf(340f, 150f, 403f, 144f),
        ).forEach { p -> drawPath(path { moveTo(p[0], p[1]); for (i in 2 until p.size step 2) lineTo(p[i], p[i + 1]) }, palette.street, style = small) }
        val big = Stroke(8f, cap = StrokeCap.Round)
        drawPath(curve(150f, -10f, 156f, 180f, 144f, 380f, 150f, 620f), palette.street, style = big)
        drawPath(curve(210f, -10f, 214f, 180f, 204f, 380f, 210f, 620f), palette.street, style = big)
        drawPath(curve(-10f, 232f, 90f, 238f, 250f, 262f, 403f, 290f), palette.street, style = Stroke(16f, cap = StrokeCap.Round))

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
