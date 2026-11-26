package app.homeward.features.onboarding

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import app.homeward.design.HomewardColors
import app.homeward.features.lapamap.LapaIllustratedMap
import app.homeward.features.lapamap.LapaMapProjection
import kotlin.math.atan2

// The map in the opening story: the SAME illustrated Lapa map as Home (lapamap/), with a walk on top.
//   withBeacon = false -> the green dot walks from the bar into the red zone, leaving a dotted trail; a red ring marks where it ends
//   withBeacon = true  -> the dot waits at the corner, its arrow pointing the new way, and a blue route draws the way around
// Takes about two seconds. Route numbers are in the map's 393 x 520 grid.
@Composable
fun StoryMap(withBeacon: Boolean, modifier: Modifier = Modifier) {
    val progress = remember(withBeacon) { Animatable(0f) }
    LaunchedEffect(withBeacon) { progress.animateTo(1f, tween(2400, delayMillis = 400, easing = LinearEasing)) }
    val start = Offset(78f, 153f) // just outside the bar

    val walk = remember(withBeacon) {
        if (withBeacon) Path().apply {
            // West one block, down to the avenue, then along it past the police station.
            moveTo(start.x, start.y); lineTo(38f, 155f); lineTo(37f, 236f)
            cubicTo(90f, 240f, 150f, 249f, 210f, 259f); cubicTo(232f, 263f, 254f, 266f, 274f, 269f)
        } else Path().apply {
            // The quickest way: straight along the side street and down Rua dos Inválidos.
            moveTo(start.x, start.y); lineTo(150f, 154f); lineTo(151f, 208f)
        }
    }
    val measure = remember(walk) { PathMeasure().apply { setPath(walk, false) } }
    val head = measure.getPosition(measure.length * progress.value)
    val done = progress.value >= 1f
    // With Beacon the dot waits at the corner; without it, it walks the whole way in.
    val you = if (withBeacon) start else head
    // The arrow points along the walk: the way the path runs at that point (0 = up, clockwise).
    val along = measure.getTangent(if (withBeacon) 0f else measure.length * progress.value)
    val heading = Math.toDegrees(atan2(along.x.toDouble(), -along.y.toDouble())).toFloat()

    LapaIllustratedMap(you = LapaMapProjection.Spot(you.x, you.y), heading = heading, redZoneLabel = "RUA DOS\nINVÁLIDOS", modifier = modifier) {
        val drawn = Path().also { measure.getSegment(0f, measure.length * progress.value, it, true) }
        if (withBeacon) {
            // The way he would have gone, faint.
            drawPath(Path().apply { moveTo(start.x, start.y); lineTo(150f, 154f); lineTo(151f, 190f) }, HomewardColors.MapNavy.copy(alpha = 0.45f), style = Stroke(2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(2f, 6f))))
            drawPath(drawn, HomewardColors.Primary, style = Stroke(5f, cap = StrokeCap.Round, join = StrokeJoin.Round))
            if (done) { drawCircle(Color.White, 9f, head); drawCircle(HomewardColors.Primary, 6f, head) } // where the safe walk ends
        } else {
            drawPath(drawn, HomewardColors.MapNavy, style = Stroke(3.5f, cap = StrokeCap.Round, pathEffect = PathEffect.dashPathEffect(floatArrayOf(2f, 8f))))
            if (done) {
                drawCircle(HomewardColors.Red.copy(alpha = 0.5f), 22f, head, style = Stroke(2f))
                drawCircle(HomewardColors.Red.copy(alpha = 0.35f), 14f, head)
            }
        }
    }
}
