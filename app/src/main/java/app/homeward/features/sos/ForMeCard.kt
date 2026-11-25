package app.homeward.features.sos

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import app.homeward.R
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.PrimaryButton
import app.homeward.design.components.WhiteCard
import app.homeward.features.home.NearbyFeed
import app.homeward.features.incident.contracts.IncidentViewState

// The "for me" part of the active SOS screen, in the order of Figma "09 SOS sent": the red call
// button, the nearest open place to walk to, then the reviewed steps for her situation.
// The steps are fixed text; the number and the place come from the saved pack.
@Composable
fun ForMeCard(view: IncidentViewState, onCall: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(18.dp)) {
        PrimaryButton(color = HomewardColors.Red, label = "Call ${view.emergencyLabel} ${view.emergencyNumber}", modifier = Modifier.height(64.dp), onClick = onCall)

        view.suggestedPlace?.let { pick ->
            Row(
                Modifier.fillMaxWidth().border(1.5.dp, HomewardColors.Border, RoundedCornerShape(20.dp)).padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                when (pick.place.kind.lowercase()) {
                    "police" -> Image(painterResource(R.drawable.landmark_police), null, Modifier.size(32.dp))
                    "hospital" -> Image(painterResource(R.drawable.landmark_hospital), null, Modifier.size(32.dp))
                    else -> Icon(Icons.Outlined.Place, null, tint = HomewardColors.Green)
                }
                Column {
                    Text("Walk to ${pick.place.name}", style = HomewardType.Label, maxLines = 1)
                    Text("${NearbyFeed.distance(pick.meters)}, ${if (pick.place.open24h) "open 24 hours" else "open now"}", style = HomewardType.Small)
                }
            }
        }

        if (view.forMe.isNotEmpty()) WhatToDoCard(view.forMe)
    }
}

// The reviewed steps: a flat white card, numbered on soft blue dots, three shown until she asks for more.
@Composable
private fun WhatToDoCard(steps: List<String>) {
    var showAll by remember { mutableStateOf(false) }
    WhiteCard(Modifier.fillMaxWidth()) {
        Text("What to do now", style = HomewardType.Label)
        (if (showAll) steps else steps.take(3)).forEachIndexed { i, step ->
            Row(Modifier.padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(Modifier.size(26.dp).background(HomewardColors.PrimaryTint, CircleShape), contentAlignment = Alignment.Center) {
                    Text("${i + 1}", style = HomewardType.Small, color = HomewardColors.Primary)
                }
                Text(step, style = HomewardType.Body, modifier = Modifier.weight(1f))
            }
        }
        if (steps.size > 3 && !showAll) {
            Text("Show all ${steps.size} steps", style = HomewardType.Small, color = HomewardColors.Primary, modifier = Modifier.padding(top = 8.dp).clickable { showAll = true }.padding(vertical = 8.dp))
        }
    }
}
