#!/bin/sh
# Plays the recorded Lapa walk into a running Android emulator, one GPS point at a time.
# Usage: ./docs/demo/play-route.sh [seconds between points, default 2]
# Needs adb (in ~/Library/Android/sdk/platform-tools) and one running emulator.
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
STEP="${1:-2}"
DIR="$(cd "$(dirname "$0")" && pwd)"
tail -n +2 "$DIR/lapa-walk.csv" | while IFS=, read -r lat lng; do
  "$ADB" emu geo fix "$lng" "$lat" >/dev/null   # the emulator wants longitude first
  echo "at $lat, $lng"
  sleep "$STEP"
done
echo "Walk finished at the police station."
