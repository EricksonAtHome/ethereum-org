#!/bin/bash
set -e

if [ ! -f /var/www/html/.env ]; then
  cp /var/www/html/.env.docker /var/www/html/.env
fi

mkdir -p /var/www/html/runtime /var/www/html/public/upload/qrcode
chmod -R 777 /var/www/html/runtime /var/www/html/public/upload

if [ -f /var/www/html/public/demo-qrcode.png ]; then
  cp /var/www/html/public/demo-qrcode.png /var/www/html/public/upload/qrcode/erikbank-trc20.png
  cp /var/www/html/public/demo-qrcode.png /var/www/html/public/upload/qrcode/erikbank-erc20.png
fi

# Seed exchange rates in Redis so UPay can price orders offline
if [ -n "${REDIS_HOST:-}" ]; then
  for i in $(seq 1 30); do
    if redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" ping >/dev/null 2>&1; then
      redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" SET usdt_CNY 7.25 EX 86400 >/dev/null || true
      redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" SET usdt_EUR 0.92 EX 86400 >/dev/null || true
      redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" SET usdt_USD 1 EX 86400 >/dev/null || true
      break
    fi
    sleep 2
  done
fi

exec "$@"
