# Frontend - Customer Management Demo

Next.js/Reactで作成されたCustomer管理デモアプリケーションです。

## 機能

- 顧客一覧表示
- 顧客作成
- 顧客編集
- 顧客削除
- リアルタイムAPIデータ表示

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルが自動的に作成されています。必要に応じて編集してください。

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

### 3. バックエンドの起動

フロントエンドを起動する前に、バックエンドAPIが起動していることを確認してください。

```bash
cd ../backend
cd postgres
docker-compose up -d
cd ..
./gradlew bootRun
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **UIライブラリ**: React 19
- **スタイリング**: Tailwind CSS
- **HTTPクライアント**: Axios
- **言語**: TypeScript

## プロジェクト構造

```
frontend/
├── app/
│   ├── page.tsx          # メインページ（顧客管理UI）
│   ├── layout.tsx        # レイアウト
│   └── globals.css       # グローバルスタイル
├── lib/
│   └── api.ts            # APIクライアント
├── .env.local            # 環境変数
└── package.json          # 依存関係
```

## APIエンドポイント

フロントエンドは以下のバックエンドAPIエンドポイントを使用します：

- `GET /api/customers` - 全顧客取得
- `GET /api/customers/{id}` - 顧客詳細取得
- `POST /api/customers` - 顧客作成
- `PUT /api/customers/{id}` - 顧客更新
- `DELETE /api/customers/{id}` - 顧客削除

## 使い方

1. **顧客一覧の表示**
   - ページを開くと自動的に顧客一覧が表示されます

2. **新規顧客の作成**
   - 「新規作成」ボタンをクリック
   - フォームに必要事項を入力
   - 「作成」ボタンをクリック

3. **顧客の編集**
   - 顧客一覧から「編集」ボタンをクリック
   - フォームで内容を変更
   - 「更新」ボタンをクリック

4. **顧客の削除**
   - 顧客一覧から「削除」ボタンをクリック
   - 確認ダイアログで確認

## トラブルシューティング

### データが表示されない場合

1. バックエンドが起動しているか確認
   ```bash
   curl http://localhost:8080/api/customers
   ```

2. PostgreSQLが起動しているか確認
   ```bash
   cd ../backend/postgres
   docker-compose ps
   ```

3. CORS設定が正しいか確認
   - バックエンドの`WebConfig.java`でCORSが許可されているか確認

### ポートが使用中の場合

別のポートで起動するには：

```bash
PORT=3001 npm run dev
```

## ビルド

本番環境用にビルドするには：

```bash
npm run build
npm start
```

## 開発

- コードを編集すると自動的にホットリロードされます
- Tailwind CSSのユーティリティクラスを使用してスタイリングできます
- TypeScriptの型チェックが有効になっています

