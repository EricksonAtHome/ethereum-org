#!/usr/bin/env php
<?php
declare(strict_types=1);

/**
 * Configure real UPay merchant receive wallets, QR codes, and API keys.
 * Generates new mainnet wallets when env vars are not provided.
 */

const ROOT = __DIR__ . '/..';

require ROOT . '/vendor/autoload.php';

$mysqlHost = getenv('UPAY_MYSQL_HOST') ?: 'upay-mysql';
$mysqlPort = getenv('UPAY_MYSQL_PORT') ?: '3306';
$mysqlDb = getenv('UPAY_MYSQL_DATABASE') ?: 'upay';
$mysqlUser = getenv('UPAY_MYSQL_USER') ?: 'upay';
$mysqlPass = getenv('UPAY_MYSQL_PASSWORD') ?: 'upay';
$secretsDir = getenv('UPAY_SECRETS_DIR') ?: '/var/upay-secrets';
$merchantId = (int) (getenv('UPAY_MERCHANT_ID') ?: '1');
$merchantName = getenv('UPAY_MERCHANT_NAME') ?: 'ErikBank Merchant';

$trcWallet = trim((string) (getenv('UPAY_TRC20_WALLET') ?: ''));
$ercWallet = trim((string) (getenv('UPAY_ERC20_WALLET') ?: ''));
$infuraKey = trim((string) (getenv('INFURA_API_KEY') ?: getenv('INFURA_SECRET') ?: ''));
$etherscanKey = trim((string) (getenv('ETHERSCAN_API_KEY') ?: ''));

function waitForMysql(string $dsn, string $user, string $pass, int $attempts = 60): PDO
{
    $last = null;
    for ($i = 0; $i < $attempts; $i++) {
        try {
            return new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]);
        } catch (Throwable $e) {
            $last = $e;
            sleep(2);
        }
    }
    throw $last ?? new RuntimeException('MySQL unavailable');
}

function ensureDir(string $path): void
{
    if (!is_dir($path)) {
        mkdir($path, 0700, true);
    }
}

function saveSecret(string $dir, string $name, array $payload): void
{
    ensureDir($dir);
    file_put_contents(
        $dir . '/' . $name,
        json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
    );
    chmod($dir . '/' . $name, 0600);
}

function isTrcAddress(string $address): bool
{
    try {
        $tron = new IEXBase\TronAPI\Tron();
        return (bool) $tron->isAddress($address);
    } catch (Throwable) {
        return false;
    }
}

function isErcAddress(string $address): bool
{
    return (bool) preg_match('/^(0x)?[0-9a-fA-F]{40}$/', $address);
}

function generateTrcWallet(): array
{
    $tron = new IEXBase\TronAPI\Tron();
    $generated = $tron->generateAddress();
    $raw = $generated->getRawData();
    if (empty($raw['address_base58'])) {
        throw new RuntimeException('Failed to generate TRC20 wallet');
    }
    return [
        'address' => $raw['address_base58'],
        'private_key' => $raw['private_key'],
        'public_key' => $raw['public_key'] ?? null,
    ];
}

function generateErcWallet(): array
{
    $wallet = kgsweb3\Wallet::create();
    $address = $wallet->getAddress();
    if (empty($address)) {
        throw new RuntimeException('Failed to generate ERC20 wallet');
    }
    return [
        'address' => $address,
        'private_key' => $wallet->getPrivateKey(),
    ];
}

function generateQr(string $address, int $chainType): string
{
    require_once ROOT . '/vendor/phpqrcode/phpqrcode.php';
    $relative = '/upload/qrcode/erikbank-' . ($chainType === 1 ? 'trc20' : 'erc20') . '.png';
    $absolute = ROOT . '/public' . $relative;
    ensureDir(dirname($absolute));
    $qr = new QRcode();
    $qr->png($address, $absolute, 'M', 6, 2);
    return $relative;
}

