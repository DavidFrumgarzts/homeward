# Architecture map

Find the file for any feature without reading the whole app. All code is in
`app/src/main/java/app/beacon/`. Every folder has its own README listing its files.

## How hybrid AI is split
| Job | Where it runs | File |
|---|---|---|
| Research a new city (numbers, embassy, safe places, zones) | **Cloud** (Gemini + Google Search) | `features/safetypack/SafetyPackBuilder.kt` |
| Write the SOS from her note | **On device** (Gemini Nano), cloud fallback | `features/sos/SosMessageWriter.kt` |
| Read a safety photo (taxi plate) | **On device** | `features/safetyphoto/SafetyPhotoReader.kt` |
| Explain a red zone | **On device** | `features/safetymap/ZoneWarningWriter.kt` |
| Red zone ahead? Nearest open safe place? Push or SMS? | **No AI**, plain logic, offline | `ZoneChecker.kt`, `SafePlacePicker.kt`, `ChannelChooser.kt` |

Both AI models are created in one place: `ai/AiModels.kt`.

## Flow
1. First launch: `MainActivity` downloads Gemini Nano (`ai/OnDeviceModelSetup.kt`) and, if online in a new city,
   builds the safety pack in the cloud (`features/safetypack/PackUpdater.kt`). The pack is saved as a file.
2. Home (`features/home/HomeScreen.kt`) reads the saved pack: map preview, red zone ahead, quick actions.
3. SOS: `SosComposeScreen` -> `SosViewModel.writeDraft()` (on-device AI) -> `send()` -> `SosDispatcher`
   (push if online, SMS if not) -> `SosSentScreen`.

## Rules the code follows
- The on-device AI only rewrites saved facts or what she typed. Phone numbers come from the pack, never from AI memory.
- She always sees and can edit the SOS before it is sent.
- Exact location goes only to trusted contacts, only after SOS. Zones describe places and times, never people.

## Where to fix common bugs
| Symptom | Look in |
|---|---|
| SOS text is wrong or empty | `features/sos/SosPrompt.kt`, `SosMessageWriter.kt` |
| SMS not sent | `features/sos/sending/SmsSender.kt` (SEND_SMS permission) |
| Red zone warning wrong | `features/safetymap/ZoneChecker.kt` (+ `ZoneCheckerTest`) |
| Pack fails to build | `features/safetypack/SafetyPackBuilder.kt` (JSON parsing), `SafetyPackPrompt.kt` |
| AI always runs in the cloud | `ai/OnDeviceModelSetup.kt`, phone must support Gemini Nano |
| Colors / spacing | `design/Colors.kt`, `design/components/` |
