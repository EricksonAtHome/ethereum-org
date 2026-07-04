#!/bin/bash
set -e

if [ ! -f /var/www/html/.env ]; then
  cp /var/www/html/.env.docker /var/www/html/.env
fi

mkdir -p /var/www/html/runtime /var/www/html/public/upload/qrcode /var/upay-secrets/public/phpqrcode
chmod -R 777 /var/www/html/runtime /var/www/html/public/upload
chmod 700 /var/upay-secrets || true

export UPAY_MYSQL_HOST="${UPAY_MYSQL_HOST:-upay-mysql}"
export UPAY_MYSQL_PORT="${UPAY_MYSQL_PORT:-3306}"
export UPAY_MYSQL_DATABASE="${UPAY_MYSQL_DATABASE:-upay}"
export UPAY_MYSQL_USER="${UPAY_MYSQL_USER:-upay}"
export UPAY_MYSQL_PASSWORD="${UPAY_MYSQL_PASSWORD:-upay}"
export UPAY_SECRETS_DIR="${UPAY_SECRETS_DIR:-/var/upay-secrets}"

# Configure real mainnet wallets, QR codes, and API keys
php /var/www/html/scripts/configure-wallets.php || {
  echo "[entrypoint] wallet configuration failed" >&2
  exit 1
}

exec "$@"
