# KlyoIPTV Player — APK para Android

Convierte tu WebApp en una APK nativa usando **Capacitor** con soporte de reproductor externo (VLC, MX Player, etc.) y pistas de audio.

---

## 📁 Estructura del repositorio

```
.
├── www/                        ← Tus archivos web (index.html, app.js, styles.css, etc.)
│   └── android-bridge.js       ← Bridge JS para abrir streams en reproductor nativo
├── android/                    ← Proyecto Android (Capacitor lo genera)
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/klyoiptv/player/MainActivity.java
│   │       └── res/
│   │           ├── values/strings.xml
│   │           ├── values/styles.xml
│   │           └── xml/
│   │               ├── network_security_config.xml
│   │               └── file_paths.xml
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradle.properties
├── .github/
│   └── workflows/
│       └── build-apk.yml       ← GitHub Actions: compila el APK automáticamente
├── capacitor.config.json
└── package.json
```

---

## 🚀 Pasos para compilar tu APK en GitHub

### 1. Prepara tu carpeta `www/`

Copia todos tus archivos web en la carpeta `www/`:
```
www/
  index.html        ← Tu archivo principal (ya lo tienes)
  app.js            ← Tu lógica JS
  styles.css        ← Tus estilos
  android-bridge.js ← (incluido aquí, ya está)
  site.webmanifest  ← Si lo tienes
```

Agrega esta línea en tu `index.html` **antes** de `<script src="app.js">`:
```html
<script src="android-bridge.js"></script>
```

### 2. Sube el proyecto a GitHub

```bash
git init
git add .
git commit -m "Initial commit - KlyoIPTV APK"
git remote add origin https://github.com/TU_USUARIO/klyoiptv-apk.git
git push -u origin main
```

### 3. GitHub Actions compilará automáticamente

Cada vez que hagas `push` a `main`, GitHub Actions:
1. Instala Node.js + Capacitor
2. Copia `www/` al proyecto Android
3. Compila el APK con Gradle
4. Lo sube como **Artifact** descargable

Ve a: `Tu repo → Actions → Build KlyoIPTV APK → Artifacts → KlyoIPTV-APK`

---

## 🔑 Firma del APK (opcional pero recomendado)

Sin firma se genera un APK con **debug key** (funciona, pero no publicable en Play Store).

Para firmar con tu propia keystore:

### Crear keystore (una sola vez):
```bash
keytool -genkey -v -keystore klyo-release.jks \
  -alias klyoiptv -keyalg RSA -keysize 2048 -validity 10000
```

### Agregar Secrets en GitHub:
`Repo → Settings → Secrets and variables → Actions → New repository secret`

| Secret | Valor |
|--------|-------|
| `KEYSTORE_BASE64` | `base64 -w 0 klyo-release.jks` |
| `KEYSTORE_PASSWORD` | Tu contraseña del keystore |
| `KEY_ALIAS` | `klyoiptv` |
| `KEY_PASSWORD` | Tu contraseña de la clave |

---

## 📲 Reproductor nativo y pistas de audio

El archivo `android-bridge.js` expone estas funciones a tu JavaScript:

```javascript
// Abrir stream en VLC, MX Player, etc.
window.openInNativePlayer("http://stream.url/live.m3u8", "application/x-mpegurl");

// Verificar si hay reproductor externo instalado
if (window.hasExternalPlayer()) { ... }
```

El botón **"📲 Externo"** ya en tu HTML (`#btnExtPlayer`) queda automáticamente conectado al reproductor nativo de Android. Detecta el MIME type según la URL (HLS, MPEG-TS, RTSP).

---

## ⚙️ Permisos incluidos en el APK

- `INTERNET` — para streams IPTV
- `ACCESS_NETWORK_STATE` — para detectar tipo de conexión
- `WAKE_LOCK` — para mantener pantalla encendida durante reproducción
- Cleartext HTTP — necesario para streams sin HTTPS
- Intent para abrir archivos `.m3u`, `.m3u8`, `video/*`

---

## 🔄 Crear un Release con versión

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions detecta el tag y crea automáticamente un **GitHub Release** con el APK adjunto.

---

## 🛠️ Compilar localmente (opcional)

```bash
npm install
npx cap add android       # Solo la primera vez
npx cap sync android      # Cada vez que cambies www/
cd android
./gradlew assembleRelease
# APK en: android/app/build/outputs/apk/release/
```

Requisitos: Node.js 18+, JDK 17, Android SDK 34
