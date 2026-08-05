#!/bin/bash
# Rebrand BlueWallet user-facing strings to ErikBank
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Rebranding localization files..."
find loc -name '*.json' -type f -exec sed -i 's/BlueWallet/ErikBank/g' {} +

echo "Rebranding fastlane metadata titles..."
find fastlane/metadata -name 'title.txt' -type f -exec sed -i 's/BlueWallet/ErikBank/g' {} + 2>/dev/null || true
find fastlane/metadata -name 'name.txt' -type f -exec sed -i 's/BlueWallet/ErikBank/g' {} + 2>/dev/null || true

echo "Rebranding iOS watch Interface.strings..."
find ios -name 'Interface.strings' -type f -exec sed -i 's/"BlueWallet"/"ErikBank"/g' {} + 2>/dev/null || true

echo "Rebranding notification channel names..."
sed -i "s/'BlueWallet notifications'/'ErikBank notifications'/g" blue_modules/notifications.ts blue_modules/arkade-notifications.ts 2>/dev/null || true

echo "Done."
