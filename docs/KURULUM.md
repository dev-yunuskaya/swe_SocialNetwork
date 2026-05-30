# Sıfırdan Kurulum

Bu rehber, projeyi **hiç kurulu olmayan** bir bilgisayarda çalıştırmak içindir (macOS, Linux veya Windows + WSL).

## 1. Gereksinimler

| Yazılım | Minimum | Kontrol |
|---------|---------|---------|
| **Node.js** | 18.x veya üzeri | `node -v` |
| **npm** | Node ile gelir | `npm -v` |
| **Docker** | Docker Desktop veya Docker Engine | `docker -v` |
| **Git** | Projeyi klonlamak için | `git -v` |

> PostgreSQL’i ayrıca kurmanız gerekmez; `docker compose` ile konteynerde çalışır.

## 2. Projeyi alın

```bash
git clone <REPO_URL> swe_project
cd swe_project
```

ZIP ile indirdiyseniz klasörü açıp o dizinde devam edin.

## 3. Ortam değişkenleri

```bash
cp .env.example .env
```

`.env` içeriği (varsayılan genelde yeterlidir):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/social_network"
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/social_network_test"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="24h"
PORT=3000
UPLOAD_DIR="./uploads"
```

`docker-compose.yml` ile kullanıcı/şifre/veritabanı adı uyumludur (`user` / `password` / `social_network`).

## 4. Veritabanını başlatın

```bash
docker compose up -d
```

İlk seferde PostgreSQL imajı iner; birkaç dakika sürebilir.

Kontrol:

```bash
docker compose ps
```

`postgres` servisi **running** olmalı.

## 5. Bağımlılıklar ve veritabanı şeması

```bash
npm install
npm run db:migrate
```

`db:migrate` migration’ları uygular ve Prisma istemcisini üretir.

## 6. Demo verisi (sunum için önerilir)

```bash
npm run demo:seed
```

- 200 gönderi ve görseller oluşturur; **internet** gerekir (görseller indirilir).
- 5–15 dakika sürebilir; terminal çıktısını takip edin.

Sadece boş sistem + ilgi alanları için:

```bash
npm run db:seed
```

## 7. Uygulamayı çalıştırın

```bash
npm start
```

Tarayıcı: **http://localhost:3000/login.html**

| Hesap | Şifre |
|--------|--------|
| test.ayse@demo.com | password123 |
| test.can@demo.com | password123 |

## 8. Testleri çalıştırma (isteğe bağlı)

```bash
npm test
```

Test veritabanı (`social_network_test`) ilk çalıştırmada otomatik oluşturulur.

## İki kullanıcıyla aynı anda deneme

**Yöntem A — iki tarayıcı profili (tek sunucu):**

```bash
npm start
```

- Chrome: Ayşe  
- Firefox veya gizli pencere: Can  

**Yöntem B — iki port:**

```bash
# Terminal 1
npm start

# Terminal 2
npm run start:3001
```

- http://localhost:3000 → Ayşe  
- http://localhost:3001 → Can  

## Sık karşılaşılan sorunlar

| Sorun | Çözüm |
|--------|--------|
| `ECONNREFUSED` veritabanı | `docker compose up -d` çalışıyor mu? |
| Port 3000 dolu | `.env` içinde `PORT=3001` veya diğer süreci kapatın |
| `prisma` / `parent_id` hatası | `npm run db:migrate` tekrar çalıştırın |
| Demo seed yavaş / hata | İnternet bağlantısı; tekrar `npm run demo:seed` |
| Giriş olmuyor | Önce `npm run demo:seed` yaptığınızdan emin olun |

## Tek komutla kısmi kurulum

Docker zaten ayaktaysa:

```bash
npm install && npm run db:migrate && npm run demo:seed && npm start
```

## Durdurma

```bash
# Ctrl+C ile sunucuyu durdurun
docker compose down        # veritabanını durdur
docker compose down -v       # verileri de sil (sıfırdan DB)
```
