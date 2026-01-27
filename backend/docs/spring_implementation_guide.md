# Spring実装ガイド

本プロジェクトでは、以下の実装方針に基づいてSpringアプリケーションを構築します。

## アーキテクチャ

**レイヤー構成:**
```
Controller → Service → Mapper(MyBatis) → Database
     ↓          ↓
    DTO      Entity
```

- **Controller層**: REST APIエンドポイントの定義、リクエスト/レスポンスのハンドリング
- **Service層**: ビジネスロジックの実装
- **Mapper層**: MyBatisを使用したデータアクセス層
- **Entity**: データベーステーブルに対応するドメインモデル
- **DTO**: API通信用のデータ転送オブジェクト (Request/Response)

---

## DTO (Data Transfer Object) の設計

### DTOとは？

DTOは、API通信においてクライアントとサーバー間でデータをやり取りするための専用オブジェクトです。Entityとは明確に分離して設計します。

### なぜEntityとDTOを分けるのか？

#### 1. **セキュリティ**
```java
// ❌ BAD: Entityを直接公開すると内部情報が漏洩
@Entity
public class User {
    private UUID id;
    private String username;
    private String passwordHash;  // 🚨 外部に公開すべきでない
    private String email;
    private LocalDateTime createdAt;
}

// ✅ GOOD: DTOで公開する情報を制御
public class UserResponse {
    private UUID id;
    private String username;
    private String email;
    // passwordHashは含まない
}
```

#### 2. **API の安定性**
- Entityのスキーマ変更がAPIに直接影響しない
- データベース構造の変更とAPI仕様の変更を独立させられる

#### 3. **柔軟性**
- 複数のテーブルを結合したレスポンスを作成可能
- 必要な情報だけを選択的に返せる

### DTO の種類

#### Request DTO
クライアントからサーバーへのデータ送信用。バリデーションルールを含む。

```java
package com.tksan.shinbutsu.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.UUID;

@Data
public class TempleRequest {
    // 名称 (必須、100文字以内)
    @NotBlank(message = "名称は必須です")
    @Size(max = 100, message = "名称は100文字以内で入力してください")
    private String name;
    
    // よみがな (オプション、200文字以内)
    @Size(max = 200, message = "よみがなは200文字以内で入力してください")
    private String kana;
    
    // 宗派ID (必須)
    @NotNull(message = "宗派は必須です")
    private UUID sectId;
    
    // 創建時代ID (オプション)
    private UUID foundingEraId;
    
    // 郵便番号 (オプション、形式チェック)
    @Pattern(regexp = "^[0-9]{3}-[0-9]{4}$", 
             message = "郵便番号は000-0000形式で入力してください")
    private String postCode;
    
    // 都道府県 (必須、2文字以内)
    @NotBlank(message = "都道府県は必須です")
    @Size(max = 2, message = "都道府県は2文字以内で入力してください")
    private String prefecture;
    
    // 住所 (オプション、200文字以内)
    @Size(max = 200, message = "住所は200文字以内で入力してください")
    private String address;
    
    // 緯度 (-90.0 ~ 90.0)
    @DecimalMin(value = "-90.0", message = "緯度は-90.0以上である必要があります")
    @DecimalMax(value = "90.0", message = "緯度は90.0以下である必要があります")
    private Double latitude;
    
    // 経度 (-180.0 ~ 180.0)
    @DecimalMin(value = "-180.0", message = "経度は-180.0以上である必要があります")
    @DecimalMax(value = "180.0", message = "経度は180.0以下である必要があります")
    private Double longitude;
    
    // 説明 (オプション)
    private String description;
    
    // 公式サイトURL (オプション、URL形式チェック)
    @Pattern(regexp = "^https?://.*", 
             message = "URLはhttp://またはhttps://で始まる必要があります")
    private String officialUrl;
}
```

**ポイント:**
- `@NotNull`, `@NotBlank`: 必須チェック
- `@Size`: 文字数制限
- `@Pattern`: 正規表現チェック
- `@DecimalMin`, `@DecimalMax`: 数値範囲チェック
- Lombokの `@Data` でgetterやsetterを自動生成

#### Response DTO
サーバーからクライアントへのデータ返却用。関連データを含むことが多い。

