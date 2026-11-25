package app.homeward.design.components

import android.provider.Settings
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import app.homeward.design.HomewardColors
import kotlinx.coroutines.delay

// PURE LOGIC: when the "go here" ring is showing. Tested in BlinkTest.
object Blink {
    const val BLINK_MILLIS = 8_000L
    private const val PERIOD_MILLIS = 1_000L

    fun visible(elapsedMillis: Long, animationsOn: Boolean, blinkMillis: Long = BLINK_MILLIS): Boolean =
        !animationsOn || elapsedMillis >= blinkMillis || elapsedMillis % PERIOD_MILLIS < PERIOD_MILLIS / 2
}

// True/false as the ring blinks for `key` (a new key starts a new 8-second blink). Steady if animations are off.
@Composable
fun rememberBlinkOn(key: Any?, blinkMillis: Long = Blink.BLINK_MILLIS): Boolean {
    val context = LocalContext.current
    val animationsOn = remember { Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) > 0f }
    var on by remember(key) { mutableStateOf(true) }
    LaunchedEffect(key) {
        val start = System.currentTimeMillis()
        while (true) {
            val elapsed = System.currentTimeMillis() - start
            on = Blink.visible(elapsed, animationsOn, blinkMillis)
            if (elapsed >= blinkMillis || !animationsOn) break
            delay(100)
        }
    }
    return on
}

// The yellow ring around the place Beacon recommends (Ask Beacon answer or scan check). Size it with `modifier`.
@Composable
fun BlinkingRing(modifier: Modifier, key: Any?, color: Color = HomewardColors.Yellow, blinkMillis: Long = Blink.BLINK_MILLIS) {
    val on = rememberBlinkOn(key, blinkMillis)
    Box(modifier) {
        if (on) Canvas(Modifier.matchParentSize()) {
            drawCircle(color.copy(alpha = 0.25f))
            drawCircle(color, style = Stroke(width = size.minDimension * 0.08f))
        }
    }
}
