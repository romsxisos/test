package com.klyoiptv.player;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.app.Activity;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Mantener pantalla encendida mientras reproduce
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Registrar el bridge JS → Android para abrir streams en reproductor externo
        getBridge().getWebView().addJavascriptInterface(
            new AndroidBridge(this), "AndroidBridge"
        );
    }

    /**
     * Bridge expuesto a JavaScript como window.AndroidBridge
     * Permite que el HTML abra streams en VLC, MX Player, etc.
     */
    public class AndroidBridge {
        private final Activity activity;

        AndroidBridge(Activity activity) {
            this.activity = activity;
        }

        /**
         * Abre una URL de stream en el reproductor nativo de Android.
         * Uso desde JS: AndroidBridge.openInNativePlayer("http://...", "video/mp2t")
         */
        @JavascriptInterface
        public void openInNativePlayer(String url, String mimeType) {
            if (url == null || url.isEmpty()) return;
            String type = (mimeType != null && !mimeType.isEmpty()) ? mimeType : "video/*";

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(Uri.parse(url), type);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Intent chooser = Intent.createChooser(intent, "Abrir con...");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                activity.startActivity(chooser);
            } catch (Exception e) {
                // Si no hay app instalada, intentar sin tipo MIME
                Intent fallback = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(fallback);
            }
        }

        /**
         * Abre stream específicamente con intent rtsp:// o mms://
         */
        @JavascriptInterface
        public void openStream(String url) {
            openInNativePlayer(url, "video/*");
        }

        /**
         * Detecta si hay reproductores instalados (VLC, MX Player)
         */
        @JavascriptInterface
        public boolean hasExternalPlayer() {
            Intent test = new Intent(Intent.ACTION_VIEW);
            test.setDataAndType(Uri.parse("http://test.m3u8"), "video/*");
            return test.resolveActivity(activity.getPackageManager()) != null;
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Reanudar WebView al volver de reproductor externo
        getBridge().getWebView().onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        getBridge().getWebView().onPause();
    }
}
