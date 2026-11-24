package app.beacon.design.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Map
import androidx.compose.material.icons.outlined.People
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import app.beacon.design.BeaconColors

// The pill-shaped bottom navigation: Home, Map, Contacts. The selected tab turns into a red pill.
enum class Tab(val label: String, val icon: ImageVector) {
    Home("Home", Icons.Outlined.Home),
    Map("Map", Icons.Outlined.Map),
    Contacts("Contacts", Icons.Outlined.People),
}

@Composable
fun BottomBar(selected: Tab, onSelect: (Tab) -> Unit, modifier: Modifier = Modifier) {
    val pill = RoundedCornerShape(50)
    Row(
        modifier.fillMaxWidth().shadow(6.dp, pill).background(BeaconColors.Surface, pill).padding(8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Tab.entries.forEach { tab ->
            val isOn = tab == selected
            Row(
                Modifier
                    .background(if (isOn) BeaconColors.Red else Color.Transparent, pill)
                    .clickable { onSelect(tab) }
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(tab.icon, tab.label, tint = if (isOn) Color.White else BeaconColors.TextMuted, modifier = Modifier.size(22.dp))
                if (isOn) Text(tab.label, color = Color.White, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}
