package app.homeward.features.onboarding

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.PriorityHigh
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.PrimaryButton
import app.homeward.design.components.WhiteCard

// The first thing a new user sees (Figma "01 Replay" and "02 Replay"): one night in Lapa, told twice.
// First without Beacon, then the same night with Beacon's red-zone warning. Then setup starts.
// The story is based on news reports and the person is not named. Check the source before the pitch.
@Composable
fun StoryStep(onNext: () -> Unit) {
    var withBeacon by remember { mutableStateOf(false) }
    BackHandler(enabled = withBeacon) { withBeacon = false }

    Column(Modifier.fillMaxSize().background(HomewardColors.Background).systemBarsPadding()) {
        Row(Modifier.fillMaxWidth().padding(start = 24.dp, end = 12.dp, top = 12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(if (withBeacon) "The same night, with Beacon" else "", style = HomewardType.Small)
            Text("Skip", style = HomewardType.Label, color = HomewardColors.TextMuted, modifier = Modifier.clickable(onClick = onNext).padding(12.dp))
        }
        Text(
            if (withBeacon) "01:56 · 200 M BEFORE THE TURN" else "01:58 · LAPA, RIO DE JANEIRO",
            style = HomewardType.MapLabel, color = HomewardColors.Text, modifier = Modifier.padding(horizontal = 24.dp),
        )

        Box(Modifier.weight(1f).fillMaxWidth().padding(top = 10.dp)) {
            StoryMap(withBeacon, Modifier.fillMaxSize())
            if (withBeacon) RedZoneAlert(Modifier.align(Alignment.BottomCenter).padding(horizontal = 24.dp, vertical = 20.dp))
        }

        Column(
            Modifier.fillMaxWidth().background(HomewardColors.Background, RoundedCornerShape(topStart = 30.dp, topEnd = 30.dp)).padding(start = 24.dp, end = 24.dp, top = 24.dp, bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Text(
                if (withBeacon) "Same streets, same hour. This time his phone buzzes 200 m before the turn, with no signal, and points him to the busy street home."
                else "He'd been in Rio two days. The bars were closing, his phone had no signal, and the quickest way back ran down an empty street.",
                style = HomewardType.Heading,
            )
            if (withBeacon) PrimaryButton("Start with Beacon", onClick = onNext)
            else PrimaryButton("See the same night with Beacon") { withBeacon = true }
        }
    }
}

// The warning Beacon would have shown: what's ahead, and where to go instead.
@Composable
private fun RedZoneAlert(modifier: Modifier = Modifier) {
    WhiteCard(modifier.fillMaxWidth(), padding = 16) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(Modifier.size(24.dp).background(HomewardColors.Red, RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) {
                Icon(Icons.Outlined.PriorityHigh, null, tint = Color.White, modifier = Modifier.size(16.dp))
            }
            Text("Red zone ahead", style = HomewardType.Label)
        }
        Spacer(Modifier.height(6.dp))
        Text("Rua dos Inválidos empties out after 1 a.m. Turn left now and take Av. Mem de Sá, it stays busy.", style = HomewardType.Small)
    }
}
