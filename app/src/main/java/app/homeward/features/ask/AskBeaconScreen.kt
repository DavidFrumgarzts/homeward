package app.homeward.features.ask

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.device.Speaker
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// One line of the chat. `fromYou` = the traveler's question; otherwise Beacon's answer.
private data class ChatLine(val fromYou: Boolean, val text: String)

// Chat with Beacon (Figma "08 Ask Beacon"): the cop at the top, your questions in blue on the right,
// Beacon's answers in white on the left, and a box to type the next one. It keeps the last answers in mind
// for follow-ups. Tap the cop to hear the last answer read out loud (the phone's own voice, works offline).
// `firstQuestion` is what was tapped on Home ("" opens an empty chat).
@Composable
fun AskBeaconScreen(firstQuestion: String, onBack: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val lines = remember { mutableStateListOf<ChatLine>() }
    var typed by rememberSaveable { mutableStateOf("") }
    var thinking by remember { mutableStateOf(false) }
    var shownChars by remember { mutableIntStateOf(0) }   // the newest answer types itself out
    var speaking by remember { mutableStateOf(false) }
    val speaker = remember { Speaker(context) }
    DisposableEffect(Unit) { onDispose { speaker.release() } }
    val list = rememberLazyListState()

    fun ask(q: String) {
        if (q.isBlank() || thinking) return
        // The earlier question/answer pairs, so follow-ups make sense.
        val earlier = lines.chunked(2).filter { it.size == 2 }.map { it[0].text to it[1].text }
        lines += ChatLine(fromYou = true, text = q.trim()); typed = ""; thinking = true
        scope.launch {
            val answer = AskBeacon.answer(q.trim(), earlier)
            thinking = false
            lines += ChatLine(fromYou = false, text = answer.text)
            shownChars = 0
            while (shownChars < answer.text.length) { delay(18); shownChars = (shownChars + 2).coerceAtMost(answer.text.length) }
        }
    }
    LaunchedEffect(Unit) { if (firstQuestion.isNotBlank()) ask(firstQuestion) }
    LaunchedEffect(lines.size, thinking) { if (lines.isNotEmpty()) list.animateScrollToItem(lines.size - 1) }

    val lastAnswer = lines.lastOrNull { !it.fromYou }?.text
    val typing = lastAnswer != null && !lines.last().fromYou && shownChars < lastAnswer.length
    val mood = when { thinking -> CopMood.Thinking; typing || speaking -> CopMood.Talking; else -> CopMood.Idle }

    Column(Modifier.fillMaxSize().background(HomewardColors.Background).systemBarsPadding().imePadding().padding(horizontal = 20.dp, vertical = 12.dp)) {
        Box(Modifier.fillMaxWidth()) {
            Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back", tint = HomewardColors.Text, modifier = Modifier.align(Alignment.CenterStart).clickable(onClick = onBack).padding(vertical = 8.dp))
            BeaconCop(mood, modifier = Modifier.align(Alignment.Center).clickable(enabled = lastAnswer != null) {
                if (speaking) speaker.stop() else lastAnswer?.let { speaker.speak(it) { on -> speaking = on } }
            })
        }

        LazyColumn(Modifier.weight(1f).fillMaxWidth(), state = list, verticalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(vertical = 16.dp)) {
            itemsIndexed(lines) { i, line ->
                val newest = i == lines.lastIndex && !line.fromYou
                Bubble(line.fromYou, if (newest) line.text.take(shownChars) else line.text)
            }
            if (thinking) item { Bubble(fromYou = false, text = "…") }
            // Ready-made questions before the first one
            if (lines.isEmpty() && !thinking) item {
                Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    listOf("What's the police number?", "Is this area OK now?", "Where's a safe place?").forEach { q ->
                        Text(q, style = HomewardType.Label, modifier = Modifier.border(1.dp, HomewardColors.Border, RoundedCornerShape(50)).clickable { ask(q) }.padding(horizontal = 16.dp, vertical = 10.dp))
                    }
                }
            }
        }

        Row(Modifier.fillMaxWidth().background(HomewardColors.Surface, RoundedCornerShape(22.dp)).padding(start = 18.dp, end = 6.dp, top = 6.dp, bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.weight(1f)) {
                if (typed.isEmpty()) Text("Ask Beacon anything", style = HomewardType.Body, color = HomewardColors.TextMuted)
                BasicTextField(
                    typed, { typed = it }, textStyle = HomewardType.Body, singleLine = true, modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send), keyboardActions = KeyboardActions(onSend = { ask(typed) }),
                )
            }
            Box(Modifier.size(48.dp).background(HomewardColors.Primary, RoundedCornerShape(16.dp)).clickable { ask(typed) }, contentAlignment = Alignment.Center) {
                Icon(Icons.AutoMirrored.Outlined.Send, "Send", tint = Color.White)
            }
        }
    }
}

// Your questions: blue, on the right. Beacon's answers: white, on the left.
@Composable
private fun Bubble(fromYou: Boolean, text: String) {
    Box(Modifier.fillMaxWidth(), contentAlignment = if (fromYou) Alignment.CenterEnd else Alignment.CenterStart) {
        Text(
            text, style = if (fromYou) HomewardType.Label else HomewardType.Body, color = if (fromYou) Color.White else HomewardColors.Text,
            modifier = Modifier.widthIn(max = 300.dp)
                .background(if (fromYou) HomewardColors.Primary else HomewardColors.Surface, if (fromYou) RoundedCornerShape(20.dp, 20.dp, 6.dp, 20.dp) else RoundedCornerShape(20.dp, 20.dp, 20.dp, 6.dp))
                .padding(horizontal = 16.dp, vertical = 12.dp),
        )
    }
}
