-- ============================================
-- デモ用 Customerテーブル
-- ============================================
-- 注意: このファイルはデモ・テスト用です。
-- 本番環境では使用しないでください。

CREATE TABLE IF NOT EXISTS customer (
    id VARCHAR(10) PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL,
    phone_number VARCHAR(11) NOT NULL,
    post_code VARCHAR(7) NOT NULL
);

COMMENT ON TABLE customer IS 'デモ用顧客テーブル';
COMMENT ON COLUMN customer.id IS '顧客ID';
COMMENT ON COLUMN customer.username IS 'ユーザー名';
COMMENT ON COLUMN customer.email IS 'メールアドレス';
COMMENT ON COLUMN customer.phone_number IS '電話番号（10-11桁）';
COMMENT ON COLUMN customer.post_code IS '郵便番号（7桁）';

-- デモ用サンプルデータ
INSERT INTO customer VALUES ('001', 'user001', 'test.user.001@example.com', '09012345678', '1234567');
INSERT INTO customer VALUES ('002', 'user002', 'test.user.002@example.com', '08023456789', '2345678');
INSERT INTO customer VALUES ('003', 'user003', 'test.user.003@example.com', '09034567890', '3456789');
INSERT INTO customer VALUES ('004', 'user004', 'test.user.004@example.com', '08045678901', '4567890');
INSERT INTO customer VALUES ('005', 'user005', 'test.user.005@example.com', '09056789012', '5678901');
