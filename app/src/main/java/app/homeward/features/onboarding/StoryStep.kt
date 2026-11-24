package app.homeward.features.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.WhiteCard

// Step 2: a real-feeling example of the night Homeward is for, as a short timeline.
// Shows the three things that matter in order: warning, SOS with no signal, safe place.
@Composable
fun StoryStep(onNext: () -> Unit) {
    StepLayout(
        step = OnboardingStep.Story,
        title = "How it helps, one night in Lapa",
        subtitle = "You're in Rio. It's late, the bars are closing, and you're walking back alone.",
        button = "Continue",
        onButton = onNext,
    ) {
        WhiteCard(Modifier.fillMaxWidth()) {
            Moment("11:40 pm", HomewardColors.Yellow, "Your phone buzzes", "\"Red zone in 200 m: Rua dos Inválidos is usually empty after 11pm.\" It shows a safer street.")
            Moment("11:44 pm", HomewardColors.Red, "Someone is following you. No signal.", "You tap SOS and type 3 words. The phone's own AI writes the message, and it goes out by text with your location.")
            Moment("11:45 pm", HomewardColors.Green, "Mom gets it, at home in Tel Aviv", "\"Noa needs help. Followed since the bar, grey hoodie. Rua do Lavradio, Lapa.\" Plus what to do.", last = true)
        }
        Text("Built after a real case: a tourist was attacked walking alone at 2am near Lapa, two days after arriving.", style = HomewardType.Small)
    }
}

// One point on the timeline: time, colored dot + line, what happened.
@Composable
private fun Moment(time: String, color: Color, title: String, detail: String, last: Boolean = false) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(Modifier.padding(top = 4.dp).size(12.dp).background(color, CircleShape))
            if (!last) Box(Modifier.width(2.dp).height(78.dp).background(HomewardColors.Border))
        }
        Column(Modifier.padding(bottom = if (last) 0.dp else 12.dp)) {
            Text(time, color = color, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            Text(title, style = HomewardType.Label)
            Text(detail, style = HomewardType.Small)
        }
    }
}
