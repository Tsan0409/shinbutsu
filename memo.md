<!-- 要件メモ -->
## 概要
寺院情報と仏教の基礎知識を、ライトユーザー向けに確認できるアプリケーションを作成する。
※神社要素は将来的に同様の要件で追加予定。

## 想定ユーザー
お寺めぐりや御朱印集めが趣味のライトユーザー。

## 主要機能
### 1) お寺情報のブログ記事
- 気になるお寺を探して情報を調べられる。
- 一次情報への動線を用意する。
- 記事内で登場する仏教用語は、用語集/基礎知識へリンクする。

### 2) マップ表示
- マップ上にお寺を表示する。
- マップからお寺情報のブログ記事にアクセスできる。
- マップ上で興味のあるお寺に絞り込みできる。
- 行ったことがある場所にはスタンプラリーのようなマークを付ける。

## 優先度
### 必須 (MVP) - ファーストリリース
- 記事 + 用語集の閲覧。
- マップ表示 + 記事への導線。
- 絞り込み (宗派/御朱印対応/拝観時間/アクセスなど)。
- 一次情報リンクと更新日表示。
- 記事内の用語をタップで簡易解説。

### フェーズ2（認証機能）
- ユーザー登録・ログイン機能
- 行ったことがある場所の記録 (手動チェック対応)。
- 行ったことあるお寺リスト/行ってみたいお寺リスト。

### 将来
- 特別公開などの日程の通知やおすすめ (頻度や対象の設定付き)。
- イベント情報の管理・表示

## 追加メモ
- 初回導線: 近くの寺/人気の御朱印/初心者向け など入口カードを用意する。
- コンテンツ運用: 誰が記事を作成・更新するかの方針を決める。

## テーブル定義

### MVPテーブル（6つ）- ファーストリリース
以下の6テーブルで記事閲覧・用語集・マップ表示・絞り込み機能を実現。

### era（時代・元号）
| カラム | 説明 | 制約 |
| --- | --- | --- |
| id | ID | PK |
| name | 名称 | NOT NULL, 例: 平安時代、寛永、明治 |
| type | 種別 | 'period'(時代), 'era'(元号) |
| start_year | 開始年 | |
| end_year | 終了年 | |
| parent_period_id | 所属時代 | FK -> era.id, 元号が所属する時代 |
| description | 説明 | TEXT |
| display_order | 表示順 | INTEGER |

※例: 「寛永」(元号) は parent_period_id で「江戸時代」(時代)を参照
※明治以降は元号と時代が一致

### sect
| カラム | 説明 | 制約 |
| --- | --- | --- |
| id | ID | PK |
| name | 宗派名 | UNIQUE, NOT NULL |
| founder_person_id | 宗祖 | FK -> notable_person.id (フェーズ2以降) |
| founded_year | 開宗年 | |
| description | 説明 | TEXT |
| created_at | 作成日時 | |
| updated_at | 更新日時 | |

※総本山は temple.is_head_temple と head_temple_rank で管理

### temple
| カラム | 説明 | 制約 |
| --- | --- | --- |
| id | ID | PK |
| name | 名称 | NOT NULL |
| name_kana | 名称カナ | |
| sect_id | 宗派ID | FK -> sect.id |
| prefecture | 都道府県 | NOT NULL |
| city | 市区町村 | |
| address_detail | 番地以降 | |
| latitude | 緯度 | DECIMAL(10,7) |
| longitude | 経度 | DECIMAL(10,7) |
| era_id | 時代 | FK -> era.id (type='period') |
| founded_year | 創建年 | 西暦 |
| founded_era_id | 創建元号 | FK -> era.id (type='era'), 例: 寛永 |
| founder_person_id | 開山 | FK -> notable_person.id (フェーズ2以降) |
| is_head_temple | 総本山・大本山 | BOOLEAN DEFAULT false |
| head_temple_rank | 格 | 'sohonzan', 'daihonzan', null |
| opening_hours | 拝観時間 | |
| goshuin_available | 御朱印対応 | BOOLEAN |
| admission_fee | 拝観料 | |
| official_url | 公式URL | |
| access_note | アクセス補足 | TEXT |
| nearest_station | 最寄駅 | |
| photo_policy | 撮影ポリシー | TEXT |
| created_at | 作成日時 | |
| updated_at | 更新日時 | |

