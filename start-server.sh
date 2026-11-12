#!/bin/bash
# Script de pornire automată YT2MP3 Server & Tunel
# Poate fi rulat local sau prin SSH de pe iPhone (Comenzi Rapide / Shortcuts)

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=== Verificare YT2MP3 Server ==="

# 1. Pornește serverul Node.js pe portul 3080 dacă nu rulează deja
if ! lsof -i :3080 > /dev/null 2>&1; then
    echo "Pornire node server.js..."
    nohup node server.js > /tmp/yt2mp3_server.log 2>&1 &
    sleep 2
else
    echo "Serverul rulează deja pe portul 3080."
fi

# 2. Verifică / pornește tunelul
echo "Server activ pe http://localhost:3080"
echo "Tailscale IP: $(/Applications/Tailscale.app/Contents/MacOS/Tailscale ip -4 2>/dev/null || echo '100.97.95.82')"
