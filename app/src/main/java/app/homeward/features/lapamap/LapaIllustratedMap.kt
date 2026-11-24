package app.homeward.features.lapamap

import androidx.annotation.DrawableRes
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.BoxWithConstraintsScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import app.homeward.R
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType

// The illustrated map of Lapa (Figma "Map/Lapa illustrated"): a drawn base, small place badges with
// their names, the red zone, and a green dot where you are. Used on Home and in the opening story.
// `you` is a spot on the map's own grid (LapaMapProjection.toSpot turns GPS into one); null hides the dot.
// `heading` is the way you are walking, in degrees clockwise from north; the dot gets a small arrow
// pointing that way. Null (standing still, or not known yet) shows the dot with no arrow.
// `redZoneLabel` comes from the saved safety pack, e.g. "RED ZONE\nAFTER 11PM".
// `extra` draws on top of the streets, in the map's grid (the story uses it for the walk).
//
// Two small things move: a ring pulses around the police badge (red, then blue), and a soft circle
// pulses under your dot.
@Composable
fun LapaIllustratedMap(
    you: LapaMapProjection.Spot?,
    heading: Float?,
    redZoneLabel: String,
    modifier: Modifier = Modifier,
    palette: LapaMapPalette = LapaMapPalette.Day,
    extra: DrawScope.() -> Unit = {},
) {
    val loop = rememberInfiniteTransition(label = "map")
    val pulse by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(1800, easing = LinearEasing)), label = "pulse")
    val police by loop.animateFloat(0f, 2f, infiniteRepeatable(tween(2600, easing = LinearEasing)), label = "police")

    BoxWithConstraints(modifier.clipToBounds()) {
        // One step of the drawing's 393-wide grid, in screen dp.
        val unit: Dp = maxWidth / LapaMapProjection.WIDTH
        Canvas(Modifier.fillMaxSize()) { drawLapaBase(unit.toPx(), palette, extra) }

        // Moving rings: around the police badge, and under your dot.
        Canvas(Modifier.fillMaxSize()) {
            scale(unit.toPx(), unit.toPx(), pivot = Offset.Zero) {
                val beat = police % 1f                                   // 0..1, twice per loop
                val ringColor = if (police < 1f) HomewardColors.Red else HomewardColors.Blue
                drawCircle(ringColor.copy(alpha = 0.5f * (1f - beat)), 13f + 9f * beat, Offset(POLICE.x, POLICE.y), style = Stroke(2f))
                you?.let { drawCircle(HomewardColors.Green.copy(alpha = 0.22f * (1f - pulse) + 0.06f), 12f + 10f * pulse, Offset(it.x, it.y)) }
            }
        }

        Place(unit, R.drawable.landmark_bar, "Bar", Offset(41f, 128f), palette.label)
        Place(unit, R.drawable.landmark_catedral, "Cathedral", Offset(321f, 138f), palette.label)
        Place(unit, R.drawable.landmark_police, "Police", POLICE, palette.label)
        Place(unit, R.drawable.landmark_hospital, "Hospital", Offset(63f, 318f), palette.label)
        Place(unit, R.drawable.landmark_arcos, "Arcos da Lapa", Offset(334f, 334f), palette.label)
        Place(unit, R.drawable.landmark_steps, "Selarón steps", Offset(309f, 418f), palette.label)

        MapLabel(unit, redZoneLabel, HomewardType.MapLabel, centerX = 153f, y = 114f, color = palette.zoneLabel)
        // The avenue's name, written just above it.
        Text(
            "AV. MEM DE SÁ", style = HomewardType.MapLabel, color = palette.avenueLabel,
            modifier = Modifier.offset(unit * 292, unit * 254).graphicsLayer { rotationZ = 7.5f },
        )

        // You: a green dot with a white edge, and an arrow on the side you are walking toward.
        you?.let { spot ->
            Canvas(Modifier.fillMaxSize()) {
                scale(unit.toPx(), unit.toPx(), pivot = Offset.Zero) {
                    val center = Offset(spot.x, spot.y)
                    heading?.let { degrees ->
                        rotate(degrees, pivot = center) {
                            // Drawn pointing north (up); the rotate above turns it to the real direction.
                            val arrow = Path().apply { moveTo(center.x, center.y - 19f); lineTo(center.x + 6.5f, center.y - 9f); lineTo(center.x - 6.5f, center.y - 9f); close() }
                            drawPath(arrow, Color.White, style = Stroke(3f, join = StrokeJoin.Round))
                            drawPath(arrow, HomewardColors.Green)
                        }
                    }
                    drawCircle(Color.White, 9.5f, center)
                    drawCircle(HomewardColors.Green, 7f, center)
                }
            }
        }
    }
}

private val POLICE = Offset(249f, 298f)
private const val BADGE = 24f // badge size on the map's grid

// One place: a small badge centered on `center`, with its name underneath.
@Composable
private fun BoxWithConstraintsScope.Place(unit: Dp, @DrawableRes badge: Int, name: String, center: Offset, labelColor: Color) {
    Image(painterResource(badge), contentDescription = name, modifier = Modifier.offset(unit * (center.x - BADGE / 2), unit * (center.y - BADGE / 2)).size(unit * BADGE))
    MapLabel(unit, name, HomewardType.PlaceLabel, centerX = center.x, y = center.y + BADGE / 2 + 2f, color = labelColor)
}

// A small label, centered on centerX.
@Composable
private fun BoxWithConstraintsScope.MapLabel(unit: Dp, text: String, style: TextStyle, centerX: Float, y: Float, color: Color) {
    val boxWidth = 140.dp
    Box(Modifier.offset(unit * centerX - boxWidth / 2, unit * y).width(boxWidth), contentAlignment = Alignment.TopCenter) {
        Text(text, style = style, color = color, textAlign = TextAlign.Center)
    }
}
