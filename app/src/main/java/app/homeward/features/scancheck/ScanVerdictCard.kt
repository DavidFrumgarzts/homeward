package app.homeward.features.scancheck

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.PrimaryButton
import app.homeward.design.components.WhiteCard
import app.homeward.features.safetypack.SafetyPack
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// The answer to a scan (spec section 5): verdict, why, what to do, the safer place, and where the warning came from.
// `aiBadge` is "On device" / "Cloud" when the AI read the photo, null when she typed it.
@Composable
fun ScanVerdictCard(verdict: ScanVerdict, pack: SafetyPack, photo: Bitmap?, aiBadge: String?, onShowPlace: (String) -> Unit) {
    var showSources by remember { mutableStateOf(false) }
    val dot = when (verdict.verdict) {
        Verdict.LooksFair -> HomewardColors.Green
        Verdict.BeCareful -> HomewardColors.Yellow
        Verdict.WalkAway -> HomewardColors.Amber
        Verdict.Unknown -> HomewardColors.TextMuted
    }
    WhiteCard(Modifier.fillMaxWidth()) {
        photo?.let {
            Image(it.asImageBitmap(), null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxWidth().height(140.dp).clip(RoundedCornerShape(14.dp)))
            Spacer(Modifier.height(14.dp))
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(12.dp).background(dot, CircleShape))
            Spacer(Modifier.width(10.dp))
            Text(verdict.verdict.label, style = HomewardType.Title, modifier = Modifier.weight(1f))
            aiBadge?.let { Text(it, style = HomewardType.Small) }
        }
        if (verdict.why != verdict.verdict.label) {
            Spacer(Modifier.height(8.dp))
            Text(verdict.why, style = HomewardType.Body)
        }
        Spacer(Modifier.height(12.dp))
        Text("What to do: ${verdict.whatToDo}", style = HomewardType.Body)
        RecommendedPlace.byName(verdict.saferOption, pack)?.let { place ->
            Spacer(Modifier.height(14.dp))
            PrimaryButton("Show ${place.name} on the map", Modifier.fillMaxWidth()) { onShowPlace(place.name) }
        }
        verdict.warning?.let { w ->
            Spacer(Modifier.height(14.dp))
            val saved = if (pack.builtAtMillis > 0) "saved ${SimpleDateFormat("MMM d", Locale.ENGLISH).format(Date(pack.builtAtMillis))}" else "saved on this phone"
            val reports = if (w.reports > 0) " · ${w.reports} traveler reports" else ""
            Text("From your ${pack.city} pack, $saved$reports", style = HomewardType.Small)
            if (w.sources.isNotEmpty()) {
                Text(if (showSources) "Hide sources" else "Sources", style = HomewardType.Small, color = HomewardColors.Primary,
                    modifier = Modifier.clickable { showSources = !showSources }.padding(vertical = 6.dp))
                if (showSources) w.sources.forEach { Text(it, style = HomewardType.Small) }
            }
        }
    }
}
