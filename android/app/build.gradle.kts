import java.io.File

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val appVersionCode: Int = (project.findProperty("versionCode") as String?)?.toIntOrNull()
    ?: System.getenv("APP_VERSION_CODE")?.toIntOrNull()
    ?: 1
val appVersionName: String = (project.findProperty("versionName") as String?)
    ?: System.getenv("APP_VERSION_NAME")
    ?: "1.0.0"

val keystoreFileEnv: String? = System.getenv("KEYSTORE_FILE")?.takeIf { it.isNotBlank() }
val keystorePasswordEnv: String? = System.getenv("KEYSTORE_PASSWORD")
val keyAliasEnv: String? = System.getenv("KEY_ALIAS")
val keyPasswordEnv: String? = System.getenv("KEY_PASSWORD")
val hasReleaseSigning = keystoreFileEnv != null &&
    !keystorePasswordEnv.isNullOrEmpty() &&
    !keyAliasEnv.isNullOrEmpty() &&
    !keyPasswordEnv.isNullOrEmpty() &&
    File(keystoreFileEnv).exists()

android {
    namespace = "ru.dimaa.vaultrunner"
    compileSdk = 35

    defaultConfig {
        applicationId = "ru.dimaa.vaultrunner"
        minSdk = 24
        targetSdk = 35
        versionCode = appVersionCode
        versionName = appVersionName
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = File(keystoreFileEnv!!)
                storePassword = keystorePasswordEnv
                keyAlias = keyAliasEnv
                keyPassword = keyPasswordEnv
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += setOf(
                "META-INF/LICENSE*",
                "META-INF/NOTICE*",
                "META-INF/*.kotlin_module"
            )
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
}

// Автоматически копируем свежую веб-версию из корня репозитория в assets/www перед каждой сборкой
val syncWebAssets by tasks.registering(Sync::class) {
    val repoRoot = rootProject.projectDir.parentFile
    from(repoRoot) {
        include(
            "index.html",
            "privacy.html",
            "favicon.svg",
            "css/**",
            "js/**",
            "assets/**"
        )
        exclude(
            "assets/icon-512.png"
        )
    }
    into(layout.projectDirectory.dir("src/main/assets/www"))
}

tasks.named("preBuild") {
    dependsOn(syncWebAssets)
}
