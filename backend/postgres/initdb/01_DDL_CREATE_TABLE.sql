-- ============================================
-- 神仏アプリケーション DDL
-- MVP用テーブル定義
-- ============================================

-- タイムゾーン設定
SET timezone = 'Asia/Tokyo';

-- 拡張機能
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 時代マスタ
CREATE TABLE period (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    start_year INTEGER NOT NULL,
    end_year INTEGER,
    description TEXT,
    display_order INTEGER NOT NULL,
    CONSTRAINT period_year_order CHECK (end_year IS NULL OR end_year >= start_year)
);

COMMENT ON TABLE period IS '時代マスタ（例: 平安時代、鎌倉時代）';
COMMENT ON COLUMN period.name IS '時代名';
COMMENT ON COLUMN period.start_year IS '開始年（西暦）';
COMMENT ON COLUMN period.end_year IS '終了年（西暦、NULL=現在継続中）';
COMMENT ON COLUMN period.display_order IS '表示順（時系列順）';

-- 2. 元号マスタ
CREATE TABLE era (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    name_kana VARCHAR(50),
    start_year INTEGER NOT NULL,
    end_year INTEGER,
    period_id INTEGER NOT NULL REFERENCES period(id),
    display_order INTEGER NOT NULL,
    CONSTRAINT era_year_order CHECK (end_year IS NULL OR end_year >= start_year)
);

COMMENT ON TABLE era IS '元号マスタ（例: 寛永、明治、令和）';
COMMENT ON COLUMN era.name IS '元号名';
COMMENT ON COLUMN era.name_kana IS '元号名カナ（読み仮名）';
COMMENT ON COLUMN era.start_year IS '開始年（西暦）';
COMMENT ON COLUMN era.end_year IS '終了年（西暦、NULL=現在継続中）';
COMMENT ON COLUMN era.period_id IS '所属する時代のID';
COMMENT ON COLUMN era.display_order IS '表示順（時系列順）';

-- 3. 宗派マスタ
CREATE TABLE sect (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    founded_year INTEGER,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sect IS '宗派マスタ';
COMMENT ON COLUMN sect.name IS '宗派名（例: 真言宗、浄土宗）';
COMMENT ON COLUMN sect.founded_year IS '開宗年（西暦）';

-- 4. 寺院情報
CREATE TABLE temple (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_kana VARCHAR(100),
    sect_id INTEGER REFERENCES sect(id),
    prefecture VARCHAR(10) NOT NULL,
    city VARCHAR(50),
    address_detail VARCHAR(200),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    founded_year INTEGER,
    founded_era_id INTEGER REFERENCES era(id),
    is_head_temple BOOLEAN NOT NULL DEFAULT false,
    head_temple_rank VARCHAR(20),
    opening_hours VARCHAR(100),
    goshuin_available BOOLEAN NOT NULL DEFAULT false,
    admission_fee VARCHAR(50),
    official_url VARCHAR(500),
    access_note TEXT,
    nearest_station VARCHAR(100),
    photo_policy TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE temple IS '寺院情報';
COMMENT ON COLUMN temple.name IS '寺院名';
COMMENT ON COLUMN temple.name_kana IS '寺院名カナ';
COMMENT ON COLUMN temple.prefecture IS '都道府県（絞り込み用）';
COMMENT ON COLUMN temple.city IS '市区町村';
COMMENT ON COLUMN temple.address_detail IS '番地以降の詳細住所';
COMMENT ON COLUMN temple.latitude IS '緯度（Google Maps等から取得）';
COMMENT ON COLUMN temple.longitude IS '経度（Google Maps等から取得）';
COMMENT ON COLUMN temple.founded_year IS '創建年（西暦）';
COMMENT ON COLUMN temple.founded_era_id IS '創建元号（例: 寛永）';
COMMENT ON COLUMN temple.is_head_temple IS '総本山・大本山フラグ';
COMMENT ON COLUMN temple.head_temple_rank IS '格: sohonzan(総本山) or daihonzan(大本山)';
COMMENT ON COLUMN temple.opening_hours IS '拝観時間（例: 9:00-17:00）';
COMMENT ON COLUMN temple.goshuin_available IS '御朱印対応';
COMMENT ON COLUMN temple.admission_fee IS '拝観料（例: 無料、500円、300-500円）';
COMMENT ON COLUMN temple.photo_policy IS '撮影ポリシー（例: 境内可、本堂内不可）';

-- 5. 寺院記事
CREATE TABLE temple_article (
    id SERIAL PRIMARY KEY,
    temple_id INTEGER NOT NULL REFERENCES temple(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    reference_url VARCHAR(500),
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE temple_article IS '寺院記事';
COMMENT ON COLUMN temple_article.temple_id IS '対象寺院ID';
COMMENT ON COLUMN temple_article.title IS '記事タイトル';
COMMENT ON COLUMN temple_article.body IS '記事本文';
COMMENT ON COLUMN temple_article.reference_url IS '参考文献URL（Wikipedia等）';
COMMENT ON COLUMN temple_article.published_at IS '公開日時';

-- 6. 用語集
CREATE TABLE glossary_term (
    id SERIAL PRIMARY KEY,
    term VARCHAR(100) NOT NULL UNIQUE,
    reading VARCHAR(100),
    summary VARCHAR(500),
    body TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE glossary_term IS '仏教用語集・歴史用語集';
COMMENT ON COLUMN glossary_term.term IS '用語';
COMMENT ON COLUMN glossary_term.reading IS '読み仮名';
COMMENT ON COLUMN glossary_term.summary IS '短い説明（一覧表示用）';
COMMENT ON COLUMN glossary_term.body IS '詳細説明';

-- 7. 記事-用語関連
CREATE TABLE article_term (
    article_id INTEGER NOT NULL REFERENCES temple_article(id) ON DELETE CASCADE,
    term_id INTEGER NOT NULL REFERENCES glossary_term(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, term_id)
);

COMMENT ON TABLE article_term IS '記事と用語の関連テーブル';
COMMENT ON COLUMN article_term.article_id IS '記事ID';
COMMENT ON COLUMN article_term.term_id IS '用語ID';

-- ============================================
-- インデックス
-- ============================================

-- 検索用インデックス
CREATE INDEX idx_temple_prefecture ON temple(prefecture);
CREATE INDEX idx_temple_sect ON temple(sect_id);
CREATE INDEX idx_temple_location ON temple(latitude, longitude);
CREATE INDEX idx_temple_goshuin ON temple(goshuin_available) WHERE goshuin_available = true;
CREATE INDEX idx_temple_head_temple ON temple(is_head_temple) WHERE is_head_temple = true;

-- 記事検索用
CREATE INDEX idx_temple_article_temple ON temple_article(temple_id);
CREATE INDEX idx_temple_article_published ON temple_article(published_at);

-- 用語検索用
CREATE INDEX idx_glossary_term_term ON glossary_term(term);
CREATE INDEX idx_article_term_article ON article_term(article_id);
CREATE INDEX idx_article_term_term ON article_term(term_id);

-- 時代・元号検索用
CREATE INDEX idx_era_period ON era(period_id);
CREATE INDEX idx_temple_founded_era ON temple(founded_era_id);
CREATE INDEX idx_period_display_order ON period(display_order);
CREATE INDEX idx_era_display_order ON era(display_order);