```java
package com.tksan.shinbutsu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TempleResponse {
    // 基本情報
    private UUID id;
    private String name;
    private String kana;
    
    // 関連情報 (JOIN結果を含む)
    private SectInfo sect;          // 宗派情報
    private EraInfo foundingEra;    // 創建時代情報
    
    // 所在地情報
    private String postCode;
    private String prefecture;
    private String address;
    private Double latitude;
    private Double longitude;
    
    // 詳細情報
    private String description;
    private String officialUrl;
    
    // メタ情報
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // ネストされたDTO
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectInfo {
        private UUID id;
        private String name;
        private String periodName;  // 時代名も含む
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EraInfo {
        private UUID id;
        private String name;
        private String kana;
        private Integer startYear;
        private Integer endYear;
    }
}
```

**ポイント:**
- `@Builder`: ビルダーパターンでオブジェクト生成を簡潔に
- ネストされたDTO (`SectInfo`, `EraInfo`): 関連情報を構造化
- JOINクエリの結果を分かりやすく表現

### DTO と Entity の変換

ServiceとControllerの間でDTOとEntityを変換します。

#### パターン1: マッピングメソッド
```java
@Service
@RequiredArgsConstructor
public class TempleService {
    private final TempleMapper templeMapper;
    private final SectMapper sectMapper;
    private final EraMapper eraMapper;
    
    public TempleResponse findById(UUID id) {
        Temple temple = templeMapper.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Temple not found: " + id));
        
        // EntityをResponseに変換
        return toResponse(temple);
    }
    
    public TempleResponse create(TempleRequest request) {
        // RequestをEntityに変換
        Temple temple = toEntity(request);
        temple.setId(UUID.randomUUID());
        
        templeMapper.insert(temple);
        return toResponse(temple);
    }
    
    // Request → Entity
    private Temple toEntity(TempleRequest request) {
        Temple temple = new Temple();
        temple.setName(request.getName());
        temple.setKana(request.getKana());
        temple.setSectId(request.getSectId());
        temple.setFoundingEraId(request.getFoundingEraId());
        temple.setPostCode(request.getPostCode());
        temple.setPrefecture(request.getPrefecture());
        temple.setAddress(request.getAddress());
        temple.setLatitude(request.getLatitude());
        temple.setLongitude(request.getLongitude());
        temple.setDescription(request.getDescription());
        temple.setOfficialUrl(request.getOfficialUrl());
        return temple;
    }
    
    // Entity → Response
    private TempleResponse toResponse(Temple temple) {
        // 関連情報を取得
        Sect sect = sectMapper.findById(temple.getSectId()).orElse(null);
        Era era = temple.getFoundingEraId() != null 
            ? eraMapper.findById(temple.getFoundingEraId()).orElse(null)
            : null;
        
        return TempleResponse.builder()
            .id(temple.getId())
            .name(temple.getName())
            .kana(temple.getKana())
            .sect(sect != null ? toSectInfo(sect) : null)
            .foundingEra(era != null ? toEraInfo(era) : null)
            .postCode(temple.getPostCode())
            .prefecture(temple.getPrefecture())
            .address(temple.getAddress())
            .latitude(temple.getLatitude())
            .longitude(temple.getLongitude())
            .description(temple.getDescription())
            .officialUrl(temple.getOfficialUrl())
            .createdAt(temple.getCreatedAt())
            .updatedAt(temple.getUpdatedAt())
            .build();
    }
    
    private TempleResponse.SectInfo toSectInfo(Sect sect) {
        return TempleResponse.SectInfo.builder()
            .id(sect.getId())
            .name(sect.getName())
            .build();
    }
    
    private TempleResponse.EraInfo toEraInfo(Era era) {
        return TempleResponse.EraInfo.builder()
            .id(era.getId())
            .name(era.getName())
            .kana(era.getKana())
            .startYear(era.getStartYear())
            .endYear(era.getEndYear())
            .build();
    }
}
```

#### パターン2: MapStruct (推奨・大規模プロジェクト向け)
```java
// build.gradle.kts に依存関係を追加
dependencies {
    implementation("org.mapstruct:mapstruct:1.5.5.Final")
    annotationProcessor("org.mapstruct:mapstruct-processor:1.5.5.Final")
}

// Mapper インターフェース
@Mapper(componentModel = "spring")
public interface TempleMapperConverter {
    Temple toEntity(TempleRequest request);
    TempleResponse toResponse(Temple temple);
    List<TempleResponse> toResponseList(List<Temple> temples);
}

// Service で使用
@Service
@RequiredArgsConstructor
public class TempleService {
    private final TempleMapper templeMapper;
    private final TempleMapperConverter converter;
    
    public TempleResponse create(TempleRequest request) {
        Temple temple = converter.toEntity(request);
        temple.setId(UUID.randomUUID());
        templeMapper.insert(temple);
        return converter.toResponse(temple);
    }
}
```

