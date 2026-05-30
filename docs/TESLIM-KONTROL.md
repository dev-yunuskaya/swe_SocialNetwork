# Teslim Kontrol Listesi — CSE3044

## Dokümantasyon

- [ ] RSD (Software Requirements Specification)
- [ ] DSD (Design Specification Document)
- [ ] Kaynak kod + README
- [ ] Postman koleksiyonu (`docs/postman_collection.json`)

## Teknik gereksinimler

- [ ] Node.js + Express.js backend
- [ ] PostgreSQL + Prisma ORM + migration
- [ ] JWT authentication + bcrypt şifre
- [ ] Plain HTML/CSS frontend (JS framework yok)
- [ ] Resimler yerel `uploads/` dizininde
- [ ] REST mesajlaşma (WebSocket yok)
- [ ] Kural tabanlı öneri (ML yok)

## Fonksiyonel demo senaryosu

1. [ ] Yeni kullanıcı kaydı + ilgi alanı
2. [ ] Giriş ve feed görüntüleme
3. [ ] Gönderi paylaşma (#hashtag ile)
4. [ ] Başka kullanıcıyı takip etme
5. [ ] Beğeni / yorum ve bildirim
6. [ ] Önerilen gönderiler bölümü
7. [ ] Doğrudan mesaj gönderme / okuma
8. [ ] Profil güncelleme

## Test

```bash
npm test
```

Beklenen: 62 test, hepsi gecer. Detay: [TESTLER.md](TESTLER.md)

## Sunum öncesi

Ayrıntılı sıralı liste: **[SUNUM.md](SUNUM.md)**

```bash
docker compose up -d
npm run db:migrate
npm run demo:seed
npm start
```

Demo giris: `test.ayse@demo.com` veya `test.can@demo.com` / `password123` (`npm run demo:seed`)
