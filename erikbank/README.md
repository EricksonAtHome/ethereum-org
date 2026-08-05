# ErikBank - A Bitcoin & Lightning Wallet

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**ErikBank** is a rebranded fork of [BlueWallet](https://github.com/BlueWallet/BlueWallet) — a thin, secure Bitcoin wallet built with React Native and Electrum.

## Features

- Private keys never leave your device
- Lightning Network supported
- SegWit-first with Replace-By-Fee support
- Encryption and plausible deniability
- Multisig vault support
- Hardware wallet integration

## Attribution

ErikBank is based on [BlueWallet](https://github.com/BlueWallet/BlueWallet), licensed under the MIT License. The original copyright notice is preserved in [LICENSE](LICENSE).

## Prerequisites

- Node.js >= 22.11.0 (see `engines` in `package.json`)
- npm
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

Check your versions:

```bash
node --version && npm --version
```

## Installation

```bash
git clone <your-erikbank-repo-url>
cd erikbank
npm install
```

## Run on Android

1. Connect an Android device or start an emulator via Android Studio AVD Manager
2. Open `android/build.gradle` in Android Studio if needed for first-time setup
3. Run:

```bash
npx react-native run-android
```

## Run on iOS (macOS only)

```bash
npx pod-install
npm start
```

In a second terminal:

```bash
npx react-native run-ios
```

## App Identity

| Property | Value |
|----------|-------|
| Display name | ErikBank |
| Android application ID | `com.erikbank.app` |
| Deeplink scheme | `erikbank://` (also supports legacy `bluewallet://`) |
| RN component name | `ErikBank` |

## Before Publishing

Before submitting to app stores, you will need to:

1. Replace app icons in `ios/BlueWallet/Images.xcassets/` and Android mipmap resources
2. Configure your own Firebase project (`android/app/google-services.json`)
3. Set up Apple Developer and Google Play signing certificates
4. Update bundle identifiers in `ios/BlueWallet.xcodeproj/project.pbxproj` if changing from upstream IDs
5. Configure your own Electrum servers in `blue_modules/constants.ts` (optional)

## License

MIT License — see [LICENSE](LICENSE). Based on BlueWallet by BlueWallet developers.
