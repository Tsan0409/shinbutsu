# Customer CRUD API

デモ用のCustomer管理CRUD APIです。

## セットアップ

### 1. PostgreSQLの起動

```bash
cd postgres
docker-compose up -d
```

### 2. アプリケーションの起動

```bash
./gradlew bootRun
```

## API エンドポイント

ベースURL: `http://localhost:8080/api/customers`

### 1. 全顧客取得 (GET)

```bash
curl -X GET http://localhost:8080/api/customers
```

### 2. 顧客詳細取得 (GET)

```bash
curl -X GET http://localhost:8080/api/customers/001
```

### 3. 顧客作成 (POST)

```bash
curl -X POST http://localhost:8080/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "011",
    "username": "user011",
    "email": "test.user.011@example.com",
    "phoneNumber": "09012345678",
    "postCode": "1234567"
  }'
```

### 4. 顧客更新 (PUT)

```bash
curl -X PUT http://localhost:8080/api/customers/011 \
  -H "Content-Type: application/json" \
  -d '{
    "username": "updated_user011",
    "email": "updated.user.011@example.com",
    "phoneNumber": "09087654321",
    "postCode": "7654321"
  }'
```

### 5. 顧客削除 (DELETE)

```bash
curl -X DELETE http://localhost:8080/api/customers/011
```

## バリデーション

- **id**: 必須、10文字以内
- **username**: 必須、50文字以内
- **email**: 必須、メールアドレス形式、50文字以内
- **phoneNumber**: 必須、10桁または11桁の数字
- **postCode**: 必須、7桁の数字

## エラーレスポンス例

### バリデーションエラー

```json
{
  "status": 400,
  "error": "Validation Failed",
  "errors": {
    "email": "正しいメールアドレスを入力してください",
    "phoneNumber": "電話番号は11桁の数字で入力してください"
  }
}
```

### 顧客が見つからない

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Customer not found: 999"
}
```

### 顧客が既に存在する

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Customer already exists: 001"
}
```

## 技術スタック

- Spring Boot 4.0.1
- Java 21
- MyBatis 4.0.1
- PostgreSQL 18
- Docker Compose
