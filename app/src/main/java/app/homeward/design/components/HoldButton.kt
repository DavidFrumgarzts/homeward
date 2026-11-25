package app.homeward.design.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import kotlinx.coroutines.launch

// A button that only fires after being held for about a second and a half, so it can't go off in a
// pocket. A darker fill grows across it while you hold; letting go early cancels.
// With TalkBack on, a double tap activates it (a timed hold is hard to do with a screen reader).
@Composable
fun HoldButton(label: String, modifier: Modifier = Modifier, color: Color = HomewardColors.Red, holdMillis: Int = 1500, onHeld: () -> Unit) {
    val fill = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()
    val haptics = LocalHapticFeedback.current
    Box(
        modifier.fillMaxWidth().height(64.dp).clip(RoundedCornerShape(20.dp)).background(color)
            .semantics(mergeDescendants = true) {
                role = Role.Button
                contentDescription = label
                onClick(label = "start") { onHeld(); true }
            }
            .pointerInput(Unit) {
                detectTapGestures(onPress = {
                    val holding = scope.launch {
                        fill.animateTo(1f, tween(holdMillis, easing = LinearEasing))
                        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                        onHeld()
                        fill.snapTo(0f)
                    }
                    tryAwaitRelease()
                    if (holding.isActive) { holding.cancel(); fill.animateTo(0f, tween(150)) } // let go too early
                })
            }
            .drawBehind { drawRect(Color.Black.copy(alpha = 0.22f), size = Size(size.width * fill.value, size.height)) },
        contentAlignment = Alignment.Center,
    ) {
        Text(if (fill.value > 0f) "Keep holding…" else label, style = HomewardType.Heading, color = Color.White)
    }
}
