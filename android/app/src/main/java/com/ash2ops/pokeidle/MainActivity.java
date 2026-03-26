package com.ash2ops.pokeidle;

import android.content.SharedPreferences;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String VERSION_PREFS_NAME = "pokeidle_runtime";
    private static final String LAST_LAUNCHED_VERSION_KEY = "last_launched_version";

    @Override
    protected void load() {
        clearWebViewHttpCacheIfVersionChanged();
        super.load();
    }

    private void clearWebViewHttpCacheIfVersionChanged() {
        final String currentVersion = BuildConfig.VERSION_NAME + "+" + BuildConfig.VERSION_CODE;
        final SharedPreferences preferences = getSharedPreferences(VERSION_PREFS_NAME, MODE_PRIVATE);
        final String previousVersion = preferences.getString(LAST_LAUNCHED_VERSION_KEY, "");
        if (currentVersion.equals(previousVersion)) {
            return;
        }

        final WebView webView = findViewById(com.getcapacitor.android.R.id.webview);
        if (webView != null) {
            webView.clearCache(true);
        }
        preferences.edit().putString(LAST_LAUNCHED_VERSION_KEY, currentVersion).apply();
    }
}
