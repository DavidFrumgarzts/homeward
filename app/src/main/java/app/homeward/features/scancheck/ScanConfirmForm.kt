package app.homeward.features.scancheck

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.PrimaryButton
import app.homeward.design.components.WhiteCard
import app.homeward.features.safetypack.SafetyPack

// "We read: …" — she checks or types the numbers before anything is judged. Her confirmed input, not the AI's,
// goes to ScanJudge. `read` is the AI's reading (null when she types it from scratch).
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ScanConfirmForm(read: ScanReading?, pack: SafetyPack, onCheck: (ScanReading) -> Unit) {
    val defaultRate = pack.scams.flatMap { it.fairRates }.firstOrNull()
    val firstRate = read?.rates?.firstOrNull()
    val firstPrice = read?.prices?.firstOrNull()
    var kind by remember { mutableStateOf(read?.kind ?: ScamKind.Money) }
    var from by remember { mutableStateOf(firstRate?.from ?: defaultRate?.from ?: "EUR") }
    var to by remember { mutableStateOf(firstRate?.to ?: defaultRate?.to ?: "") }
    var number by remember { mutableStateOf((firstRate?.buy ?: firstPrice?.amount)?.toString().orEmpty()) }
    var currency by remember { mutableStateOf(firstPrice?.currency ?: defaultRate?.to.orEmpty()) }

    WhiteCard(Modifier.fillMaxWidth()) {
        Text(if (read == null) "What are you looking at?" else "We read", style = HomewardType.Heading)
        read?.text?.takeIf { it.isNotBlank() }?.let { Text("“$it”", style = HomewardType.Small, modifier = Modifier.padding(top = 4.dp)) }
        Spacer(Modifier.height(12.dp))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            ScamKind.entries.forEach { k ->
                val on = k == kind
                Text(k.name, style = HomewardType.Small, color = if (on) HomewardColors.Surface else HomewardColors.Text,
                    modifier = Modifier.background(if (on) HomewardColors.Primary else HomewardColors.Surface, RoundedCornerShape(50))
                        .border(1.dp, if (on) HomewardColors.Primary else HomewardColors.Border, RoundedCornerShape(50))
                        .clickable { kind = k }.padding(horizontal = 12.dp, vertical = 8.dp))
            }
        }
        Spacer(Modifier.height(14.dp))
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (kind == ScamKind.Money) {
                Text("They pay for 1", style = HomewardType.Body)
                Field(from, 64) { from = it.uppercase() }
                Field(number, 80, KeyboardType.Decimal) { number = it }
                Field(to, 64) { to = it.uppercase() }
            } else {
                Text("They ask", style = HomewardType.Body)
                Field(number, 90, KeyboardType.Decimal) { number = it }
                Field(currency, 64) { currency = it.uppercase() }
            }
        }
        Spacer(Modifier.height(16.dp))
        PrimaryButton("Check it", Modifier.fillMaxWidth()) {
            val n = number.replace(',', '.').trim().toDoubleOrNull()
            val text = read?.text.orEmpty()
            onCheck(
                when {
                    n == null -> ScanReading(kind, text)
                    kind == ScamKind.Money -> ScanReading(kind, text, rates = listOf(BoardRate(from.trim(), to.trim(), buy = n)))
                    else -> ScanReading(kind, text, prices = listOf(SeenPrice(firstPrice?.item ?: text, currency.trim(), n)))
                },
            )
        }
    }
}

@Composable
private fun Field(value: String, width: Int, type: KeyboardType = KeyboardType.Text, onChange: (String) -> Unit) {
    BasicTextField(value, onChange, singleLine = true, textStyle = HomewardType.Label, keyboardOptions = KeyboardOptions(keyboardType = type),
        modifier = Modifier.width(width.dp).background(HomewardColors.SurfaceAlt, RoundedCornerShape(10.dp)).padding(horizontal = 10.dp, vertical = 10.dp))
}
