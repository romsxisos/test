/**
 * android-bridge.js
 * Pega este script en tu www/ junto con index.html, app.js, styles.css
 * Se encarga de exponer window.AndroidBridge al código existente del player.
 *
 * En el HTML ya tienes el botón "📲 Externo" (#btnExtPlayer).
 * Este script conecta ese botón con el reproductor nativo de Android
 * usando el bridge Java ↔ JavaScript de Capacitor.
 */

(function () {
  'use strict';

  // Solo actuar si estamos dentro de la APK (Capacitor WebView)
  const isAndroid = typeof AndroidBridge !== 'undefined';

  /**
   * Abre un stream en el reproductor nativo de Android.
   * @param {string} url   - URL del stream (http, https, rtsp)
   * @param {string} mime  - Tipo MIME: 'video/mp2t', 'application/x-mpegurl', 'video/*'
   */
  window.openInNativePlayer = function (url, mime) {
    if (!url) return;
    if (isAndroid) {
      // Usar el bridge Java registrado en MainActivity
      AndroidBridge.openInNativePlayer(url, mime || 'video/*');
    } else {
      // Fallback navegador: intent:// o simplemente abrir URL
      const intentUrl = `intent:${url}#Intent;type=${mime || 'video/*'};end`;
      window.open(intentUrl, '_blank');
    }
  };

  /**
   * Detecta si hay reproductor externo disponible.
   * Retorna true/false; útil para mostrar/ocultar el botón "Externo".
   */
  window.hasExternalPlayer = function () {
    if (isAndroid) return AndroidBridge.hasExternalPlayer();
    return false;
  };

  // ─── Hookear el botón "📲 Externo" del player una vez cargado el DOM ───
  document.addEventListener('DOMContentLoaded', function () {
    // Pequeña espera para que app.js termine de inicializar
    setTimeout(function () {
      const btnExt = document.getElementById('btnExtPlayer');
      if (!btnExt) return;

      if (!isAndroid) {
        // En web/PWA ocultar el botón (no tiene utilidad real)
        btnExt.style.display = 'none';
        return;
      }

      // Reemplazar listener existente: abrir con reproductor nativo
      btnExt.addEventListener('click', function (e) {
        e.stopPropagation();
        // Intentar leer la URL actualmente cargada en el <video>
        const video = document.getElementById('video');
        let streamUrl = '';

        if (video && video.src) {
          streamUrl = video.src;
        } else if (window.__currentStreamUrl) {
          streamUrl = window.__currentStreamUrl;
        }

        if (!streamUrl) {
          alert('No hay ningún stream activo para abrir en reproductor externo.');
          return;
        }

        // Determinar MIME según extensión
        let mime = 'video/*';
        if (streamUrl.includes('.m3u8') || streamUrl.includes('/hls/')) {
          mime = 'application/x-mpegurl';
        } else if (streamUrl.includes('.ts') || streamUrl.includes('output=ts')) {
          mime = 'video/mp2t';
        } else if (streamUrl.includes('rtsp://')) {
          mime = 'video/rtsp';
        }

        window.openInNativePlayer(streamUrl, mime);
      }, true); // capture=true para tener prioridad sobre listeners existentes

    }, 500);
  });

  /**
   * Hook global: cuando app.js asigne el src al <video>,
   * guardar la URL para que el botón externo siempre tenga la URL actual.
   * Funciona interceptando HTMLVideoElement.src setter.
   */
  const videoDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  if (videoDescriptor) {
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      set: function (val) {
        if (this.id === 'video') window.__currentStreamUrl = val;
        videoDescriptor.set.call(this, val);
      },
      get: function () {
        return videoDescriptor.get.call(this);
      },
      configurable: true
    });
  }

})();
