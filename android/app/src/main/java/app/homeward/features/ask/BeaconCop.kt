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

// Beacon's face in the chat: a classic cartoon police officer (peaked cap with a gold badge, navy shirt
// with a collar, pocket and badge, dark outlines), with a friendly face. Figma: "Character/Beacon cop".
// It is drawn here, piece by piece, so it stays sharp at any size and the pieces can move:
//   always   -> a gentle bob, and a blink every few seconds
//   Thinking -> the eyes look up and three dots bounce
//   Talking  -> the mouth opens and closes
// Numbers are in the drawing's own 64 x 72 grid.
@Composable
fun BeaconCop(mood: CopMood, size: Dp = 60.dp, modifier: Modifier = Modifier) {
    val loop = rememberInfiniteTransition(label = "cop")
    val bob by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(2600, easing = LinearEasing)), label = "bob")
    val blinkClock by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(3400, easing = LinearEasing)), label = "blink")
    val talk by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(260, easing = LinearEasing)), label = "talk")
    val dots by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(900, easing = LinearEasing)), label = "dots")

    val line = Color(0xFF14213D)      // dark outline
    val uniform = Color(0xFF2B3D66)   // navy shirt and cap
    val uniformLight = Color(0xFF3A5088)
    val skin = Color(0xFFF2C6A0)
    val hair = Color(0xFF2B2118)
    val gold = Color(0xFFF2B33D)
    Canvas(modifier.size(size * 64f / 72f, size)) {
        val unit = this.size.height / 72f
        scale(unit, unit, pivot = Offset.Zero) {
            translate(top = sin(bob * 2 * Math.PI).toFloat() * 0.8f) {
                val outline = Stroke(2.2f, cap = StrokeCap.Round, join = StrokeJoin.Round)
                val thin = Stroke(1.5f, cap = StrokeCap.Round, join = StrokeJoin.Round)

                // Neck, then the uniform shirt over it
                drawRect(skin, Offset(26.5f, 44f), Size(11f, 10f))
                val shirt = Path().apply { moveTo(5f, 72f); cubicTo(5f, 59f, 13f, 53f, 24f, 51f); lineTo(40f, 51f); cubicTo(51f, 53f, 59f, 59f, 59f, 72f); close() }
                drawPath(shirt, uniform); drawPath(shirt, line, style = outline)
                drawLine(line, Offset(32f, 59f), Offset(32f, 72f), strokeWidth = 1.5f)
                // Collar
                val collarLeft = Path().apply { moveTo(25f, 50f); lineTo(32f, 59f); lineTo(26.5f, 63f); lineTo(21f, 53f); close() }
                val collarRight = Path().apply { moveTo(39f, 50f); lineTo(32f, 59f); lineTo(37.5f, 63f); lineTo(43f, 53f); close() }
                listOf(collarLeft, collarRight).forEach { drawPath(it, uniformLight); drawPath(it, line, style = thin) }
                // Chest pocket and gold badge
                drawRoundRect(line, Offset(12.5f, 63f), Size(9.5f, 7.5f), CornerRadius(1f), style = thin)
                drawLine(line, Offset(12.5f, 65.6f), Offset(22f, 65.6f), strokeWidth = 1.2f)
                val badge = Path().apply { moveTo(45f, 60.5f); lineTo(49f, 62f); lineTo(49f, 65f); cubicTo(49f, 67.4f, 47.2f, 68.8f, 45f, 69.5f); cubicTo(42.8f, 68.8f, 41f, 67.4f, 41f, 65f); lineTo(41f, 62f); close() }
                drawPath(badge, gold); drawPath(badge, line, style = thin)

                // Ears, head, sideburns
                listOf(18.6f, 45.4f).forEach { x -> drawCircle(skin, 3.2f, Offset(x, 34f)); drawCircle(line, 3.2f, Offset(x, 34f), style = thin) }
                val head = Path().apply { moveTo(19f, 26f); cubicTo(19f, 41f, 24f, 49f, 32f, 49f); cubicTo(40f, 49f, 45f, 41f, 45f, 26f); close() }
                drawPath(head, skin); drawPath(head, line, style = outline)
                drawRect(hair, Offset(19.8f, 26f), Size(2.6f, 6.5f)); drawRect(hair, Offset(41.6f, 26f), Size(2.6f, 6.5f))

                // Peaked cap: wide crown, band, dark visor, gold badge
                val crown = Path().apply { moveTo(13f, 22.5f); cubicTo(10.5f, 10f, 23f, 5f, 32f, 5f); cubicTo(41f, 5f, 53.5f, 10f, 51f, 22.5f); cubicTo(44f, 19.5f, 20f, 19.5f, 13f, 22.5f); close() }
                drawPath(crown, uniform); drawPath(crown, line, style = outline)
                val band = Path().apply { moveTo(16.5f, 22f); cubicTo(22f, 19.6f, 42f, 19.6f, 47.5f, 22f); lineTo(47.5f, 27f); lineTo(16.5f, 27f); close() }
                drawPath(band, uniformLight); drawPath(band, line, style = thin)
                val visor = Path().apply { moveTo(16.5f, 27f); cubicTo(21f, 31.5f, 43f, 31.5f, 47.5f, 27f); cubicTo(42f, 25.6f, 22f, 25.6f, 16.5f, 27f); close() }
                drawPath(visor, line); drawPath(visor, line, style = thin)
                val capBadge = Path().apply { moveTo(32f, 9f); lineTo(35.4f, 10.4f); lineTo(35.4f, 13.2f); cubicTo(35.4f, 15.2f, 33.9f, 16.5f, 32f, 17.2f); cubicTo(30.1f, 16.5f, 28.6f, 15.2f, 28.6f, 13.2f); lineTo(28.6f, 10.4f); close() }
                drawPath(capBadge, gold); drawPath(capBadge, line, style = thin)

                // Face. Eyes close for a moment at the end of each blink cycle and look up while thinking.
                val blinking = blinkClock > 0.95f
                val eyeY = if (mood == CopMood.Thinking) 35f else 36.2f
                drawLine(line, Offset(23.8f, 33.2f), Offset(28.8f, 32.6f), strokeWidth = 1.7f, cap = StrokeCap.Round)
                drawLine(line, Offset(35.2f, 32.6f), Offset(40.2f, 33.2f), strokeWidth = 1.7f, cap = StrokeCap.Round)
                listOf(26.6f, 37.4f).forEach { x ->
                    if (blinking) drawLine(line, Offset(x - 1.8f, eyeY), Offset(x + 1.8f, eyeY), strokeWidth = 1.7f, cap = StrokeCap.Round)
                    else drawCircle(line, 1.7f, Offset(x, eyeY))
                }
                drawPath(Path().apply { moveTo(32.2f, 37f); quadraticBezierTo(34f, 40f, 31.4f, 40.6f) }, line, style = Stroke(1.4f, cap = StrokeCap.Round))
                when (mood) {
                    CopMood.Talking -> {
                        val open = 1f + 2.2f * abs(sin(talk * Math.PI)).toFloat()
                        drawOval(line, Offset(32f - 3f, 43.6f - open), Size(6f, open * 2))
                    }
                    CopMood.Thinking -> drawLine(line, Offset(29.2f, 44f), Offset(34.8f, 44f), strokeWidth = 1.7f, cap = StrokeCap.Round)
                    CopMood.Idle -> drawPath(Path().apply { moveTo(27.6f, 42.6f); quadraticBezierTo(32f, 46.4f, 36.4f, 42.6f) }, line, style = Stroke(1.7f, cap = StrokeCap.Round))
                }
            }
            // Three bouncing dots beside the head while thinking
            if (mood == CopMood.Thinking) repeat(3) { i ->
                val lift = abs(sin((dots + i * 0.18f) * Math.PI)).toFloat() * 3f
                drawCircle(HomewardColors.Primary, 1.8f, Offset(54f + i * 4.2f, 30f - lift))
            }
        }
    }
}
