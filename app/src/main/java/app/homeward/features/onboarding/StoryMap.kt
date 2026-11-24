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

// The map in the opening story: the SAME illustrated Lapa map as Home (lapamap/), with a walk on top.
//   withBeacon = false -> the person walks from the bar into the red zone, leaving a dotted trail; a red dot marks where it ends
//   withBeacon = true  -> the person stops at the corner and a blue route draws the way around, along the busy avenue
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
    // With Beacon the person waits at the corner; without it, they walk the whole way in.
    val person = if (withBeacon) start else head

    LapaIllustratedMap(person = LapaMapProjection.Spot(person.x, person.y), redZoneLabel = "RUA DOS\nINVÁLIDOS", modifier = modifier) {
        val drawn = Path().also { measure.getSegment(0f, measure.length * progress.value, it, true) }
        if (withBeacon) {
            // The way he would have gone, faint.
            drawPath(Path().apply { moveTo(start.x, start.y); lineTo(150f, 154f); lineTo(151f, 190f) }, HomewardColors.MapNavy.copy(alpha = 0.45f), style = Stroke(2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(2f, 6f))))
            drawPath(drawn, Color.White, style = Stroke(9f, cap = StrokeCap.Round, join = StrokeJoin.Round))
            drawPath(drawn, Color(0xFF4F8BFF), style = Stroke(4.5f, cap = StrokeCap.Round, join = StrokeJoin.Round))
            if (done) { drawCircle(Color.White, 11f, head); drawCircle(HomewardColors.Green, 8f, head) }
        } else {
            drawPath(drawn, HomewardColors.MapNavy, style = Stroke(3.5f, cap = StrokeCap.Round, pathEffect = PathEffect.dashPathEffect(floatArrayOf(2f, 8f))))
            if (done) {
                drawCircle(HomewardColors.Red.copy(alpha = 0.5f), 22f, head, style = Stroke(2f))
                drawCircle(HomewardColors.Red.copy(alpha = 0.35f), 14f, head)
            }
        }
    }
}
