package app.beacon.design

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

// Wraps every screen so Material components (text fields, dialogs) pick up our colors.
@Composable
fun BeaconTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = BeaconColors.Red,
            background = BeaconColors.Background,
            surface = BeaconColors.Surface,
            onSurface = BeaconColors.Text,
        ),
        content = content,
    )
}