### 複雑なResponseの例

複数のテーブルを結合した詳細レスポンス:

```java
@Data
@Builder
public class TempleDetailResponse {
    // 基本情報
    private UUID id;
    private String name;
    private String kana;
    
    // 宗派情報 (sect + period)
    private SectDetail sect;
    
    // 創建時代情報
    private EraInfo foundingEra;
    
    // 所在地情報
    private LocationInfo location;
    
    // 記事一覧
    private List<ArticleInfo> articles;
    
    // 用語集リンク
    private List<GlossaryLinkInfo> glossaryLinks;
    
    @Data
    @Builder
    public static class SectDetail {
        private UUID id;
        private String name;
        private String periodName;  // 時代名
        private String description;
    }
    
    @Data
    @Builder
    public static class LocationInfo {
        private String postCode;
        private String prefecture;
        private String address;
        private Double latitude;
        private Double longitude;
    }
    
    @Data
    @Builder
    public static class ArticleInfo {
        private UUID id;
        private String title;
        private Integer displayOrder;
        private LocalDateTime createdAt;
    }
    
    @Data
    @Builder
    public static class GlossaryLinkInfo {
        private UUID termId;
        private String termName;
        private String shortDescription;
    }
}
```

このようなResponseを生成するMapperクエリ:

```java
@Mapper
public interface TempleMapper {
    @Select("""
        SELECT 
            t.id, t.name, t.kana,
            t.post_code, t.prefecture, t.address, t.latitude, t.longitude,
            t.description, t.official_url,
            t.created_at, t.updated_at,
            s.id as sect_id, s.name as sect_name, s.description as sect_description,
            p.name as period_name,
            e.id as era_id, e.name as era_name, e.kana as era_kana,
            e.start_year, e.end_year
        FROM temple t
        LEFT JOIN sect s ON t.sect_id = s.id
        LEFT JOIN period p ON s.period_id = p.id
        LEFT JOIN era e ON t.founding_era_id = e.id
        WHERE t.id = #{id}
        """)
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "articles", column = "id", 
                many = @Many(select = "findArticlesByTempleId"))
    })
    TempleDetailResponse findDetailById(UUID id);
    
    @Select("""
        SELECT id, title, display_order, created_at
        FROM temple_article
        WHERE temple_id = #{templeId}
        ORDER BY display_order
        """)
    List<TempleDetailResponse.ArticleInfo> findArticlesByTempleId(UUID templeId);
}
```

---

## データアクセス: MyBatis

### なぜMyBatisか？

- **複雑なJOINクエリの柔軟な記述が可能**
- **SQLの可視性が高く、パフォーマンスチューニングが容易**
- **動的SQLによる条件分岐が直感的**

### 設定

`application.yaml`:
```yaml
mybatis:
  configuration:
    map-underscore-to-camel-case: true  # snake_case ↔ camelCase 自動変換
```

### 基本的なMapper例

```java
@Mapper
public interface TempleMapper {
    // 単純な検索
    @Select("SELECT * FROM temple WHERE id = #{id}")
    Optional<Temple> findById(UUID id);
    
    // 複雑なJOIN
    @Select("""
        SELECT t.*, s.name as sect_name, e.name as era_name
        FROM temple t
        LEFT JOIN sect s ON t.sect_id = s.id
        LEFT JOIN era e ON t.founding_era_id = e.id
        WHERE t.prefecture = #{prefecture}
        ORDER BY t.name
        """)
    List<Temple> findByPrefecture(String prefecture);
    
    // 挿入
    @Insert("""
        INSERT INTO temple (
            id, name, kana, sect_id, founding_era_id,
            post_code, prefecture, address, latitude, longitude,
            description, official_url, created_at, updated_at
        ) VALUES (
            #{id}, #{name}, #{kana}, #{sectId}, #{foundingEraId},
            #{postCode}, #{prefecture}, #{address}, #{latitude}, #{longitude},
            #{description}, #{officialUrl}, #{createdAt}, #{updatedAt}
        )
        """)
    void insert(Temple temple);
    
    // 更新
    @Update("""
        UPDATE temple SET
            name = #{name},
            kana = #{kana},
            sect_id = #{sectId},
            founding_era_id = #{foundingEraId},
            post_code = #{postCode},
            prefecture = #{prefecture},
            address = #{address},
            latitude = #{latitude},
            longitude = #{longitude},
            description = #{description},
            official_url = #{officialUrl},
            updated_at = #{updatedAt}
        WHERE id = #{id}
        """)
    void update(Temple temple);
    
    // 削除
    @Delete("DELETE FROM temple WHERE id = #{id}")
    void deleteById(UUID id);
    
    // 件数取得
    @Select("SELECT COUNT(*) FROM temple WHERE prefecture = #{prefecture}")
    int countByPrefecture(String prefecture);
}
```

