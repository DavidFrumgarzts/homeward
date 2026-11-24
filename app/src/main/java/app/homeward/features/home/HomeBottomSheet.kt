package app.homeward.features.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Phone
import androidx.compose.material.icons.outlined.PhotoCamera
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.RoundAction
import app.homeward.design.components.StatusDot

// Find My-style sheet at the bottom of Home: where you are, pack status, the SOS button,
// and three round actions. Nothing else.
@Composable
fun HomeBottomSheet(
    city: String,
    country: String,
    police: String,
    contactNames: String,
    nearby: List<NearbyFeed.Item>,
    onEditContacts: () -> Unit,
    onSos: () -> Unit,
    onPhoto: () -> Unit,
    onSafePlace: () -> Unit,
    onPolice: () -> Unit,
    onImOk: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier.fillMaxWidth().shadow(12.dp, RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
            .background(HomewardColors.Surface, RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
            .padding(start = 20.dp, end = 20.dp, top = 10.dp, bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Box(Modifier.align(Alignment.CenterHorizontally).size(40.dp, 4.dp).background(HomewardColors.Border, RoundedCornerShape(2.dp)))
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(city, style = HomewardType.Title)
            StatusDot("$country pack saved · works offline", HomewardColors.Green)
        }
        // SOS: the biggest thing on screen, one tap.
        Column(
            Modifier.fillMaxWidth().shadow(8.dp, RoundedCornerShape(18.dp)).background(HomewardColors.Red, RoundedCornerShape(18.dp))
                .clickable(onClick = onSos).padding(vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text("SOS", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text("Works with no signal", color = Color.White.copy(alpha = 0.85f), fontSize = 12.sp)
        }
        // Who gets the SOS, with a way to change it.
        Row(Modifier.fillMaxWidth().clickable(onClick = onEditContacts), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(if (contactNames.isBlank()) "No one gets your SOS yet" else "SOS goes to $contactNames", style = HomewardType.Small, modifier = Modifier.weight(1f))
            Text(if (contactNames.isBlank()) "Add" else "Edit", color = HomewardColors.Red, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) {
            RoundAction("I'm OK", Icons.Outlined.CheckCircle, onImOk)
            RoundAction("Photo", Icons.Outlined.PhotoCamera, onPhoto)
            RoundAction("Safe place", Icons.Outlined.Place, onSafePlace)
            RoundAction("Police $police", Icons.Outlined.Phone, onPolice)
        }
        NearbyList(nearby)
    }
}
