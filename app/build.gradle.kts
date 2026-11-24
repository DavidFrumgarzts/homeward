// App module setup: Android settings + every library the app uses.
import java.util.Properties

// Secrets live in local.properties (git-ignored), never in the repo. e.g. CARTO_KEY=abc123
val localProps = Properties().apply {
    rootProject.file("local.properties").takeIf { it.exists() }?.inputStream()?.use { load(it) }
}

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
    // Reads app/google-services.json (download it from the Firebase console; it is git-ignored).
    id("com.google.gms.google-services")
}

android {
    namespace = "app.homeward"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.homeward"
        minSdk = 26 // Firebase on-device AI needs Android 8.0+
        targetSdk = 35
        versionCode = 1
        versionName = "0.1"
        // Map key (CARTO). Empty = fall back to plain OpenStreetMap tiles.
        buildConfigField("String", "CARTO_KEY", "\"${localProps.getProperty("CARTO_KEY", "")}\"")
    }

    buildFeatures { compose = true; buildConfig = true }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        // Firebase hybrid/on-device AI is a public preview; allow its APIs everywhere.
        optIn.add("com.google.firebase.ai.type.PublicPreviewAPI")
    }
}

dependencies {
    // --- Jetpack Compose (the UI toolkit) ---
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.navigation:navigation-compose:2.8.5")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")

    // --- Firebase AI Logic (hybrid: on-device Gemini Nano + cloud Gemini) ---
    // On-device SDK is not in the Firebase BoM yet, so versions are pinned here.
    implementation("com.google.firebase:firebase-ai:18.2.0")
    implementation("com.google.firebase:firebase-ai-ondevice:16.0.0-beta08")
    // App Check is required by the hackathon. Debug provider is fine for judging.
    implementation("com.google.firebase:firebase-appcheck-debug:20.1.0")

    // --- Firestore + anonymous sign-in: mirrors an SOS to the cloud so family can follow it on the web ---
    // (SMS stays the path that works with no data. Versions come from the Firebase BoM.)
    implementation(platform("com.google.firebase:firebase-bom:35.2.0"))
    implementation("com.google.firebase:firebase-firestore")
    implementation("com.google.firebase:firebase-auth")

    // --- Saving the safety pack offline as JSON ---
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    // --- Real map with offline-capable OpenStreetMap tiles ---
    implementation("org.osmdroid:osmdroid-android:6.1.20")

    // --- Tests for the pure-logic files ---
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
}
