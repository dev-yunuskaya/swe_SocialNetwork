# Testler

Projede **62 otomatik test** bulunur. Hepsi **Jest** ile çalışır; API testleri **Supertest** ile gerçek HTTP isteği atar (mock yok).

## Nasıl çalıştırılır?

```bash
docker compose up -d    # PostgreSQL ayakta olmalı
npm test
```

Beklenen çıktı: `62 passed`, `10` test dosyası (suite).

Geliştirme sırasında:

```bash
npm run test:watch
```

## Test altyapısı

| Bileşen | Dosya | Görev |
|---------|--------|--------|
| Global kurulum | `tests/globalSetup.js` | `social_network_test` DB oluşturur, migration uygular |
| Ortam | `tests/setup.js` | `NODE_ENV=test`, ayrı `DATABASE_URL`, test JWT secret |
| Yardımcılar | `tests/helpers.js` | `resetDatabase()`, `registerUser()`, `loginUser()`, `authHeader()` |

Her entegrasyon testi öncesi `beforeEach` içinde veritabanı temizlenir; testler birbirinden bağımsızdır.

**Önemli:** Testler **üretim veritabanını kullanmaz** — `social_network_test` ayrı şemadır.

---

## Test türleri

### 1. Birim testleri (unit)

İş mantığı doğrudan fonksiyon çağrısıyla test edilir; HTTP yok.

| Dosya | Ne test edilir? |
|--------|------------------|
| `utils.test.js` | Hashtag çıkarma: küçük harf, tekrarları silme, boş metin, `#3` gibi saf rakamları yok sayma |
| `recommendations.test.js` → `scorePost` | Öneri skoru: ilgi alanı, beğeni/yorum sinyali, yazar, keşif puanı |
| `recommendations.test.js` → `selectWithProfileRatio` | 10 öneride ~%80 ilgi alanı / ~%20 keşif oranı |
| `recommendations.test.js` → `mixByCategory` | Farklı hashtag’lerin round-robin ile karışması |

### 2. Entegrasyon testleri (API)

Express uygulaması ayağa kalkar; `supertest` ile endpoint’lere istek gider, HTTP status ve JSON gövdesi doğrulanır.

---

## Modül bazında test listesi

RSD maddeleri parantez içinde referans olarak verilmiştir.

### Kimlik doğrulama — `auth.test.js` (8 test) — FR 3.2.1, 3.2.2

- Kayıt başarılı → HTTP 201
- İlgi alanı yok → HTTP 400
- Aynı e-posta/kullanıcı adı → HTTP 409
- Şifrenin veritabanında hash’li saklanması (bcrypt)
- Giriş → JWT döner
- Yanlış şifre → HTTP 401
- Çıkış → HTTP 200
- Geçersiz JWT ile korumalı endpoint → HTTP 401

### Profil — `profile.test.js` (5 test) — FR 3.2.3

- Kullanıcı profili GET (id)
- Kendi profilini PUT ile güncelleme
- Username ile profil GET
- Olmayan kullanıcı → HTTP 404
- JWT olmadan profil güncelleme → HTTP 401

### Takip — `follow.test.js` (6 test) — FR 3.2.4

- Takip başarılı
- Kendini takip → HTTP 400
- Olmayan kullanıcı → HTTP 404
- Tekrar takip (idempotent) → HTTP 200
- Takipten çıkma
- Takip sonrası `new_follower` bildirimi

### Gönderi — `posts.test.js` (13 test) — FR 3.2.5, 3.2.6

**Gönderi CRUD**

- Metin gönderisi + hashtag çıkarımı (`#technology`, `#science`)
- Boş içerik → HTTP 400
- 500+ karakter → HTTP 400
- Yazar kendi gönderisini siler
- Başkasının gönderisi → HTTP 403
- Geçersiz resim tipi (.txt) → HTTP 400

**Beğeni ve yorum**

- Beğeni oluşturma
- Çift beğeni → HTTP 409
- Beğeniyi kaldırma
- Yorum ekleme
- Yorumu sadece yazar silebilir (başkası → 403)
- Beğeni/yorum → `post_liked` / `post_commented` bildirimi
- Beğeni ile profil dışı hashtag’ten ilgi alanı öğrenme (ör. `#travel`)
- Yoruma yanıt → `comment_replied` bildirimi

### Gönderi detay — `posts-detail.test.js` (4 test)

- `GET /api/me` oturum kullanıcısı
- `GET /api/posts/:id` gönderi + yorumlar
- `GET /api/users/:id/posts` kullanıcı gönderileri
- `GET /api/messages` konuşma listesi (smoke)

### Feed — `feed.test.js` (4 test) — FR 3.2.7

- Takip edilenlerin gönderileri listelenir
- Kimseyi takip etmiyorsa boş liste
- Cursor tabanlı sayfalama (`page`, `limit`)
- `exclude` ile belirli gönderi id’leri filtrelenir

### Öneriler — `recommendations.test.js` (11 test) — FR 3.2.8

**Birim (yukarıda)**

**Entegrasyon**

- `GET /api/recommendations` başarılı liste
- Kendi gönderileri önerilmez
- `POST /api/recommendations/refresh` + `exclude` → aynı gönderiler tekrar gelmez

### Mesajlaşma — `messages.test.js` (4 test) — FR 3.2.9

- Mesaj gönderme → HTTP 201
- Boş mesaj → HTTP 400
- Olmayan alıcı → HTTP 404
- Konuşma geçmişi kronolojik sırada

### Bildirimler — `notifications.test.js` (4 test) — FR 3.2.10

- Bildirim listesi
- Tek bildirimi okundu işaretleme
- Tümünü okundu işaretleme
- Geçersiz bildirim id → HTTP 404

### Hashtag yardımcısı — `utils.test.js` (4 test)

- Çıkarma ve küçük harf
- Tekilleştirme
- Hashtag yoksa `[]`
- `#3` yok sayılır, `#art` kalır

---

## Özet tablo

| Test dosyası | Test sayısı | Tür |
|--------------|-------------|-----|
| `auth.test.js` | 8 | API |
| `profile.test.js` | 5 | API |
| `follow.test.js` | 6 | API |
| `posts.test.js` | 13 | API |
| `posts-detail.test.js` | 4 | API |
| `feed.test.js` | 4 | API |
| `recommendations.test.js` | 11 | Birim + API |
| `messages.test.js` | 4 | API |
| `notifications.test.js` | 4 | API |
| `utils.test.js` | 4 | Birim |
| **Toplam** | **62** | |

---

## Sunumda nasıl anlatılır?

1. **Araçlar:** “Jest ve Supertest ile otomatik test; her test öncesi test veritabanı sıfırlanıyor.”
2. **Kapsam:** “Kayıt, profil, takip, gönderi, beğeni, yorum, yanıt, feed, öneri, mesaj ve bildirim endpoint’leri test edildi.”
3. **Öneri:** “Skorlama ve %80/%20 karışım birim testte; API’de kendi gönderimin önerilmemesi ve refresh exclude doğrulanıyor.”
4. **Canlı:** Terminalde `npm test` çalıştırıp yeşil sonucu gösterin.

---

## İlgili dosyalar

- Test kodu: `tests/`
- Çalıştırma: `package.json` → `"test": "CI=true NODE_ENV=test jest --runInBand --forceExit"`
- Mimari bağlam: [MIMARI.md](MIMARI.md)
- Sunum checklist: [SUNUM.md](SUNUM.md)