function upsertOwnAddress(PDO $pdo, int $merchantId, string $merchantName, int $chainType, string $address, string $img): void
{
    $stmt = $pdo->prepare('SELECT id FROM ea_own_address WHERE merchant_id = ? AND chain_type = ? LIMIT 1');
    $stmt->execute([$merchantId, $chainType]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    $now = time();

    if ($existing) {
        $update = $pdo->prepare(
            'UPDATE ea_own_address SET address = ?, img = ?, status = 1, update_time = ? WHERE id = ?'
        );
        $update->execute([$address, $img, $now, $existing['id']]);
        return;
    }

    $insert = $pdo->prepare(
        'INSERT INTO ea_own_address (address, merchant_id, merchantname, chain_type, img, status, allocation_time, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)'
    );
    $insert->execute([$address, $merchantId, $merchantName, $chainType, $img, $now, $now, $now]);
}

function updateEnvFile(string $infuraKey, string $etherscanKey): void
{
    $envFile = ROOT . '/.env';
    if (!file_exists($envFile)) {
        return;
    }
    $content = file_get_contents($envFile);
    if ($infuraKey !== '') {
        if (preg_match('/^secret\s*=.*/m', $content)) {
            $content = preg_replace('/^secret\s*=.*/m', 'secret=' . $infuraKey, $content);
        } elseif (preg_match('/^KEY\s*=.*/m', $content)) {
            $content = preg_replace('/^KEY\s*=.*/m', 'KEY=' . $infuraKey, $content);
        } else {
            $content .= "\n[INFURA]\nsecret=" . $infuraKey . "\n";
        }
    }
    if ($etherscanKey !== '') {
        if (preg_match('/^api_key\s*=.*/m', $content)) {
            $content = preg_replace('/^api_key\s*=.*/m', 'api_key=' . $etherscanKey, $content);
        } else {
            $content .= "\n[ETHERSCAN]\napi_key=" . $etherscanKey . "\n";
        }
    }
    file_put_contents($envFile, $content);
}

function warmExchangeRates(PDO $pdo): void
{
    // Trigger UPay rate fetch by clearing stale cache keys if Redis is reachable.
    $redisHost = getenv('REDIS_HOST') ?: 'upay-redis';
    $redisPort = (int) (getenv('REDIS_PORT') ?: '6379');
    if (!class_exists('Redis')) {
        return;
    }
    try {
        $redis = new \Redis();
        $redis->connect($redisHost, $redisPort, 2);
        $redis->del('usdt_USD', 'usdt_EUR', 'usdt_CNY');
    } catch (Throwable) {
        // Rates will be fetched live on first order.
    }
}

$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8', $mysqlHost, $mysqlPort, $mysqlDb);
$pdo = waitForMysql($dsn, $mysqlUser, $mysqlPass);
ensureDir($secretsDir);

if ($trcWallet === '' || !isTrcAddress($trcWallet)) {
    $generated = generateTrcWallet();
    $trcWallet = $generated['address'];
    saveSecret($secretsDir, 'trc20-wallet.json', $generated);
    fwrite(STDOUT, "[upay-config] Generated REAL TRC20 receive wallet: {$trcWallet}\n");
} else {
    fwrite(STDOUT, "[upay-config] Using configured TRC20 wallet: {$trcWallet}\n");
}

if ($ercWallet === '' || !isErcAddress($ercWallet)) {
    $generated = generateErcWallet();
    $ercWallet = $generated['address'];
    saveSecret($secretsDir, 'erc20-wallet.json', $generated);
    fwrite(STDOUT, "[upay-config] Generated REAL ERC20 receive wallet: {$ercWallet}\n");
} else {
    fwrite(STDOUT, "[upay-config] Using configured ERC20 wallet: {$ercWallet}\n");
}

$trcQr = generateQr($trcWallet, 1);
$ercQr = generateQr($ercWallet, 2);
upsertOwnAddress($pdo, $merchantId, $merchantName, 1, $trcWallet, $trcQr);
upsertOwnAddress($pdo, $merchantId, $merchantName, 2, $ercWallet, $ercQr);

$pdo->exec("UPDATE ea_merchant_merchant SET merchantname = " . $pdo->quote($merchantName) .
    ", usdt_balance = 100000.00, is_xiadan = 1, status = 1 WHERE id = {$merchantId}");

$appId = trim((string) (getenv('UPAY_APP_ID') ?: ''));
$appSecret = trim((string) (getenv('UPAY_APP_SECRET') ?: ''));
if ($appId !== '' && $appSecret !== '') {
    $stmt = $pdo->prepare('UPDATE ea_merchant_merchant SET appid = ?, appsecret = ? WHERE id = ?');
    $stmt->execute([$appId, $appSecret, $merchantId]);
}

if ($infuraKey !== '') {
    updateEnvFile($infuraKey, $etherscanKey);
    $exists = $pdo->prepare("SELECT id FROM ea_system_config WHERE name = 'infura' AND `group` = 'site' LIMIT 1");
    $exists->execute();
    $row = $exists->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $upd = $pdo->prepare("UPDATE ea_system_config SET value = ? WHERE id = ?");
        $upd->execute([$infuraKey, $row['id']]);
    } else {
        $ins = $pdo->prepare("INSERT INTO ea_system_config (name, `group`, value, title, sort, create_time, update_time) VALUES ('infura', 'site', ?, 'Infura API Key', 0, ?, ?)");
        $now = time();
        $ins->execute([$infuraKey, $now, $now]);
    }
    fwrite(STDOUT, "[upay-config] Infura API key configured for ERC20 monitoring\n");
} else {
    fwrite(STDERR, "[upay-config] WARNING: INFURA_API_KEY not set — ERC20 balance checks may fail. Etherscan tx matching still works.\n");
}

if ($etherscanKey !== '') {
    updateEnvFile($infuraKey, $etherscanKey);
}

warmExchangeRates($pdo);

fwrite(STDOUT, "[upay-config] Real wallet QR codes written to public/upload/qrcode/\n");
fwrite(STDOUT, "[upay-config] TRC20 explorer: https://tronscan.org/#/address/{$trcWallet}\n");
fwrite(STDOUT, "[upay-config] ERC20 explorer: https://etherscan.io/address/{$ercWallet}\n");
