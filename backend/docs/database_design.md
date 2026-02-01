# 神仏アプリケーション データベース設計書

## 📋 概要
本ドキュメントは、お寺めぐり・御朱印集めが趣味のライトユーザー向け神仏アプリケーションのMVP版データベース設計を記載します。

## 🗂️ テーブル一覧

| No | テーブル名 | 論理名 | 説明 |
|----|-----------|--------|------|
| 1 | period | 時代マスタ | 歴史的時代区分を管理 |
| 2 | era | 元号マスタ | 元号（年号）を管理 |
| 3 | sect | 宗派マスタ | 仏教宗派の情報 |
| 4 | temple | 寺院情報 | 寺院の基本情報と拝観情報 |
| 5 | temple_article | 寺院記事 | 寺院の歴史や見どころの記事 |
| 6 | glossary_term | 用語集 | 仏教用語・歴史用語 |
| 7 | article_term | 記事-用語関連 | 記事と用語の多対多関連 |

## 🔗 ER図（概念）

```
period (時代) ──┐
                │
                └── era (元号)
                      │
                      └── temple.founded_era_id

sect (宗派)
  │
  └── temple.sect_id

temple (寺院) ──┬── temple_article (記事)
                │      │
                │      └── article_term ── glossary_term (用語)
```

---

## 🎯 設計方針

### バリデーション責務分担（ハイブリッドアプローチ）

#### 🗄️ DB層の責務
- **NOT NULL制約**: 必須項目の強制
- **UNIQUE制約**: 一意性の保証
- **PRIMARY KEY**: 主キーの保証
- **FOREIGN KEY**: 参照整合性の保証
- **CHECK制約（最小限）**: 
  - 論理的矛盾の防止（例: end_year >= start_year）
  - 固定値の列挙（例: IN ('value1', 'value2')）
  - 複数列の整合性保証

#### 💻 アプリケーション層の責務
- 詳細なバリデーション（文字列長、範囲、形式）
- ビジネスルール
- 親切なエラーメッセージ
- タイムスタンプ管理（@CreatedDate, @LastModifiedDate）

### タイムスタンプ管理
- ❌ DBトリガーは使用しない（複雑化、デバッグ困難）
- ✅ Spring Bootの`@CreatedDate`/`@LastModifiedDate`を使用
- ✅ アプリケーション層で明示的に管理

---

## 📊 1. period（時代マスタ）

### 概要
日本の歴史的時代区分を管理するマスタテーブル（例: 平安時代、鎌倉時代、江戸時代）。

### テーブル定義

| カラム名 | 型 | NULL | デフォルト | 制約 | 説明 |
|---------|-----|------|-----------|------|------|
| id | SERIAL | NOT NULL | AUTO | PK | ID |
| name | VARCHAR(50) | NOT NULL | - | UNIQUE | 時代名（例: 平安時代、江戸時代） |
| start_year | INTEGER | NOT NULL | - | - | 開始年（西暦） |
| end_year | INTEGER | NULL | - | - | 終了年（西暦、NULL=現在継続中） |
| description | TEXT | NULL | - | - | 時代の説明 |
| display_order | INTEGER | NOT NULL | - | - | 表示順（時系列順） |

### 設計意図
- シンプルな時代区分マスタ
- `end_year`がNULLの場合は現在継続中（令和時代など）
- `display_order`で時系列順にソート可能

### サンプルデータ
```sql
('平安時代', 794, 1185, '平安京の時代。貴族文化が栄えた', 30)
('江戸時代', 1603, 1868, '江戸幕府の時代。泰平の世が続く', 70)
('令和時代', 2019, NULL, '現在の時代', 120)
```

---

## 2. era（元号マスタ）

### 概要
元号（年号）を管理するマスタテーブル（例: 寛永、明治、令和）。

### テーブル定義

| カラム名 | 型 | NULL | デフォルト | 制約 | 説明 |
|---------|-----|------|-----------|------|------|
| id | SERIAL | NOT NULL | AUTO | PK | ID |
| name | VARCHAR(50) | NOT NULL | - | UNIQUE | 元号名（例: 寛永、明治、令和） |
| name_kana | VARCHAR(50) | NULL | - | - | 元号名カナ（ふりがな） |
| start_year | INTEGER | NOT NULL | - | - | 開始年（西暦） |
| end_year | INTEGER | NULL | - | - | 終了年（西暦、NULL=現在継続中） |
| period_id | INTEGER | NOT NULL | - | FK(period.id) | 所属する時代のID |
| display_order | INTEGER | NOT NULL | - | - | 表示順（時系列順） |

