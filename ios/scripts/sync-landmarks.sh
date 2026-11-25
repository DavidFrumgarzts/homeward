#!/bin/sh
# Copies Beacon's map pictures (docs/design/landmarks/*.svg, made by make_landmarks.py) and the cop
# into the iOS asset catalog. Run from anywhere after the pictures change:
#   sh ios/scripts/sync-landmarks.sh
# BeaconTests/AssetsInSyncTests.swift fails if the copies here fall behind the originals.
set -e
cd "$(dirname "$0")/.."
ASSETS="Beacon/Assets.xcassets"
add() { # add <source.svg> <AssetName>
  dir="$ASSETS/$2.imageset"
  mkdir -p "$dir"
  cp "$1" "$dir/$(basename "$1")"
  printf '{\n  "images" : [ { "filename" : "%s", "idiom" : "universal" } ],\n  "info" : { "author" : "xcode", "version" : 1 },\n  "properties" : { "preserves-vector-representation" : true }\n}\n' "$(basename "$1")" > "$dir/Contents.json"
}
for name in arcos bar catedral hospital hostel police steps; do
  add "../docs/design/landmarks/$name.svg" "landmark_$name"
done
add "../docs/design/cop/cop-start-frame.svg" "beacon_cop"
echo "Synced landmark pictures into $ASSETS"
