# Proje Özeti

## Bu proje nedir?

**Social Network**, CSE3044 dönem projesi kapsamında geliştirilmiş, küçük ölçekli bir **sosyal ağ uygulamasıdır**. Kullanıcılar kayıt olur, birbirini takip eder, metin ve isteğe bağlı resimli gönderi paylaşır, beğenir, yorumlar, mesajlaşır ve kişiselleştirilmiş içerik önerileri görür.

Teknik olarak **monolit bir web uygulaması**: aynı sunucu hem REST API’yi hem statik HTML sayfalarını sunar.

## Ne yapıyor? (Kullanıcı gözüyle)

| Özellik | Açıklama |
|---------|----------|
| **Kayıt / giriş** | E-posta, kullanıcı adı, şifre; kayıtta en az bir ilgi alanı seçimi |
| **Profil** | Görüntüleme, bio ve ilgi alanlarını güncelleme |
| **Takip** | Başka kullanıcıları takip etme / bırakma |
| **Gönderi** | Metin (max 500 karakter), opsiyonel JPEG/PNG; içerikten `#hashtag` çıkarımı |
| **Etkileşim** | Beğeni, yorum, yoruma yanıt |
| **Takip akışı** | Takip edilenlerin gönderileri, yeniden eskiye |
| **Öneriler** | Takip etmediğiniz kullanıcılardan kural tabanlı öneri; ilgi alanları ağırlıklı, az da olsa diğer konulardan keşif |
| **Öğrenme** | Beğeni veya yorum yapınca gönderinin kategorisi profil ilgi alanlarına eklenebilir |
| **Mesajlaşma** | İki kullanıcı arasında REST ile doğrudan mesaj |
| **Bildirimler** | Takip, beğeni, yorum, yorum yanıtı |

## Ne yapmıyor?

- Gerçek zamanlı WebSocket sohbeti yok (mesajlar istek/yanıt ile).
- React/Vue gibi SPA framework yok; düz HTML + vanilla JS.
- Makine öğrenmesi ile öneri yok; skorlar ve kurallar kod içinde.
- Bulut depolama yok; resimler `uploads/` klasöründe tutulur.

## Demo verisi

`npm run demo:seed` komutu:

- **2 giriş hesabı:** Ayşe ve Can (karşılıklı takip).
- **8 içerik üretici** (`pool_*`): teknoloji, spor, müzik, sanat, bilim, seyahat, yemek, oyun.
- **200 anlamlı gönderi** (~yarısı görselli).

Sunumda çoğu senaryo bu hesaplarla gösterilir; yeni kullanıcı kaydı da canlı yapılabilir.

## İlgili dokümanlar

- Kurulum: [KURULUM.md](KURULUM.md)
- Teknik detay: [MIMARI.md](MIMARI.md)
- Sunum adımları: [SUNUM.md](SUNUM.md)