### 設計意図
- 元号は必ず時代（period）に所属する
- `name_kana`で読み仮名検索に対応
- `end_year`がNULLの場合は現在継続中（令和）
- `display_order`で時系列順にソート可能

### サンプルデータ
```sql
-- 江戸時代の元号（period_id = 7）
('寛永', 'かんえい', 1624, 1645, 7, 701)
('元禄', 'げんろく', 1688, 1704, 7, 703)

-- 現代の元号（period_id = 12）
('令和', 'れいわ', 2019, NULL, 12, 1201)
```

---

## 3. sect（宗派マスタ）

### 概要
仏教宗派の基本情報を管理するマスタテーブル。

### テーブル定義

| カラム名 | 型 | NULL | デフォルト | 制約 | 説明 |
|---------|-----|------|-----------|------|------|
| id | SERIAL | NOT NULL | AUTO | PK | ID |
| name | VARCHAR(50) | NOT NULL | - | UNIQUE | 宗派名（例: 真言宗、浄土宗） |
| founded_year | INTEGER | NULL | - | - | 開宗年（西暦） |
| description | TEXT | NULL | - | - | 宗派の説明 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | - | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | - | 更新日時（自動更新） |

### 設計意図
- シンプルな宗派マスタ
- `founded_year`は西暦のみ（元号参照は不要と判断）
- 総本山情報は`temple`テーブルで管理

### サンプルデータ
```sql
('天台宗', 806, '最澄が開いた宗派。比叡山延暦寺を総本山とする。')
('真言宗', 806, '空海（弘法大師）が開いた密教の宗派。高野山金剛峯寺を総本山とする。')
('浄土宗', 1175, '法然が開いた宗派。念仏により極楽浄土への往生を説く。')
```

---

## 4. temple（寺院情報）

### 概要
寺院の基本情報、位置情報、拝観情報を管理する中心テーブル。

### テーブル定義

| カラム名 | 型 | NULL | デフォルト | 制約 | 説明 |
|---------|-----|------|-----------|------|------|
| id | SERIAL | NOT NULL | AUTO | PK | ID |
| name | VARCHAR(100) | NOT NULL | - | - | 寺院名 |
| name_kana | VARCHAR(100) | NULL | - | - | 寺院名カナ（ふりがな） |
| sect_id | INTEGER | NULL | - | FK(sect.id) | 宗派ID |
| prefecture | VARCHAR(10) | NOT NULL | - | - | 都道府県（絞り込み用） |
| city | VARCHAR(50) | NULL | - | - | 市区町村 |
| address_detail | VARCHAR(200) | NULL | - | - | 番地以降の詳細住所 |
| latitude | DECIMAL(10,7) | NULL | - | - | 緯度（地図表示用） |
| longitude | DECIMAL(10,7) | NULL | - | - | 経度（地図表示用） |
| founded_year | INTEGER | NULL | - | - | 創建年（西暦） |
| founded_era_id | INTEGER | NULL | - | FK(era.id) | 創建元号ID |
| is_head_temple | BOOLEAN | NOT NULL | false | - | 総本山・大本山フラグ |
| head_temple_rank | VARCHAR(20) | NULL | - | CHECK (sohonzan/daihonzan) | 格: 総本山 or 大本山 |
| opening_hours | VARCHAR(100) | NULL | - | - | 拝観時間（例: 9:00-17:00） |
| goshuin_available | BOOLEAN | NOT NULL | false | - | 御朱印対応可否 |
| admission_fee | VARCHAR(50) | NULL | - | - | 拝観料（例: 無料、500円） |
| official_url | VARCHAR(500) | NULL | - | - | 公式サイトURL |
| access_note | TEXT | NULL | - | - | アクセス情報 |
| nearest_station | VARCHAR(100) | NULL | - | - | 最寄り駅 |
| photo_policy | TEXT | NULL | - | - | 撮影ポリシー |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | - | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | - | 更新日時（自動更新） |

