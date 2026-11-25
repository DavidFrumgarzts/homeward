package app.homeward.features.scancheck

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import app.homeward.BuildConfig
import app.homeward.ai.OnDeviceModelSetup
import app.homeward.app.AppServices
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.PrimaryButton
import app.homeward.features.safetypack.DemoBucharestPack
import java.io.File
import kotlinx.coroutines.launch

private enum class Step { Start, AskCloud, Reading, Confirm, Verdict }

// The scan check (spec section 5): photo -> (on-device read, or ask before the cloud, or type it) -> she confirms
// -> ScanJudge -> verdict. `onShowPlace` opens Home with that saved place blinking yellow.
@Composable
fun ScanScreen(onBack: () -> Unit, onShowPlace: (String) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var demoBucharest by remember { mutableStateOf(false) } // debug builds only: try the Bucharest money demo
    val pack = remember(demoBucharest) { if (demoBucharest) DemoBucharestPack.pack else AppServices.packStore.load() }
    var step by remember { mutableStateOf(Step.Start) }
    var photo by remember { mutableStateOf<Bitmap?>(null) }
    var read by remember { mutableStateOf<ScanReading?>(null) }
    var badge by remember { mutableStateOf<String?>(null) }
    var verdict by remember { mutableStateOf<ScanVerdict?>(null) }
    val file = remember { File(context.cacheDir, "scans/scan.jpg").apply { parentFile?.mkdirs() } }
    val uri: Uri = remember { FileProvider.getUriForFile(context, "${context.packageName}.files", file) }

    fun readPhoto(bitmap: Bitmap) {
        step = Step.Reading
        scope.launch {
            val r = ScanReader.read(bitmap)
            read = r.reading
            badge = if (r.reading != null) (if (r.ranOnDevice) "On device" else "Cloud") else null
            step = Step.Confirm
        }
    }

    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        if (!ok) return@rememberLauncherForActivityResult
        val bitmap = decodeSmall(file) ?: return@rememberLauncherForActivityResult
        photo = bitmap; read = null; badge = null
        scope.launch {
            when {
                OnDeviceModelSetup.isReady() -> readPhoto(bitmap)                      // stays on the phone
                AppServices.network.hasInternet() -> step = Step.AskCloud              // ask before it leaves the phone
                else -> step = Step.Confirm                                            // offline, no Nano: type it
            }
        }
    }

    Column(Modifier.fillMaxSize().background(HomewardColors.Background).systemBarsPadding().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back", tint = HomewardColors.Text, modifier = Modifier.clickable(onClick = onBack).padding(vertical = 8.dp))
        Text("Is this legit?", style = HomewardType.Title)
        when (step) {
            Step.Start -> {
                Text("Take a photo of the exchange board, taxi meter, ticket or price. Beacon checks it against what travelers report in ${pack.city}, with no signal.", style = HomewardType.Body)
                PrimaryButton("Take a photo", Modifier.fillMaxWidth()) { camera.launch(uri) }
                Text("Type it instead", style = HomewardType.Label, color = HomewardColors.Primary, modifier = Modifier.clickable { step = Step.Confirm }.padding(vertical = 8.dp))
            }
            Step.AskCloud -> {
                Text("No on-device AI on this phone. Read this photo in the cloud?", style = HomewardType.Body)
                PrimaryButton("Read in the cloud", Modifier.fillMaxWidth()) { photo?.let { readPhoto(it) } }
                Text("Type it instead", style = HomewardType.Label, color = HomewardColors.Primary, modifier = Modifier.clickable { step = Step.Confirm }.padding(vertical = 8.dp))
            }
            Step.Reading -> Text("Reading…", style = HomewardType.Body)
            Step.Confirm -> ScanConfirmForm(read, pack) { confirmed -> verdict = ScanJudge.judge(confirmed, pack); step = Step.Verdict }
            Step.Verdict -> verdict?.let {
                ScanVerdictCard(it, pack, photo, badge, onShowPlace)
                Text("Scan something else", style = HomewardType.Label, color = HomewardColors.Primary,
                    modifier = Modifier.clickable { step = Step.Start; photo = null; read = null; verdict = null }.padding(vertical = 8.dp))
            }
        }
        if (BuildConfig.DEBUG && step == Step.Start) {
            Spacer(Modifier.weight(1f, fill = false))
            Text(if (demoBucharest) "Demo city: Bucharest · switch to saved pack" else "Demo city: ${pack.city} · switch to Bucharest", style = HomewardType.Small,
                modifier = Modifier.align(Alignment.CenterHorizontally).clickable { demoBucharest = !demoBucharest }.padding(8.dp))
        }
    }
}

// Camera photos are large; the model only needs about 1024 px on the long side.
private fun decodeSmall(file: File): Bitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(file.path, bounds)
    var sample = 1
    while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= 1024) sample *= 2
    return BitmapFactory.decodeFile(file.path, BitmapFactory.Options().apply { inSampleSize = sample })
}
