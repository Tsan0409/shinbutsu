# shinbutsu

Customer管理システム - フルスタックデモアプリケーション

## 概要

このプロジェクトは、Spring Boot（バックエンド）とNext.js/React（フロントエンド）を使用したCustomer管理システムのデモアプリケーションです。

### 技術スタック

**バックエンド:**
- Spring Boot 4.0
- MyBatis
- PostgreSQL
- Java 21

**フロントエンド:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Axios

## プロジェクト構造

```
shinbutsu/
├── backend/          # Spring Boot APIサーバー
│   ├── src/
│   ├── postgres/     # PostgreSQL Docker設定
│   └── README_API.md
└── frontend/         # Next.js Reactアプリケーション
    ├── app/
    ├── lib/
    └── README.md
```

## クイックスタート

### 前提条件

- Java 21
- Node.js 18以上
- Docker & Docker Compose

### 1. データベースの起動

```bash
cd backend/postgres
docker-compose up -d
```

### 2. バックエンドの起動

新しいターミナルで：

```bash
cd backend
./gradlew bootRun
```

バックエンドAPIは `http://localhost:8080` で起動します。

### 3. フロントエンドの起動

さらに新しいターミナルで：

```bash
cd frontend
npm install  # 初回のみ
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

### 4. デモの確認

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

以下の機能を試すことができます：
- ✅ 顧客一覧の表示
- ✅ 新規顧客の作成
- ✅ 顧客情報の編集
- ✅ 顧客の削除

## API仕様

### エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/customers` | 全顧客取得 |
| GET | `/api/customers/{id}` | 顧客詳細取得 |
| POST | `/api/customers` | 顧客作成 |
| PUT | `/api/customers/{id}` | 顧客更新 |
| DELETE | `/api/customers/{id}` | 顧客削除 |

### データ形式

```json
{
  "id": "001",
  "username": "user001",
  "email": "test.user.001@example.com",
  "phoneNumber": "12345678901",
  "postCode": "1234567"
}
```

### バリデーション

- **id**: 必須、10文字以内
- **username**: 必須、50文字以内
- **email**: 必須、メールアドレス形式、50文字以内
- **phoneNumber**: 必須、10桁または11桁の数字
- **postCode**: 必須、7桁の数字

## 開発

### バックエンドのテスト

```bash
cd backend
./gradlew test
```

### バックエンドのビルド

```bash
cd backend
./gradlew build
```

### フロントエンドのビルド

```bash
cd frontend
npm run build
```

## トラブルシューティング

### データベース接続エラー

PostgreSQLが起動しているか確認：

```bash
cd backend/postgres
docker-compose ps
```

### ポート競合

- バックエンド: デフォルトポート 8080
- フロントエンド: デフォルトポート 3000
- PostgreSQL: デフォルトポート 5431

ポートが使用中の場合は、各設定ファイルでポートを変更できます。

### CORS エラー

`backend/src/main/java/com/tksan/shinbutsu/config/WebConfig.java` でCORS設定が正しく構成されているか確認してください。

## 停止方法

### フロントエンド/バックエンドの停止

各ターミナルで `Ctrl + C` を押します。

### PostgreSQLの停止

```bash
cd backend/postgres
docker-compose down
```

## ライセンス

このプロジェクトはデモ目的で作成されています。

## 詳細ドキュメント

- [バックエンドAPI詳細](backend/README_API.md)
- [フロントエンド詳細](frontend/README.md)