### 設計意図
- **住所の分割**: `prefecture`（都道府県）で絞り込み検索を効率化
- **創建年の柔軟性**: `founded_year`（西暦）と`founded_era_id`（元号）の両方を持つ
- **総本山管理**: `is_head_temple`フラグと`head_temple_rank`で総本山・大本山を識別
- **御朱印対応**: `goshuin_available`でフィルタリング可能
- **拝観料**: 文字列型で「無料」「300-500円」などの柔軟な表現に対応
- **撮影ポリシー**: TEXT型で詳細な説明を記載可能

### インデックス
- `idx_temple_prefecture`: 都道府県での絞り込み
- `idx_temple_sect`: 宗派での絞り込み
- `idx_temple_location`: 緯度経度での地図検索
- `idx_temple_goshuin`: 御朱印対応寺院の抽出（部分インデックス）
- `idx_temple_head_temple`: 総本山・大本山の抽出（部分インデックス）

### サンプルデータ
```sql
-- 清水寺
('清水寺', 'きよみずでら', NULL, '京都府', '京都市東山区', '清水1-294',
 34.994857, 135.785049, 778, NULL, false, NULL, 
 '6:00-18:00（季節により変動）', true, '400円', 
 'https://www.kiyomizudera.or.jp/', ...)

-- 金剛峯寺（総本山）
('金剛峯寺', 'こんごうぶじ', 2, '和歌山県', '伊都郡高野町', '高野山132',
 34.213333, 135.580556, 816, NULL, true, 'sohonzan', 
 '8:30-17:00', true, '1,000円', ...)
```

---

## 5. temple_article（寺院記事）

### 概要
寺院の歴史、見どころ、文化財などを説明する記事を管理。

### テーブル定義

| カラム名 | 型 | NULL | デフォルト | 制約 | 説明 |
|---------|-----|------|-----------|------|------|
| id | SERIAL | NOT NULL | AUTO | PK | ID |
| temple_id | INTEGER | NOT NULL | - | FK(temple.id) ON DELETE CASCADE | 対象寺院ID |
| title | VARCHAR(200) | NOT NULL | - | - | 記事タイトル |
| body | TEXT | NOT NULL | - | - | 記事本文 |
| reference_url | VARCHAR(500) | NULL | - | - | 参考文献URL（Wikipedia等） |
| published_at | TIMESTAMP | NULL | - | - | 公開日時 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | - | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | - | 更新日時（自動更新） |

### 設計意図
- 1つの寺院に複数の記事を関連付け可能
- `reference_url`でWikipediaなどの参考文献を記録
- `temple`削除時にカスケード削除（ON DELETE CASCADE）
- `official_url`（寺院の公式サイト）とは別に`reference_url`を持つ

### インデックス
- `idx_temple_article_temple`: 寺院IDでの検索
- `idx_temple_article_published`: 公開日時でのソート

### サンプルデータ
```sql
(1, '清水寺の歴史と清水の舞台', 
 '清水寺は、778年に延鎮上人によって開山されたと伝えられる...', 
 'https://www.kiyomizudera.or.jp/', CURRENT_TIMESTAMP)
```

---

## 6. glossary_term（用語集）

### 概要
仏教用語や歴史用語を管理し、記事本文からリンク可能にする。

### テーブル定義

| カラム名 | 型 | NULL | デフォルト | 制約 | 説明 |
|---------|-----|------|-----------|------|------|
| id | SERIAL | NOT NULL | AUTO | PK | ID |
| term | VARCHAR(100) | NOT NULL | - | UNIQUE | 用語（例: 観音菩薩、応仁の乱） |
| reading | VARCHAR(100) | NULL | - | - | 読み仮名 |
| summary | VARCHAR(500) | NULL | - | - | 短い説明（一覧表示用） |
| body | TEXT | NULL | - | - | 詳細説明 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | - | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | - | 更新日時（自動更新） |

### 設計意図
- `term`はUNIQUE制約で重複登録を防止
- `summary`で一覧表示、`body`で詳細説明の2段階表示
- `reading`で読み仮名検索に対応

### インデックス
- `idx_glossary_term_term`: 用語での検索

### サンプルデータ
```sql
('観音菩薩', 'かんのんぼさつ', '人々を救済する慈悲の仏', 
 '観世音菩薩とも呼ばれ、衆生の声を聞いて救済する仏教の菩薩...')

('応仁の乱', 'おうにんのらん', '室町時代の大規模な内乱', 
 '1467年から1477年にかけて起こった室町幕府の後継者争い...')
```

---

## 7. article_term（記事-用語関連）

### 概要
記事と用語の多対多関連を管理する中間テーブル。

### テーブル定義

