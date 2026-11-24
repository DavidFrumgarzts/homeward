package app.homeward.design

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

// Wraps every screen so Material components (text fields, dialogs) pick up our colors.
@Composable
fun HomewardTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = HomewardColors.Primary,
            background = HomewardColors.Background,
            surface = HomewardColors.Surface,
            onSurface = HomewardColors.Text,
        ),
        content = content,
    )
}
