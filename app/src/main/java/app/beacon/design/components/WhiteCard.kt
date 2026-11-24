package app.beacon.design.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.unit.dp
import app.beacon.design.BeaconColors

// The white rounded card with a soft shadow used for most blocks (contacts, safe place, delivery list).
@Composable
fun WhiteCard(modifier: Modifier = Modifier, padding: Int = 16, content: @Composable ColumnScope.() -> Unit) {
    val shape = RoundedCornerShape(20.dp)
    Column(
        modifier
            .shadow(6.dp, shape, ambientColor = BeaconColors.Text.copy(alpha = 0.06f), spotColor = BeaconColors.Text.copy(alpha = 0.08f))
            .background(BeaconColors.Surface, shape)
            .padding(padding.dp),
        content = content,
    )
}
