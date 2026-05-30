# Social Network — CSE3044 Dönem Projesi

Node.js / Express REST API, PostgreSQL + Prisma, düz HTML/CSS frontend.

## Dokümantasyon

| Dosya | İçerik |
|--------|--------|
| [docs/OZET.md](docs/OZET.md) | Proje kısaca ne yapıyor? |
| [docs/KURULUM.md](docs/KURULUM.md) | Sıfırdan kurulum (yeni bilgisayar) |
| [docs/MIMARI.md](docs/MIMARI.md) | Kod yapısı, akışlar, öneri mantığı |
| [docs/SUNUM.md](docs/SUNUM.md) | Sunum için yapılacaklar (sıralı) |
| [docs/API.md](docs/API.md) | REST endpoint listesi |
| [docs/TESTLER.md](docs/TESTLER.md) | Otomatik testler (62 test, neyi doğrular) |
| [docs/TESLIM-KONTROL.md](docs/TESLIM-KONTROL.md) | Teslim kontrol listesi |

## Hızlı başlangıç

```bash
docker compose up -d
cp .env.example .env   # ilk kurulumda
npm install
npm run db:migrate
npm run demo:seed
npm start
```

Tarayıcı: http://localhost:3000/login.html

**Demo:** `test.ayse@demo.com` / `test.can@demo.com` — şifre: `password123`

## Komutlar

| Komut | Açıklama |
|--------|----------|
| `npm start` | Sunucu (port 3000) |
| `npm run start:3001` | İkinci oturum testi (port 3001) |
| `npm test` | 62 otomatik test (Jest + Supertest) |
| `npm run demo:seed` | Demo verisi (200 gönderi, 2 giriş hesabı) |
| `npm run setup` | Docker + migrate + temel ilgi alanları |

## Proje yapısı

```
src/           Express routes, services, middleware
prisma/        Veritabanı şeması ve migration
public/        HTML/CSS/JS arayüz
scripts/       Demo seed scriptleri
tests/         Jest + Supertest
docs/          Dokümantasyon
```
