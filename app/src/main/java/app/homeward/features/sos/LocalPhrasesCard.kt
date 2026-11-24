package app.homeward.features.sos

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.WhiteCard
import app.homeward.features.safetypack.Phrase

// "Show this to people nearby": emergency phrases in the local language, big enough to hold up.
// Comes from the saved safety pack, so it works offline.
@Composable
fun LocalPhrasesCard(phrases: List<Phrase>) {
    if (phrases.isEmpty()) return
    WhiteCard(Modifier.fillMaxWidth()) {
        Text("Show to people nearby", style = HomewardType.Label)
        phrases.take(3).forEach {
            Spacer(Modifier.height(10.dp))
            Text(it.local, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = HomewardColors.Text)
            Text(it.english, style = HomewardType.Small)
        }
    }
}
