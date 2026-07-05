-- ErikBank merchant bootstrap (wallets configured at runtime by configure-wallets.php)
USE upay;

UPDATE ea_merchant_merchant
SET merchantname = 'ErikBank Merchant', usdt_balance = 100000.00, is_xiadan = 1, status = 1
WHERE id = 1;
