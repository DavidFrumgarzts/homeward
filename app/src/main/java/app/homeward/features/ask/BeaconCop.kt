package app.homeward.features.ask

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import kotlin.math.abs
import kotlin.math.sin

// What the cop is doing right now.
enum class CopMood { Idle, Thinking, Talking }

// Beacon's face in the chat: a small friendly police officer, drawn in the same line style as the map
// (Figma "Character/Beacon cop"). It is drawn here, piece by piece, so the pieces can move:
//   always   -> a gentle bob, and a blink every few seconds
//   Thinking -> the eyes look up and three dots bounce
//   Talking  -> the mouth opens and closes
// Numbers are in the drawing's own 64 x 72 grid.
@Composable
fun BeaconCop(mood: CopMood, size: Dp = 88.dp, modifier: Modifier = Modifier) {
    val loop = rememberInfiniteTransition(label = "cop")
    val bob by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(2600, easing = LinearEasing)), label = "bob")
    val blinkClock by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(3400, easing = LinearEasing)), label = "blink")
    val talk by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(260, easing = LinearEasing)), label = "talk")
    val dots by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(900, easing = LinearEasing)), label = "dots")

    val navy = HomewardColors.MapNavy
    val cream = Color(0xFFFFF8EC)
    Canvas(modifier.size(size * 64f / 72f, size)) {
        val unit = this.size.height / 72f
        scale(unit, unit, pivot = Offset.Zero) {
            translate(top = sin(bob * 2 * Math.PI).toFloat() * 0.8f) {
                // Uniform
                val body = Path().apply { moveTo(9f, 71f); cubicTo(9f, 53f, 19f, 45f, 32f, 45f); cubicTo(45f, 45f, 55f, 53f, 55f, 71f); close() }
                drawPath(body, HomewardColors.Primary)
                drawPath(body, navy, style = Stroke(2f, join = StrokeJoin.Round))
                drawPath(Path().apply { moveTo(26f, 46f); lineTo(32f, 53f); lineTo(38f, 46f) }, cream, style = Stroke(2.2f, cap = StrokeCap.Round, join = StrokeJoin.Round))
                // Badge on the chest
                val badge = Path().apply { moveTo(42f, 56f); lineTo(45.5f, 57.4f); lineTo(45.5f, 60f); cubicTo(45.5f, 62f, 44f, 63.2f, 42f, 63.8f); cubicTo(40f, 63.2f, 38.5f, 62f, 38.5f, 60f); lineTo(38.5f, 57.4f); close() }
                drawPath(badge, Color(0xFFF6B93B)); drawPath(badge, navy, style = Stroke(1.2f, join = StrokeJoin.Round))

                // Head
                drawCircle(cream, 15f, Offset(32f, 29f)); drawCircle(navy, 15f, Offset(32f, 29f), style = Stroke(2f))
                // Cap
                drawPath(Path().apply { moveTo(17.5f, 18f); cubicTo(17.5f, 6f, 46.5f, 6f, 46.5f, 18f); close() }, navy)
                drawRoundRect(navy, Offset(14f, 16.5f), Size(36f, 5f), CornerRadius(2.5f))
                drawCircle(Color(0xFFF6B93B), 2.7f, Offset(32f, 11.5f))

                // Eyes: closed for a moment at the end of each blink cycle; looking up while thinking
                val blinking = blinkClock > 0.95f
                val eyeY = if (mood == CopMood.Thinking) 28f else 30f
                listOf(26f, 38f).forEach { x ->
                    if (blinking) drawLine(navy, Offset(x - 2f, eyeY), Offset(x + 2f, eyeY), strokeWidth = 1.8f, cap = StrokeCap.Round)
                    else drawCircle(navy, 1.9f, Offset(x, eyeY))
                }
                // Cheeks
                drawCircle(HomewardColors.Red.copy(alpha = 0.18f), 2.6f, Offset(22.5f, 34f)); drawCircle(HomewardColors.Red.copy(alpha = 0.18f), 2.6f, Offset(41.5f, 34f))

                // Mouth
                when (mood) {
                    CopMood.Talking -> {
                        val open = 1.2f + 2.6f * abs(sin(talk * Math.PI)).toFloat()
                        drawOval(navy, Offset(32f - 3.2f, 36.5f - open), Size(6.4f, open * 2))
                    }
                    CopMood.Thinking -> drawLine(navy, Offset(29f, 37f), Offset(35f, 37f), strokeWidth = 1.8f, cap = StrokeCap.Round)
                    CopMood.Idle -> drawPath(Path().apply { moveTo(27.5f, 35.5f); quadraticBezierTo(32f, 39.5f, 36.5f, 35.5f) }, navy, style = Stroke(1.8f, cap = StrokeCap.Round))
                }
            }
            // Three bouncing dots beside the head while thinking
            if (mood == CopMood.Thinking) repeat(3) { i ->
                val lift = abs(sin((dots + i * 0.18f) * Math.PI)).toFloat() * 3f
                drawCircle(HomewardColors.Primary, 1.8f, Offset(52f + i * 5f, 24f - lift))
            }
        }
    }
}
