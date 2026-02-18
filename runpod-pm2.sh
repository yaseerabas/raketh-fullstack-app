#!/usr/bin/env sh
set -eu

APP_NAME="raketh-nextjs-app"
APP_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

cd "$APP_DIR"

echo "[1/5] Ensuring PM2 is installed..."
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

echo "[2/5] Installing dependencies..."
npm install

echo "[3/5] Building Next.js app..."
npm run build

echo "[4/5] Starting app with PM2 on port 80..."
pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
PORT=80 HOSTNAME=0.0.0.0 NODE_ENV=production pm2 start npm --name "$APP_NAME" -- start

echo "[5/5] Saving PM2 process list..."
pm2 save

echo
pm2 status "$APP_NAME"
echo
echo "Done. App is running in background via PM2 on port 80."
echo "Logs: pm2 logs $APP_NAME"
echo "Restart: pm2 restart $APP_NAME"
echo "Stop: pm2 stop $APP_NAME"
