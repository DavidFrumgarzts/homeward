package app.homeward.design.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors

// The flat white rounded card used for most blocks (feature rows, contacts, answers).
// No shadow: white on the warm background is enough, as in the Figma design.
@Composable
fun WhiteCard(modifier: Modifier = Modifier, padding: Int = 16, content: @Composable ColumnScope.() -> Unit) {
    val shape = RoundedCornerShape(22.dp)
    Column(modifier.clip(shape).background(HomewardColors.Surface).padding(padding.dp), content = content)
}
