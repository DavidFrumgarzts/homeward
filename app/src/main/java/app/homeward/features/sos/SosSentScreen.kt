package app.homeward.features.sos

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import app.homeward.R
import app.homeward.app.AppServices
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.PrimaryButton
import app.homeward.design.components.WhiteCard
import app.homeward.device.GeoPoint
import app.homeward.features.home.NearbyFeed
import app.homeward.features.policecall.PoliceCaller
import app.homeward.features.safeplace.SafePlacePicker
import java.util.Calendar

// After the SOS goes out (Figma "09 SOS sent"): who knows, the message they got, a one-tap police call,
// and the nearest open safe place.
@Composable
fun SosSentScreen(vm: SosViewModel) {
    val context = LocalContext.current
    val pack = remember { AppServices.packStore.load() }
    val pick = remember {
        val here = AppServices.location.lastKnown() ?: GeoPoint(pack.safePlaces.first().lat, pack.safePlaces.first().lng)
        SafePlacePicker.pick(here, pack.safePlaces, Calendar.getInstance().get(Calendar.HOUR_OF_DAY))
    }
    val reached = vm.results.filter { it.delivered }.map { it.contactName }
    val missed = vm.results.filterNot { it.delivered }.map { it.contactName }

    Column(
        Modifier.fillMaxSize().background(HomewardColors.Background).systemBarsPadding().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp), horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // Green check inside a soft ring
        Box(Modifier.size(132.dp), contentAlignment = Alignment.Center) {
            Canvas(Modifier.fillMaxSize()) {
                drawCircle(HomewardColors.Green.copy(alpha = 0.18f), style = Stroke(3.dp.toPx()))
                drawCircle(HomewardColors.GreenTint, radius = 46.dp.toPx())
            }
            Icon(Icons.Outlined.Check, null, tint = HomewardColors.Green, modifier = Modifier.size(52.dp))
        }
        Text(if (reached.isEmpty()) "SOS not delivered yet" else "${joinNames(reached)} ${if (reached.size == 1) "knows" else "know"}", style = HomewardType.Title, textAlign = TextAlign.Center)
        if (reached.isEmpty()) Text("Stay where people can see you and call the police.", style = HomewardType.Body, color = HomewardColors.TextMuted, textAlign = TextAlign.Center)
        if (missed.isNotEmpty() && reached.isNotEmpty()) Text("Couldn't reach ${joinNames(missed)}.", style = HomewardType.Small, color = HomewardColors.Red)

        // The message they received
        if (vm.draft.isNotBlank()) WhiteCard(Modifier.fillMaxWidth()) { Text(vm.draft, style = HomewardType.Small, color = HomewardColors.Text) }

        PrimaryButton(color = HomewardColors.Red, label = "Call police ${vm.policeNumber}", modifier = Modifier.height(64.dp)) { PoliceCaller.dial(context, vm.policeNumber) }

        pick?.let {
            Row(
                Modifier.fillMaxWidth().border(1.5.dp, HomewardColors.Border, RoundedCornerShape(20.dp)).padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                when (it.place.kind.lowercase()) {
                    "police" -> Image(painterResource(R.drawable.landmark_police), null, Modifier.size(32.dp))
                    "hospital" -> Image(painterResource(R.drawable.landmark_hospital), null, Modifier.size(32.dp))
                    else -> Icon(Icons.Outlined.Place, null, tint = HomewardColors.Green)
                }
                Column {
                    Text("Walk to ${it.place.name}", style = HomewardType.Label, maxLines = 1)
                    Text("${NearbyFeed.distance(it.meters)}, ${if (it.place.open24h) "open 24 hours" else "open now"}", style = HomewardType.Small)
                }
            }
        }

        LocalPhrasesCard(pack.localPhrases)
    }
}

// "Mom", "Mom and Dad", "Mom, Dad and Alwis"
private fun joinNames(names: List<String>): String = when (names.size) {
    0 -> ""
    1 -> names[0]
    else -> names.dropLast(1).joinToString(", ") + " and " + names.last()
}
