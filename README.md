# Fit — Offline Workout Logger (iOS & Android)

Fit is a  privacy-first, single-user workout tracker that runs entirely on your phone.
It stores your data locally in an encrypted SQLite database and lets you log sets (reps + weight), then view simple progress history. A one-tap ''CSV backup  exports your data so you can move it anywhere.

## Features

* Local, single-user auth (username + password hash)
* Body parts → workouts → sessions → sets (reps, weight, timestamps)
* Fast local DB (SQLite via `react-native-sqlite-storage`) with migrations
* History summaries and simple progress views
* One-tap CSV  backup 

  * iOS: saved to app Documents
  * Android: saved to app Cache and shared (no extra permissions)
* No cloud, no tracking ✦ your data stays on your device

## Tech Stack

*  React Native  (RN 0.80)
*  DB:  `react-native-sqlite-storage` (+ SQLCipher-ready)
*  Secure storage:  `react-native-encrypted-storage`
*  Backup/Share:  `react-native-fs`, `react-native-share`
*  (Optional) Document picking:  `@react-native-documents/picker`
*  Package manager:   npm  (stick to npm; don’t mix with yarn)

## Project Structure (high level)

```
fitapp/
├─ android/              # Android project (Gradle)
├─ ios/                  # iOS project (Xcode workspace)
├─ src/
│  ├─ db/
│  │  ├─ index.ts        # DB open/init + seed + FK on
│  │  ├─ migrations.ts   # PRAGMA user_version migrations
│  │  └─ types.ts        # shared TS types
│  ├─ backend/
│  │  └─ repositories/   # tiny data-access layers (auth, bodyParts, workouts, logs/sets)
│  └─ frontend/
│     └─ screens/        # simple screens (select workout, log session, history)
├─ index.js              # RN entry -> src/App.tsx
├─ App.tsx               # screen switcher (no nav lib yet)
└─ package.json
```

---

## Quick Start

### 1) Clone and install

```bash
git clone <your-repo-url> fitapp
cd fitapp
npm install
```

### 2) Start Metro (JS dev server)

```bash
npm start
```

---

## Run on iOS (macOS + Xcode)

 Requirements 

* macOS with Xcode (Command Line Tools installed)
* CocoaPods (`sudo gem install cocoapods` once)

 Install Pods & open workspace 

```bash
cd ios
pod install
open fitapp.xcworkspace
```

 Build/Run 

* Select a  Simulator  (no Apple developer account needed) and press  ▶︎ .
* To run on a  physical iPhone  with free provisioning:

  * In Xcode: select the  fitapp  target →  Signing & Capabilities 
  * Check  Automatically manage signing , pick your  Personal Team , and set a  unique Bundle ID  (e.g., `com.yourname.fitapp`)
  * Plug in the iPhone, trust the device, then  ▶︎ 

> Tip: If you just see a black screen, it’s likely dark mode + default styles. We set explicit light backgrounds in the UI, but keep your device’s dark mode in mind while developing.

---

## Run on Android (macOS + Android Studio)

 Requirements 

* Android Studio (SDKs + Platform Tools installed)
*  JDK 17  for Gradle/NDK builds (RN 0.80 is happiest on 17)

 One-time environment (macOS) 

```bash
# Make sure these paths match your machine.
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties

# Put these in ~/.zshrc so new terminals inherit them:
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH="$JAVA_HOME/bin:$PATH"
```

Then reload your shell: `source ~/.zshrc`

 Device/Emulator 

* In Android Studio →  Device Manager  → create a Pixel emulator (API 35 recommended), or
* Plug in a device, enable  Developer options  and  USB debugging , accept the RSA prompt.

 Build/Run 

```bash
# (Make sure Metro is running in another terminal: npm start)
npx react-native run-android
```

 If multiple devices  (emulator + phone), target by serial:

```bash
adb devices        # copy the serial
npx react-native run-android --deviceId <SERIAL>
```

---

## Backups (CSV)

* iOS: file is saved to the app’s  Documents  directory and shared.
* Android: file is saved to the app’s  Cache  directory and shared via a FileProvider (no permissions needed).
* Filename is timestamped like: `workout_data_YYYYMMDD_HHmm.csv`.

If you use your own share/paths, avoid `:` in filenames on Android and either use cache paths or add a FileProvider mapping for `files/`.

---

## Developing & Contributing

### Common scripts

```bash
npm start                   # Metro
npx react-native run-ios    # quick simulator run (or use Xcode)
npx react-native run-android
```

### Where to add code

*  DB changes:  add a migration in `src/db/migrations.ts` (bump `PRAGMA user_version`)
*  New data access:  add a small repo function in `src/backend/repositories/`
*  UI:  add a screen in `src/frontend/screens/` and wire it in `App.tsx` (or install a nav lib later)

### Security notes

* We store  only a password hash  in `user_credentials`.
* Use `react-native-encrypted-storage` for session flags/secrets—never plaintext passwords.

---

## Troubleshooting

 Android build fails with 
`configureCMakeDebug[…] FAILED / "A restricted method in java.lang.System has been called"`
→ Gradle is using JDK 21+ on your machine. Switch to  JDK 17 :

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH="$JAVA_HOME/bin:$PATH"
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

(Optional: in Android Studio →  Gradle JDK  = 17)

 `SDK location not found` 
→ Create `android/local.properties`:

```bash
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

 `adb: command not found` / device not showing 
→ Ensure `platform-tools` on `PATH` (see env above) and run:

```bash
adb kill-server && adb start-server
adb devices
```

If it says `unauthorized`, accept the RSA prompt on the phone.

 Share/backup errors on Android 

* Use  cache  paths or add a  FileProvider .
* Avoid `:` in filenames.

 iOS device signing 

* Use  Automatically manage signing , a unique  Bundle ID , and your  Personal Team .
* Simulator never needs a paid account.

---

## Roadmap / Ideas

* Charts (progression over time)
* Exercise templates & timers
* Export/import JSON
* Optional passcode/biometrics gate

---

## License

MIT — do what you like, just don’t remove attribution.

---

## Thanks

Built with ❤️ using React Native and a lightweight, migration-friendly SQLite schema. Contributions and forks welcome—make it your own and keep lifting! 💪
