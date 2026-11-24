package app.homeward.design

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
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
        typography = interEverywhere(),
        content = content,
    )
}

// Material's own pieces (text fields, dialogs, buttons) use Inter too, so nothing falls back to the phone's font.
private fun interEverywhere(): Typography {
    val d = Typography()
    val f = HomewardFonts.Body
    return Typography(
        displayLarge = d.displayLarge.copy(fontFamily = f), displayMedium = d.displayMedium.copy(fontFamily = f), displaySmall = d.displaySmall.copy(fontFamily = f),
        headlineLarge = d.headlineLarge.copy(fontFamily = f), headlineMedium = d.headlineMedium.copy(fontFamily = f), headlineSmall = d.headlineSmall.copy(fontFamily = f),
        titleLarge = d.titleLarge.copy(fontFamily = f), titleMedium = d.titleMedium.copy(fontFamily = f), titleSmall = d.titleSmall.copy(fontFamily = f),
        bodyLarge = d.bodyLarge.copy(fontFamily = f), bodyMedium = d.bodyMedium.copy(fontFamily = f), bodySmall = d.bodySmall.copy(fontFamily = f),
        labelLarge = d.labelLarge.copy(fontFamily = f), labelMedium = d.labelMedium.copy(fontFamily = f), labelSmall = d.labelSmall.copy(fontFamily = f),
    )
}
