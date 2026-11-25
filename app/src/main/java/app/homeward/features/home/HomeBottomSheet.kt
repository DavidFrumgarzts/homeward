package app.homeward.features.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Phone
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import app.homeward.R
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.HoldButton
import app.homeward.design.components.WhiteCard
import app.homeward.features.safeplace.SafePlacePicker

// The sheet at the bottom of Home (Figma "07 Home"), top to bottom:
// Ask Beacon box, two ready-made questions, the nearest open safe place, I'm OK + Scan + Police, and Hold for SOS.
@Composable
fun HomeBottomSheet(
    police: String,
    contactNames: String,
    safePlace: SafePlacePicker.Pick?,
    sosActive: Boolean,            // an SOS is already running: the button opens it instead of starting one
    onAsk: (String) -> Unit,       // "" opens Ask Beacon empty; a ready-made question asks it right away
    onScan: () -> Unit,            // the scan check: is this board, meter or price legit?
    onSafePlace: () -> Unit,
    onImOk: () -> Unit,
    onPolice: () -> Unit,
    onSos: () -> Unit,
    onEditContacts: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier.fillMaxWidth().background(HomewardColors.Background, RoundedCornerShape(topStart = 30.dp, topEnd = 30.dp))
            .navigationBarsPadding().padding(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(Modifier.size(40.dp, 5.dp).background(HomewardColors.Border, RoundedCornerShape(3.dp)))

        // Ask Beacon
        Row(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(HomewardColors.Surface).clickable { onAsk("") }.padding(start = 18.dp, end = 6.dp, top = 6.dp, bottom = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Ask Beacon anything", style = HomewardType.Body, color = HomewardColors.TextMuted, modifier = Modifier.weight(1f))
            Box(Modifier.size(48.dp).background(HomewardColors.Primary, RoundedCornerShape(16.dp)), contentAlignment = Alignment.Center) {
                Icon(Icons.AutoMirrored.Outlined.ArrowForward, null, tint = Color.White)
            }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Is this area OK now?", "Where's a safe place?").forEach { q ->
                Text(q, style = HomewardType.Small, color = HomewardColors.Text, modifier = Modifier.clip(RoundedCornerShape(50)).border(1.dp, HomewardColors.Border, RoundedCornerShape(50)).clickable { onAsk(q) }.padding(horizontal = 12.dp, vertical = 8.dp))
            }
        }

        // Nearest open safe place
        safePlace?.let { pick ->
            WhiteCard(Modifier.fillMaxWidth().clickable(onClick = onSafePlace), padding = 14) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(Modifier.size(40.dp).background(HomewardColors.MapPaper, RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
                        when (pick.place.kind.lowercase()) {
                            "police" -> Image(painterResource(R.drawable.landmark_police), null, Modifier.size(30.dp))
                            "hospital" -> Image(painterResource(R.drawable.landmark_hospital), null, Modifier.size(30.dp))
                            else -> Icon(Icons.Outlined.Place, null, tint = HomewardColors.Green)
                        }
                    }
                    Column {
                        Text("${pick.place.name} · ${NearbyFeed.distance(pick.meters)}", style = HomewardType.Label, maxLines = 1)
                        Text(if (pick.place.open24h) "Open 24 hours" else "Open now", style = HomewardType.Small)
                    }
                }
            }
        }

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            QuickAction("I'm OK", Icons.Outlined.Check, HomewardColors.Green, Modifier.weight(1f), onImOk)
            QuickAction("Scan", Icons.Outlined.CameraAlt, HomewardColors.Primary, Modifier.weight(1f), onScan)
            QuickAction("Police $police", Icons.Outlined.Phone, HomewardColors.Red, Modifier.weight(1f), onPolice)
        }

        // SOS: the biggest thing on the sheet, and the only red one. Held, so it can't go off in a pocket.
        if (sosActive) {
            Box(Modifier.fillMaxWidth().height(64.dp).clip(RoundedCornerShape(20.dp)).background(HomewardColors.Red).clickable(onClick = onSos), contentAlignment = Alignment.Center) {
                Text("SOS is on · tap to open", style = HomewardType.Heading, color = Color.White)
            }
        } else HoldButton("Hold for SOS · works with no signal", onHeld = onSos)
        // Who gets the SOS, with a way to change it.
        Row(Modifier.fillMaxWidth().clickable(onClick = onEditContacts), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(if (contactNames.isBlank()) "No one gets your SOS yet" else "Goes to $contactNames", style = HomewardType.Small, modifier = Modifier.weight(1f), maxLines = 1)
            Text(if (contactNames.isBlank()) "Add" else "Edit", style = HomewardType.Small, color = HomewardColors.Primary)
        }
    }
}

@Composable
private fun QuickAction(label: String, icon: ImageVector, tint: Color, modifier: Modifier, onClick: () -> Unit) {
    Row(
        modifier.clip(RoundedCornerShape(18.dp)).background(HomewardColors.Surface).clickable(onClick = onClick).padding(vertical = 14.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally), verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, null, tint = tint, modifier = Modifier.size(20.dp))
        Text(label, style = HomewardType.Label)
    }
}