### temple_article
| カラム | 説明 | 制約 |
| --- | --- | --- |
| id | ID | PK |
| temple_id | 寺院ID | FK -> temple.id |
| title | タイトル | NOT NULL |
| body | 本文 | TEXT, NOT NULL |
| reference_url | 参考文献URL | 記事作成時の参考文献（Wikipedia等） |
| published_at | 公開日 | |
| created_at | 作成日時 | |
| updated_at | 更新日時 | |

### glossary_term
| カラム | 説明 | 制約 |
| --- | --- | --- |
| id | ID | PK |
| term | 用語 | UNIQUE |
| reading | 読み |  |
| summary | 短い説明 |  |
| body | 詳細 |  |
| created_at | 作成日時 |  |
| updated_at | 更新日時 |  |

### article_term
| カラム | 説明 | 制約 |
| --- | --- | --- |
| article_id | 記事ID | PK, FK -> temple_article.id |
| term_id | 用語ID | PK, FK -> glossary_term.id |

※記事内で使われている仏教用語をタグ付けする中間テーブル
※用語から記事を検索、記事から関連用語を表示する際に使用

### notable_person（著名人）- フェーズ2以降
| カラム | 説明 | 制約 |
| --- | --- | --- |
| id | ID | PK |
| name | 名前 | NOT NULL |
| name_kana | 名前カナ | |
| category | 分類 | 'monk', 'samurai', 'nobility', 'artist', 'emperor' |
| birth_era_id | 生まれた時代 | FK -> era.id |
| death_era_id | 没した時代 | FK -> era.id |
| birth_year | 生年（西暦） | 詳細情報用 |
| death_year | 没年（西暦） | 詳細情報用 |
| description | 説明 | TEXT |
| created_at | 作成日時 | |
| updated_at | 更新日時 | |

### temple_notable_person（寺院-著名人関連）- フェーズ2以降
| カラム | 説明 | 制約 |
| --- | --- | --- |
| id | ID | PK, SERIAL |
| temple_id | 寺院ID | FK -> temple.id |
| person_id | 著名人ID | FK -> notable_person.id |
| relation_type | 関係性 | 'founder'(開山), 'patron'(檀越), 'resided'(住職), 'buried'(墓所) |
| note | 補足 | TEXT |
| UNIQUE(temple_id, person_id, relation_type) | 重複防止 | |

※著名人関連のテーブルはMVP後に追加を検討

---

### フェーズ2のテーブル（認証機能実装時）
以下のテーブルはユーザー認証機能と合わせて実装。

### app_user
| カラム | 説明 | 制約 |
| --- | --- | --- |
| id | ID | PK |
| email | メールアドレス | UNIQUE |
| display_name | 表示名 |  |
| created_at | 作成日時 |  |

### temple_visit
| カラム | 説明 | 制約 |
| --- | --- | --- |
| user_id | ユーザーID | PK, FK -> app_user.id |
| temple_id | 寺院ID | PK, FK -> temple.id |
| visited_at | 訪問日 |  |
| note | メモ |  |
| created_at | 記録日時 |  |

### temple_wishlist
| カラム | 説明 | 制約 |
| --- | --- | --- |
| user_id | ユーザーID | PK, FK -> app_user.id |
| temple_id | 寺院ID | PK, FK -> temple.id |
| added_at | 追加日 |  |

---

### 将来のテーブル（イベント機能実装時）

### temple_event
| カラム | 説明 | 制約 |
| --- | --- | --- |
| id | ID | PK |
| temple_id | 寺院ID | FK -> temple.id |
| title | タイトル |  |
| start_date | 開始日 |  |
| end_date | 終了日 |  |
| source_url | 一次情報URL |  |
| created_at | 作成日時 |  |
| updated_at | 更新日時 |  |
