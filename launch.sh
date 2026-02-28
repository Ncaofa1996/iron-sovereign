#!/bin/bash
# Iron Sovereign — Desktop Launcher
# Double-click to start the fitness dashboard without opening a terminal.

DIR="$HOME/fitness-dashboard"
URL="http://localhost:5173"

cd "$DIR" || exit 1

# Detect current LAN IP (works even after DHCP lease changes on reboot)
LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++){if($i=="src"){print $(i+1);exit}}}')
[ -z "$LAN_IP" ] && LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')

# Write current IP to public/ — Vite serves it as a static file the app can fetch
mkdir -p "$DIR/public"
printf '{"ip":"%s","port":5173,"url":"http://%s:5173"}' "$LAN_IP" "$LAN_IP" > "$DIR/public/lan-access.json"

# If already running, just open the browser
if curl -sf "$URL" > /dev/null 2>&1; then
  notify-send "Iron Sovereign" "📱 Phone: http://$LAN_IP:5173" 2>/dev/null || true
  xdg-open "$URL" 2>/dev/null || sensible-browser "$URL" 2>/dev/null
  exit 0
fi

# Start Vite dev server in background, log output to .vite.log
nohup npm run dev > "$DIR/.vite.log" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$DIR/.vite.pid"

# Wait up to 30 seconds for server to respond
for i in $(seq 1 30); do
  if curl -sf "$URL" > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Open browser
xdg-open "$URL" 2>/dev/null \
  || sensible-browser "$URL" 2>/dev/null \
  || x-www-browser "$URL" 2>/dev/null

# Desktop notification with phone URL
notify-send "Iron Sovereign" "📱 Phone: http://$LAN_IP:5173" 2>/dev/null || true
