echo "[Debug] kill server"
npx pm2 kill

echo "[Debug] restart server"
npm run start:prod

echo "[Debug] run logs"
npx pm2 logs