### 動的SQL

検索条件が動的に変わる場合:

```java
@Mapper
public interface TempleMapper {
    @SelectProvider(type = TempleSqlProvider.class, method = "search")
    List<Temple> search(TempleSearchCondition condition);
}

class TempleSqlProvider {
    public String search(TempleSearchCondition condition) {
        return new SQL()
            .SELECT("t.*", "s.name as sect_name", "e.name as era_name")
            .FROM("temple t")
            .LEFT_OUTER_JOIN("sect s ON t.sect_id = s.id")
            .LEFT_OUTER_JOIN("era e ON t.founding_era_id = e.id")
            .WHERE(buildWhereClause(condition))
            .ORDER_BY("t.name")
            .toString();
    }
    
    private String buildWhereClause(TempleSearchCondition condition) {
        StringBuilder where = new StringBuilder("1=1");
        
        if (condition.getPrefecture() != null) {
            where.append(" AND t.prefecture = #{prefecture}");
        }
        if (condition.getSectId() != null) {
            where.append(" AND t.sect_id = #{sectId}");
        }
        if (condition.getKeyword() != null) {
            where.append(" AND (t.name LIKE CONCAT('%', #{keyword}, '%')");
            where.append(" OR t.kana LIKE CONCAT('%', #{keyword}, '%'))");
        }
        
        return where.toString();
    }
}
```

---

## バリデーション

### ハイブリッドアプローチ

- **データベース層**: 論理的整合性の保証 (外部キー制約、NOT NULL制約など)
- **アプリケーション層**: ビジネスルールの検証 (Bean Validation)

### Bean Validation アノテーション

| アノテーション | 用途 | 例 |
|--------------|------|-----|
| `@NotNull` | null不可 | `@NotNull UUID sectId` |
| `@NotBlank` | 空文字・null不可 | `@NotBlank String name` |
| `@Size` | 文字数・要素数制限 | `@Size(max = 100) String name` |
| `@Min`, `@Max` | 数値範囲 | `@Min(0) @Max(999) Integer year` |
| `@DecimalMin`, `@DecimalMax` | 小数点範囲 | `@DecimalMin("-90.0") Double lat` |
| `@Pattern` | 正規表現 | `@Pattern(regexp = "^[0-9]{3}-[0-9]{4}$")` |
| `@Email` | メール形式 | `@Email String email` |
| `@Valid` | ネストオブジェクト検証 | `@Valid AddressInfo address` |

### Controllerでのバリデーション

```java
@RestController
@RequestMapping("/api/temples")
@RequiredArgsConstructor
public class TempleController {
    private final TempleService templeService;
    
    @PostMapping
    public ResponseEntity<TempleResponse> create(
            @Valid @RequestBody TempleRequest request) {  // @Valid で自動検証
        TempleResponse response = templeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TempleResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody TempleRequest request) {
        TempleResponse response = templeService.update(id, request);
        return ResponseEntity.ok(response);
    }
}
```

---

## タイムスタンプ管理

### Spring Data JPA Auditingを使用

```java
// BaseEntity.java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // getters and setters
}

// Temple.java
@Entity
@Table(name = "temple")
public class Temple extends BaseEntity {
    @Id
    private UUID id;
    
    private String name;
    // ... その他のフィールド
}

// ShinbutsuApplication.java
@SpringBootApplication
@EnableJpaAuditing  // ← これを追加
public class ShinbutsuApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShinbutsuApplication.class, args);
    }
}
```

**メリット:**
- データベーストリガー不要 (アプリケーション層で完結)
- テストが容易
- 明示的で保守性が高い

---

## 例外ハンドリング

