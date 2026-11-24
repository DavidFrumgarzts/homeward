package app.homeward.features.lapamap

import androidx.annotation.DrawableRes
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
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
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import app.homeward.R
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import kotlin.math.sin

// The illustrated map of Lapa (Figma "Map/Lapa illustrated"): a drawn base, landmark pictures,
// a few labels, and a small person where you are. Used on Home and in the opening story.
// `person` is a spot on the map's own grid (LapaMapProjection.toSpot turns GPS into one); null hides it.
// `redZoneLabel` comes from the saved safety pack, e.g. "RED ZONE\nAFTER 11PM".
// `extra` draws on top of the streets, in the map's grid (the story uses it for the walk).
//
// Three small things move, so the map feels alive: the police lights blink, the tram rides
// along the arches, and a soft circle pulses under the person.
@Composable
fun LapaIllustratedMap(
    person: LapaMapProjection.Spot?,
    redZoneLabel: String,
    modifier: Modifier = Modifier,
    palette: LapaMapPalette = LapaMapPalette.Day,
    extra: DrawScope.() -> Unit = {},
) {
    val loop = rememberInfiniteTransition(label = "map")
    val pulse by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(1800, easing = LinearEasing)), label = "pulse")
    val blink by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(1100, easing = LinearEasing)), label = "blink")
    val tram by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(7000, easing = LinearEasing), RepeatMode.Reverse), label = "tram")

    BoxWithConstraints(modifier.clipToBounds()) {
        // One step of the drawing's 393-wide grid, in screen dp.
        val unit: Dp = maxWidth / LapaMapProjection.WIDTH
        Canvas(Modifier.fillMaxSize()) { drawLapaBase(unit.toPx(), palette, extra) }

        // The pulsing circle on the ground under the person.
        person?.let { spot ->
            Canvas(Modifier.fillMaxSize()) {
                scale(unit.toPx(), unit.toPx(), pivot = Offset.Zero) {
                    drawCircle(HomewardColors.Blue.copy(alpha = 0.22f * (1f - pulse) + 0.06f), 14f + 12f * pulse, Offset(spot.x, spot.y))
                }
            }
        }

        Landmark(unit, R.drawable.landmark_bar, "Bar", x = 20f, y = 100f, w = 42, h = 42)
        Landmark(unit, R.drawable.landmark_catedral, "Cathedral", x = 292f, y = 96f, w = 58, h = 58)
        Landmark(unit, R.drawable.landmark_police, "Police station", x = POLICE_X, y = POLICE_Y, w = 50, h = 50)
        Landmark(unit, R.drawable.landmark_hospital, "Hospital", x = 40f, y = 292f, w = 46, h = 46)
        Landmark(unit, R.drawable.landmark_arcos, "Arcos da Lapa", x = ARCOS_X, y = 300f, w = 96, h = 54)
        Landmark(unit, R.drawable.landmark_tram, "Tram", x = ARCOS_X + 6f + 60f * tram, y = 301f, w = 24, h = 13)
        Landmark(unit, R.drawable.landmark_steps, "Selarón steps", x = 286f, y = 390f, w = 46, h = 48)

        // Police lights: red and blue take turns glowing.
        Canvas(Modifier.fillMaxSize()) {
            scale(unit.toPx(), unit.toPx(), pivot = Offset.Zero) {
                val red = ((sin(blink * 2 * Math.PI) + 1) / 2).toFloat()
                drawCircle(HomewardColors.Red.copy(alpha = 0.45f * red), 6f, Offset(POLICE_X + 22.2f, POLICE_Y + 5.2f))
                drawCircle(HomewardColors.Blue.copy(alpha = 0.45f * (1f - red)), 6f, Offset(POLICE_X + 27.8f, POLICE_Y + 5.2f))
            }
        }

        // Only the labels that help in an emergency.
        MapLabel(unit, "POLICE", centerX = 249, y = 322, color = palette.label)
        MapLabel(unit, "HOSPITAL", centerX = 63, y = 343, color = palette.label)
        MapLabel(unit, redZoneLabel, centerX = 153, y = 114, color = palette.zoneLabel)
        // The avenue's name, written along it in white.
        Text(
            "AV. MEM DE SÁ", style = HomewardType.MapLabel, color = palette.avenueLabel,
            modifier = Modifier.offset(unit * 292, unit * 268).rotate(7.5f),
        )

        // You: the person stands with their feet on the spot.
        person?.let { Landmark(unit, R.drawable.landmark_person, "You are here", x = it.x - 12f, y = it.y - 35f, w = 24, h = 36) }
    }
}

private const val POLICE_X = 224f
private const val POLICE_Y = 270f
private const val ARCOS_X = 286f

// One picture, placed by its top-left corner on the drawing's grid.
@Composable
private fun BoxWithConstraintsScope.Landmark(unit: Dp, @DrawableRes picture: Int, name: String, x: Float, y: Float, w: Int, h: Int) {
    Image(painterResource(picture), contentDescription = name, modifier = Modifier.offset(unit * x, unit * y).size(unit * w, unit * h))
}

// A small capital-letter label, centered on centerX.
@Composable
private fun BoxWithConstraintsScope.MapLabel(unit: Dp, text: String, centerX: Int, y: Int, color: Color) {
    val boxWidth = 140.dp
    Box(Modifier.offset(unit * centerX - boxWidth / 2, unit * y).width(boxWidth), contentAlignment = Alignment.TopCenter) {
        Text(text, style = HomewardType.MapLabel, color = color, textAlign = TextAlign.Center)
    }
}
