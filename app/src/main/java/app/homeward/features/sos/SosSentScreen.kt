package app.homeward.features.sos

import androidx.compose.foundation.background
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import app.homeward.app.AppServices
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.PrimaryButton
import app.homeward.design.components.WhiteCard
import app.homeward.device.GeoPoint
import app.homeward.features.policecall.PoliceCaller
import app.homeward.features.safeplace.SafePlacePicker
import java.util.Calendar

// Step 2 of SOS: who got it and how (push / SMS / SMS with no data), a one-tap local police call,
// and the nearest open safe place with the reason it was picked.
@Composable
fun SosSentScreen(vm: SosViewModel) {
    val context = LocalContext.current
    val pack = remember { AppServices.packStore.load() }
    val pick = remember {
        val here = AppServices.location.lastKnown() ?: GeoPoint(pack.safePlaces.first().lat, pack.safePlaces.first().lng)
        SafePlacePicker.pick(here, pack.safePlaces, Calendar.getInstance().get(Calendar.HOUR_OF_DAY))
    }

    Column(Modifier.fillMaxSize().background(HomewardColors.Background).verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(Modifier.size(72.dp).background(HomewardColors.Green.copy(alpha = 0.15f), CircleShape), contentAlignment = Alignment.Center) {
                Icon(Icons.Outlined.Check, null, tint = HomewardColors.Green, modifier = Modifier.size(34.dp))
            }
            Text("SOS sent", style = HomewardType.Title)
            Text("Stay where people can see you.", style = HomewardType.Small)
        }

        WhiteCard(Modifier.fillMaxWidth(), padding = 0) {
            vm.results.forEachIndexed { i, r ->
                if (i > 0) HorizontalDivider(color = HomewardColors.Border)
                Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(r.contactName, style = HomewardType.Label)
                    Text("${r.channel.label} · ${if (r.delivered) "sent" else "failed"}", color = if (r.delivered) HomewardColors.Green else HomewardColors.Red)
                }
            }
        }

        PrimaryButton(color = HomewardColors.Red, label = "Call local police (${vm.policeNumber})") { PoliceCaller.dial(context, vm.policeNumber) }

        pick?.let {
            WhiteCard(Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Outlined.Place, null, tint = HomewardColors.Primary)
                    Text("Nearest safe place", style = HomewardType.Label)
                }
                Spacer(Modifier.height(6.dp))
                Text(it.reason, style = HomewardType.Small)
            }
        }

        LocalPhrasesCard(pack.localPhrases)
    }
}
