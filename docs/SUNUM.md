# Sunum Rehberi

Sunum günü ve öncesi yapılacaklar **sırayla** aşağıdadır. Her adımı tamamladıkça işaretleyin.

---

## A. Sunumdan önce (1–2 gün önce)

### 1. Ortamı doğrula

- [ ] Node 18+, Docker kurulu (`node -v`, `docker -v`)
- [ ] Projeyi sunum bilgisayarına kopyala veya USB / Git ile al
- [ ] [KURULUM.md](KURULUM.md) adımlarını **sıfırdan** bir kez uygula

### 2. Veritabanı ve demo

```bash
docker compose up -d
npm install
npm run db:migrate
npm run demo:seed
```

- [ ] `demo:seed` hatasız bitti (internet açıkken)
- [ ] `npm start` → http://localhost:3000/login.html açılıyor
- [ ] Ayşe ve Can ile giriş yapılabiliyor

### 3. Testler

```bash
npm test
```

- [ ] Tüm testler geçti (**62 test** — neyin test edildiği: [TESTLER.md](TESTLER.md))
- [ ] Sunumda kısa anlatım: auth, post, feed, öneri birim+API, mesaj, bildirim

### 4. Dokümanlar hazır

- [ ] RSD ve DSD dosyaları (dersin istediği formatta) yanınızda veya slaytta özet
- [ ] [OZET.md](OZET.md) — “proje ne yapıyor” için 1 dakikalık anlatım
- [ ] [MIMARI.md](MIMARI.md) — “nasıl yapıldı” için teknik slayt notu
- [ ] Postman koleksiyonu: `docs/postman_collection.json` (isteğe bağlı canlı API gösterimi)

### 5. Slayt / anlatım planı (önerilen sıra)

1. Problem ve kapsam (sosyal ağ, CSE3044 gereksinimleri)
2. Mimari diyagram: tarayıcı → Express → PostgreSQL
3. Veri modeli (kullanıcı, gönderi, takip, öneri)
4. **Canlı demo** (B bölümündeki senaryo)
5. Öneri algoritması: ilgi alanı + keşif + beğeniyle öğrenme
6. Güvenlik: JWT, bcrypt, dosya yükleme sınırları
7. Testler: 62 otomatik test (`npm test`) — [TESTLER.md](TESTLER.md)
8. Kısıtlar ve gelecek iş (WebSocket, ML öneri yok vb.)

- [ ] Slaytlar hazır
- [ ] Süre provası (genelde 10–15 dk + soru)

---

## B. Sunum günü (oturum açmadan önce, ~30 dk)

### 6. Son kontrol listesi

```bash
docker compose up -d
npm start
```

- [ ] Docker çalışıyor
- [ ] Port 3000 boş
- [ ] Tarayıcıda önbellek: gerekirse gizli pencere kullan
- [ ] İkinci hesap için Firefox / gizli pencere veya `npm run start:3001` hazır

### 7. Yedek plan

- [ ] İnternet kesilirse: demo seed zaten yapılmış olmalı (görseller local)
- [ ] Docker açılmazsa: yedek video veya ekran görüntüleri
- [ ] API gösterimi için Postman açık

---

## C. Canlı demo senaryosu (sırayla, ~5–7 dk)

Sunumda ekranda **bu sırayı** izleyin:

| # | Ne yapıyorsunuz | Ne gösteriyorsunuz |
|---|-----------------|-------------------|
| 1 | `test.ayse@demo.com` ile giriş | JWT tabanlı giriş, ana sayfa |
| 2 | **Takip Ettikleriniz** sekmesi | Can’ın gönderileri (karşılıklı takip) |
| 3 | Yeni gönderi: `#technology` metin | Hashtag, isteğe bağlı resim |
| 4 | **Önerilenler** sekmesi | Farklı kategorilerden karışık içerik |
| 5 | Bir öneriye **beğeni** veya **yorum** | Etkileşim |
| 6 | **Yenile** (öneriler) | Liste güncellenir; ilgi alanına göre yoğunluk |
| 7 | İkinci tarayıcı: `test.can@demo.com` | İki kullanıcı |
| 8 | Can, Ayşe’nin yorumuna **Yanıtla** (`post.html` detay) | `comment_replied` bildirimi |
| 9 | Ayşe → **Bildirimler** | Bildirim listesi |
| 10 | **Mesajlar** — kısa mesaj gönder/al | REST mesajlaşma |
| 11 | **Profil** — ilgi alanı güncelle | Profil API |
| 12 | (İsteğe bağlı) **Kayıt** yeni kullanıcı | Kayıt + ilgi alanı seçimi |

- [ ] Demo senaryosu en az bir kez prova edildi

---

## D. Jüri / hoca sorularına hazırlık

Aşağıdakileri kısa cevaplayabilecek şekilde hazırlanın:

- [ ] Neden ML kullanmadınız? → Kural tabanlı, şeffaf, ders kapsamı
- [ ] Öneri nasıl çalışıyor? → [MIMARI.md](MIMARI.md) öneri bölümü
- [ ] Güvenlik? → JWT, şifre hash, sadece yazar silme, dosya tipi kontrolü
- [ ] Test stratejisi? → [TESTLER.md](TESTLER.md): Jest + Supertest, test DB, 62 senaryo
- [ ] Ölçeklenebilirlik sınırı? → Tek sunucu, local upload, WebSocket yok

---

## E. Sunum sonrası (teslim)

- [ ] Kaynak kod + README linkleri (`README.md` → docs)
- [ ] RSD / DSD teslim formatına uygun yükleme
- [ ] [TESLIM-KONTROL.md](TESLIM-KONTROL.md) maddelerinin tamamı

---

## Hızlı komut özeti (sunum günü)

```bash
docker compose up -d
npm start
# Demo hesaplar: test.ayse@demo.com / test.can@demo.com — password123
```

İki oturum:

```bash
npm run start:3001   # ikinci terminal
```

---

## İlgili dosyalar

| Konu | Dosya |
|------|--------|
| Kurulum | [KURULUM.md](KURULUM.md) |
| Proje özeti | [OZET.md](OZET.md) |
| Teknik anlatım | [MIMARI.md](MIMARI.md) |
| API | [API.md](API.md) |
