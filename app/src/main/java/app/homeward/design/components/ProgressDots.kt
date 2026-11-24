package app.homeward.design.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors

// Onboarding progress: the current step is a short red bar, the others grey dots.
@Composable
fun ProgressDots(current: Int, total: Int) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        repeat(total) { i ->
            Box(Modifier.size(if (i == current) 20.dp else 6.dp, 6.dp).background(if (i == current) HomewardColors.Red else HomewardColors.Border, RoundedCornerShape(3.dp)))
        }
    }
}
