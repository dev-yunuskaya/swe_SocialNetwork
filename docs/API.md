# Social Network API

Base URL: `http://localhost:3000`

Kimlik doğrulama: `Authorization: Bearer <JWT>` (korumalı endpoint’ler)

---

## Auth

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/api/register` | — | Kayıt (`username`, `email`, `password`, `interests[]`) |
| POST | `/api/login` | — | Giriş → `{ token, user }` |
| POST | `/api/logout` | — | Çıkış onayı |

---

## Profil

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/api/me` | ✓ | Oturum açık kullanıcı |
| GET | `/api/users/:id` veya `:username` | opsiyonel | Profil (`is_following`, `is_self`) |
| PUT | `/api/profile` | ✓ | `display_name`, `bio`, `interests[]` |

---

## Takip

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/api/users/:id/follow` | ✓ | Takip et |
| DELETE | `/api/users/:id/follow` | ✓ | Takipten çık |

---

## Gönderiler

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/api/posts` | ✓ | Oluştur (`multipart`: `content`, `image?`) |
| GET | `/api/posts/:id` | opsiyonel | Detay + yorumlar |
| DELETE | `/api/posts/:id` | ✓ | Sil (sadece yazar) |
| GET | `/api/users/:userId/posts` | — | Kullanıcı gönderileri |
| POST | `/api/posts/:id/like` | ✓ | Beğen |
| DELETE | `/api/posts/:id/like` | ✓ | Beğeniyi kaldır |
| POST | `/api/posts/:id/comments` | ✓ | Yorum (`content`) |
| DELETE | `/api/comments/:id` | ✓ | Yorum sil |

---

## Feed & Öneri

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/api/feed?cursor=` | ✓ | Takip feed (max 20) |
| GET | `/api/recommendations` | ✓ | Top 10 öneri |

---

## Mesajlar

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/api/messages` | ✓ | Konuşma listesi |
| POST | `/api/messages` | ✓ | Gönder (`recipient_id`, `content`) |
| GET | `/api/messages/:partner_id` | ✓ | Konuşma geçmişi |

---

## Bildirimler

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/api/notifications` | ✓ | Liste |
| PATCH | `/api/notifications/:id/read` | ✓ | Tek okundu (`id` veya `all`) |

---

## Hata kodları

| Kod | Anlam |
|-----|--------|
| 400 | Geçersiz girdi |
| 401 | Kimlik doğrulama hatası |
| 403 | Yetkisiz işlem |
| 404 | Kayıt bulunamadı |
| 409 | Çakışma (duplicate) |
| 500 | Sunucu hatası |

---

## Sağlık kontrolü

`GET /health` → `{ "status": "ok" }`
