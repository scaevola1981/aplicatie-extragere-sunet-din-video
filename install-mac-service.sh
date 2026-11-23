#!/bin/bash
set -euo pipefail

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICE_DIR="$HOME/.yt2mp3-service"
NODE_BIN="/opt/homebrew/bin/node"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$PLIST_DIR/com.florin.yt2mp3.server.plist"

# Copiem fisierele runtime intr-un folder neprotejat de macOS TCC (Desktop)
mkdir -p "$SERVICE_DIR/public" "$SERVICE_DIR/bin" "$PLIST_DIR"
cp "$PROJECT_DIR/server.js" "$PROJECT_DIR/package.json" "$SERVICE_DIR/"
cp -R "$PROJECT_DIR/public/." "$SERVICE_DIR/public/"
if [ -f "$PROJECT_DIR/bin/yt-dlp" ]; then
  cp "$PROJECT_DIR/bin/yt-dlp" "$SERVICE_DIR/bin/yt-dlp"
  chmod +x "$SERVICE_DIR/bin/yt-dlp"
fi

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.florin.yt2mp3.server</string>

  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>${SERVICE_DIR}/server.js</string>
  </array>

  <key>WorkingDirectory</key>
  <string>${SERVICE_DIR}</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>PORT</key>
    <string>3080</string>
  </dict>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>StandardOutPath</key>
  <string>/tmp/yt2mp3-server.out.log</string>

  <key>StandardErrorPath</key>
  <string>/tmp/yt2mp3-server.err.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)" "$PLIST_PATH" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
launchctl kickstart -k "gui/$(id -u)/com.florin.yt2mp3.server"

echo "✅ Serviciul macOS com.florin.yt2mp3.server a fost instalat și pornit din $SERVICE_DIR!"