### GlobalExceptionHandler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    // バリデーションエラー
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        
        ErrorResponse response = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .error("Validation Failed")
            .errors(errors)
            .timestamp(LocalDateTime.now())
            .build();
            
        return ResponseEntity.badRequest().body(response);
    }
    
    // リソースが見つからない
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex) {
        ErrorResponse response = ErrorResponse.builder()
            .status(HttpStatus.NOT_FOUND.value())
            .error("Not Found")
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();
            
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
    
    // その他の例外
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        
        ErrorResponse response = ErrorResponse.builder()
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .error("Internal Server Error")
            .message("予期しないエラーが発生しました")
            .timestamp(LocalDateTime.now())
            .build();
            
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}

// ErrorResponse.java
@Data
@Builder
public class ErrorResponse {
    private int status;
    private String error;
    private String message;
    private Map<String, String> errors;  // バリデーションエラー詳細
    private LocalDateTime timestamp;
}
```

---

## 推奨ディレクトリ構造

```
src/main/java/com/tksan/shinbutsu/
├── ShinbutsuApplication.java
├── controller/
│   ├── TempleController.java
│   ├── SectController.java
│   └── GlossaryController.java
├── service/
│   ├── TempleService.java
│   ├── SectService.java
│   └── GlossaryService.java
├── mapper/
│   ├── TempleMapper.java
│   ├── SectMapper.java
│   └── GlossaryMapper.java
├── entity/
│   ├── BaseEntity.java          ← タイムスタンプ管理の基底クラス
│   ├── Temple.java
│   ├── Sect.java
│   ├── Period.java
│   ├── Era.java
│   ├── TempleArticle.java
│   ├── GlossaryTerm.java
│   └── ArticleTerm.java
├── dto/
│   ├── request/
│   │   ├── TempleRequest.java
│   │   ├── SectRequest.java
│   │   ├── ArticleRequest.java
│   │   └── GlossaryTermRequest.java
│   └── response/
│       ├── TempleResponse.java
│       ├── TempleDetailResponse.java
│       ├── SectResponse.java
│       ├── ArticleResponse.java
│       └── GlossaryTermResponse.java
└── exception/
    ├── GlobalExceptionHandler.java
    ├── ResourceNotFoundException.java
    ├── DuplicateResourceException.java
    └── ErrorResponse.java
```

---

## テスト戦略

### 単体テスト (JUnit 5 + Mockito)

```java
@ExtendWith(MockitoExtension.class)
class TempleServiceTest {
    @Mock
    private TempleMapper templeMapper;
    
    @Mock
    private SectMapper sectMapper;
    
    @InjectMocks
    private TempleService templeService;
    
    @Test
    void findById_存在する場合_Responseを返す() {
        // Given
        UUID id = UUID.randomUUID();
        Temple temple = createTestTemple(id);
        when(templeMapper.findById(id)).thenReturn(Optional.of(temple));
        
        // When
        TempleResponse response = templeService.findById(id);
        
        // Then
        assertNotNull(response);
        assertEquals(id, response.getId());
        assertEquals("清水寺", response.getName());
    }
    
    @Test
    void findById_存在しない場合_例外をスロー() {
        // Given
        UUID id = UUID.randomUUID();
        when(templeMapper.findById(id)).thenReturn(Optional.empty());
        
        // When & Then
        assertThrows(ResourceNotFoundException.class, 
            () -> templeService.findById(id));
    }
}
```

### 統合テスト (TestContainers)

```java
@SpringBootTest
@Testcontainers
class TempleControllerIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("test_db")
        .withUsername("test")
        .withPassword("test");
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void createTemple_正常系() throws Exception {
        String requestJson = """
            {
                "name": "金閣寺",
                "kana": "きんかくじ",
                "sectId": "...",
                "prefecture": "京都府"
            }
            """;
        
        mockMvc.perform(post("/api/temples")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("金閣寺"));
    }
}
```

### MyBatisテスト

```java
@MybatisTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class TempleMapperTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");
    
    @Autowired
    private TempleMapper templeMapper;
    
    @Test
    void findById_データが存在する() {
        UUID id = UUID.fromString("...");
        Optional<Temple> result = templeMapper.findById(id);
        
        assertTrue(result.isPresent());
        assertEquals("清水寺", result.get().getName());
    }
}
```

---

## 技術スタック

- **Spring Boot**: 4.0.1
- **Java**: 21
- **MyBatis**: 4.0.1
- **PostgreSQL**: 16
- **Bean Validation**: Hibernate Validator
- **Lombok**: ボイラープレートコード削減
- **MapStruct** (オプション): DTO/Entity変換の自動化
- **TestContainers**: 統合テスト用のDocker環境

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0 | 2026-01-27 | 初版作成 |
