package app.homeward.features.onboarding

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardType
import app.homeward.design.components.IconCircle
import app.homeward.design.components.WhiteCard

// Setup step 3: explain the two permissions in plain words, then ask Android for them in one go.
// Moving on works either way; the app falls back gracefully if one is denied.
@Composable
fun PermissionsStep(onNext: () -> Unit) {
    val ask = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { onNext() }
    StepLayout(
        step = OnboardingStep.Permissions,
        title = "Two things Beacon needs",
        button = "Allow",
        onButton = { ask.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.SEND_SMS)) },
    ) {
        Reason(Icons.Outlined.Place, "Location", "To warn you before red zones and add your spot to an SOS. GPS works with no signal.")
        Reason(Icons.AutoMirrored.Outlined.Chat, "Send text messages", "So your SOS reaches family even with no mobile data.")
    }
}

@Composable
private fun Reason(icon: ImageVector, title: String, detail: String) {
    WhiteCard(Modifier.fillMaxWidth(), padding = 14) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            IconCircle(icon)
            Column { Text(title, style = HomewardType.Label); Text(detail, style = HomewardType.Small) }
        }
    }
}
