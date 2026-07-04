-- Demo wallet addresses for ErikBank UPay merchant (merchant_id = 1)
USE upay;

INSERT INTO ea_own_address (address, merchant_id, merchantname, chain_type, img, status, allocation_time, create_time, update_time)
VALUES
    ('TYY8rKMvdC91K7XJ9DqPq9K8gGpB9hN8fL', 1, 'ErikBank Merchant', 1, '/upload/qrcode/erikbank-trc20.png', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    ('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', 1, 'ErikBank Merchant', 2, '/upload/qrcode/erikbank-erc20.png', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE update_time = UNIX_TIMESTAMP();

UPDATE ea_merchant_merchant
SET merchantname = 'ErikBank Merchant', usdt_balance = 100000.00, is_xiadan = 1, status = 1
WHERE id = 1;