| カラム名 | 型 | NULL | デフォルト | 制約 | 説明 |
|---------|-----|------|-----------|------|------|
| article_id | INTEGER | NOT NULL | - | PK, FK(temple_article.id) ON DELETE CASCADE | 記事ID |
| term_id | INTEGER | NOT NULL | - | PK, FK(glossary_term.id) ON DELETE CASCADE | 用語ID |

### 設計意図
- 複合主キー（article_id, term_id）
- 記事削除時・用語削除時にカスケード削除
- 記事内で使用される用語を登録し、自動リンクやタグ検索に活用

### インデックス
- `idx_article_term_article`: 記事IDでの検索
- `idx_article_term_term`: 用語IDでの検索

### サンプルデータ
```sql
-- 清水寺の記事に関連する用語
(1, 1),  -- 観音菩薩
(1, 4),  -- 本堂
(1, 5),  -- 御朱印
(1, 7)   -- 開山
```

---

## 📈 インデックス戦略

### 検索用インデックス
- **都道府県絞り込み**: `idx_temple_prefecture`
- **宗派絞り込み**: `idx_temple_sect`
- **地図検索**: `idx_temple_location`（緯度・経度の複合）
- **御朱印対応**: `idx_temple_goshuin`（部分インデックス、WHERE goshuin_available = true）
- **総本山**: `idx_temple_head_temple`（部分インデックス、WHERE is_head_temple = true）

### 記事検索用
- **寺院の記事取得**: `idx_temple_article_temple`
- **新着記事ソート**: `idx_temple_article_published`

### 用語検索用
- **用語検索**: `idx_glossary_term_term`
- **記事の用語取得**: `idx_article_term_article`
- **用語が使われる記事取得**: `idx_article_term_term`

### 時代・元号検索用
- **元号の時代取得**: `idx_era_period`
- **創建元号検索**: `idx_temple_founded_era`
- **時代の時系列ソート**: `idx_period_display_order`
- **元号の時系列ソート**: `idx_era_display_order`

---

## 🔒 データ整合性

### 外部キー制約
- `era.period_id` → `period.id`（時代参照）
- `temple.sect_id` → `sect.id`（宗派参照）
- `temple.founded_era_id` → `era.id`（元号参照）
- `temple_article.temple_id` → `temple.id` ON DELETE CASCADE
- `article_term.article_id` → `temple_article.id` ON DELETE CASCADE
- `article_term.term_id` → `glossary_term.id` ON DELETE CASCADE

### CHECK制約（最小限）

#### 論理的整合性
```sql
-- 時代・元号: 終了年 >= 開始年
CONSTRAINT period_year_order CHECK (end_year IS NULL OR end_year >= start_year)
CONSTRAINT era_year_order CHECK (end_year IS NULL OR end_year >= start_year)

-- 寺院: 総本山フラグとランクの整合性
CONSTRAINT temple_head_temple_rank_valid CHECK (
    (is_head_temple = false AND head_temple_rank IS NULL) OR
    (is_head_temple = true AND head_temple_rank IS NOT NULL)
)
```

#### 固定値の列挙
```sql
-- 総本山ランク
head_temple_rank CHECK (head_temple_rank IN ('sohonzan', 'daihonzan'))
```

### UNIQUE制約
- `period.name`: 時代名は一意
- `era.name`: 元号名は一意
- `sect.name`: 宗派名は一意
- `glossary_term.term`: 用語は一意

---

## 今後の拡張（Phase 2以降）

### 予定されている追加テーブル
1. **users（ユーザー）**: 認証・プロフィール管理
2. **notable_person（著名人）**: 開祖・住職・文化人など
3. **temple_person（寺院-人物関連）**: 寺院と関連人物の多対多
4. **person_article（人物記事）**: 人物の解説記事
5. **favorites（お気に入り）**: ユーザーのお気に入り寺院
6. **visit_logs（訪問記録）**: ユーザーの参拝履歴

---

## 📝 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2026-01-22 | 1.1 | トリガーを削除（updated_at管理をアプリ層に移行）<br>CHECK制約を最小限に簡略化<br>タイムゾーンをAsia/Tokyoに設定 |
| 2026-01-20 | 1.0 | 初版作成（MVP版7テーブル）<br>時代と元号を別テーブルに分離 |
| 2026-01-20 | 1.1 | 時代と元号のテーブルを分離（period/eraに分割、合計7テーブル） |
