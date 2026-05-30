# Mimari ve Nasıl Çalışır?

Bu doküman, projeyi **anlamak** için kodun nasıl organize edildiğini ve önemli akışları açıklar.

## Genel yapı

```
Tarayıcı (public/*.html + js)
        │  fetch + JWT (localStorage)
        ▼
Express (src/app.js)
        ├── /api/*     → routes → services → Prisma → PostgreSQL
        └── /uploads, /css, /js  → statik dosyalar
```

| Katman | Klasör | Görev |
|--------|--------|--------|
| **Routes** | `src/routes/` | HTTP endpoint tanımı, `authenticate` middleware |
| **Services** | `src/services/` | İş kuralları, bildirim, skorlama |
| **Middleware** | `src/middleware/` | JWT doğrulama, dosya yükleme, hata |
| **Utils** | `src/utils/` | Hashtag, sayfalama, gönderi zenginleştirme |
| **Prisma** | `prisma/schema.prisma` | Tablolar ve ilişkiler |
| **Frontend** | `public/` | Sayfalar; `public/js/api.js` token yönetimi |

## Veritabanı (özet)

| Model | Anlam |
|-------|--------|
| `User` | Hesap |
| `Interest` / `UserInterest` | İlgi alanları (Technology, Sports, …) |
| `Post` | Gönderi; `image_path` opsiyonel |
| `Hashtag` / `PostHashtag` | Gönderi–etiket ilişkisi |
| `Follow` | Takipçi → takip edilen |
| `Like`, `Comment` | Etkileşim; yorumda `parent_id` = yanıt |
| `Message` | İki kullanıcı arası mesaj |
| `Notification` | `post_liked`, `post_commented`, `comment_replied`, `new_follower` |

## Kimlik doğrulama

1. **Kayıt** (`POST /api/register`): şifre bcrypt ile hash’lenir; ilgi alanları `UserInterest` olarak kaydedilir.
2. **Giriş** (`POST /api/login`): JWT üretilir (`JWT_SECRET`, süre `JWT_EXPIRES_IN`).
3. **Korunan istekler**: `Authorization: Bearer <token>`; `src/middleware/auth.js` token’ı çözer, `req.user` set eder.
4. **Frontend**: `public/js/api.js` token’ı `localStorage`’da tutar; 401’de login’e yönlendirir.

## Gönderi ve hashtag

1. Kullanıcı metin yazar (`#technology` gibi).
2. `src/utils/hashtags.js` → `extractHashtags`: saf rakam etiketleri (`#3`) yok sayılır.
3. `post.service.js` hashtag’leri upsert eder, gönderiyle ilişkilendirir.
4. Resim varsa `multer` → `uploads/` (demo görselleri `uploads/demo/`).

## Takip akışı

- `GET /api/feed`: kullanıcının **takip ettiği** kişilerin gönderileri.
- Sıralama: `created_at` azalan (en yeni üstte).
- Sayfalama: `page`, `limit` query parametreleri.

## Öneri motoru (kural tabanlı)

Dosya: `src/services/recommendation.service.js`

### Adaylar

- Kendi gönderileri ve **takip edilenlerin** gönderileri hariç.
- `GET /api/recommendations` veya `POST /api/recommendations/refresh` (`exclude` ile daha önce görülenler elenebilir).

### Sinyaller (`collectSignals`)

| Sinyal | Kaynak |
|--------|--------|
| `interestTags` | Profildeki ilgi alanları |
| `interactionTags` | Beğenilen / yorumlanan gönderilerin hashtag’leri |
| `interactionAuthorIds` | Etkileşim yapılan yazarlar |

### Skor (`scorePost`)

- Profil ilgi alanı eşleşmesi: yüksek ağırlık  
- Etkileşim hashtag’i: daha da yüksek  
- Takip edilen olmayan ama etkileşim yapılan yazar: orta  
- Profil dışı içerik: düşük “keşif” puanı  

### Seçim (`selectWithProfileRatio`)

- Yaklaşık **%80** kullanıcının ilgi alanlarına uyan gönderiler  
- Yaklaşık **%20** diğer konulardan keşif  
- Kategoriler **round-robin** ile karıştırılır (ardışık aynı etiket azaltılır)

### İlgi alanı öğrenme

Dosya: `src/services/interestLearning.service.js`

- Beğeni veya yorum sonrası gönderinin bilinen kategori hashtag’i (ör. `#travel`) → `UserInterest`’e eklenir (en fazla 8 alan).
- Sonraki öneriler bu yeni alana göre yoğunlaşır.

## Bildirimler

| Olay | Tip |
|------|-----|
| Takip | `new_follower` |
| Beğeni | `post_liked` |
| Üst seviye yorum | `post_commented` |
| Yoruma yanıt | `comment_replied` |

`GET /api/notifications` listeler; frontend `notifications.html`.

## Mesajlaşma

- REST: gönder (`POST`), liste (`GET` konuşma partnerine göre).
- WebSocket yok; sayfa yenileme veya periyodik istek ile güncellenir.

## Frontend sayfaları

| Sayfa | Dosya | API |
|-------|-------|-----|
| Giriş / kayıt | `login.html`, `register.html` | `/api/login`, `/api/register` |
| Ana sayfa | `feed.html` | `/api/feed`, `/api/recommendations`, gönderi CRUD |
| Gönderi detay | `post.html` | yorum, yanıt |
| Profil | `profile.html` | profil, takip |
| Mesajlar | `messages.html` | mesaj API |
| Bildirimler | `notifications.html` | bildirim API |

`feed.html`: **Takip Ettikleriniz** ve **Önerilenler** sekmeleri; önerilerde `seen.js` ile görülen gönderi id’leri `localStorage`’da tutulur.

## Demo seed

| Dosya | Rol |
|-------|-----|
| `scripts/demo-content.js` | Kullanıcılar, 200 gönderi tanımı |
| `scripts/demo-posts.js` | Kategori başına metin havuzu |
| `scripts/demo-images.js` | Görsel indirme / cache |
| `scripts/seed-demo.js` | `--reset` ile DB’ye yazma |

## Testler

- `tests/` — Jest + Supertest.
- Her test öncesi tablolar temizlenir (`helpers.resetDatabase`).
- `tests/globalSetup.js` test DB oluşturur ve migration uygular.

Çalıştırma: `npm test` (62 test — ayrıntı: [TESTLER.md](TESTLER.md))

## API referansı

Endpoint listesi: [API.md](API.md)  
Postman: [postman_collection.json](postman_collection.json)

## Okuma sırası (koda giriş)

1. `src/app.js` — route montajı  
2. `prisma/schema.prisma` — veri modeli  
3. `src/routes/auth.routes.js` + `auth.service.js`  
4. `src/services/post.service.js` + `recommendation.service.js`  
5. `public/feed.html` + `public/js/posts.js`  
