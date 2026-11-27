# Keep WebView JavaScript bridge methods intact
-keepattributes JavascriptInterface
-keepclassmembers class ru.dimaa.vaultrunner.MainActivity {
    public *;
}
