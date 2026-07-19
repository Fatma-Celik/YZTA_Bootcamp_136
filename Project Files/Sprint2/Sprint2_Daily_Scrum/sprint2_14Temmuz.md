# Sprint 2 — 1. Toplantı Notu

**Tarih:** 14 Temmuz 2026

## Gündem

- Giriş ekranı ve Google ile giriş yetkilendirmelerinin planlanması
- Ülkeye özgü yemek öneri sistemi ve MealDB entegrasyonunun görüşülmesi
- Buzdolabı dijital ikizi geliştirme sürecinin başlatılması
- Yapay zeka (AI) destekli israf önleme ve son tüketim tarihi özelliklerinin detaylandırılması
- Veritabanı mock veri çalışmaları ve GitHub entegrasyonu

## Görüşülen Konular

### Kullanıcı Girişi ve Yetkilendirme

Uygulamanın giriş ekranının yapılandırılması üzerine konuşuldu. Kullanıcı deneyimini hızlandırmak adına Google ile giriş yapabilme (Google Login) ve gerekli yetkilendirme adımlarının projeye dahil edilmesi tartışıldı.

### Yemek Öneri Sistemi ve API Entegrasyonu

Kullanıcıların seçtiği ülkeye özgü yemek önerilerinin sağlanması fikri değerlendirildi. Özellikle Türk mutfağında çok daha kapsamlı ve yerel öneriler sunulması konuşuldu.

Kullanıcının yabancı ülke mutfaklarını seçmesi durumunda, `mealdb` API'si üzerinden veri çekilerek ekrana yansıtılması ve bu süreçler için gerekirse mock data (test verisi) oluşturulması üzerine fikir alışverişi yapıldı.

### Buzdolabı Dijital İkizi ve İsraf Önleme (Yapay Zeka)

Bir önceki toplantıda kararlaştırılan "buzdolabının dijital ikizi" yapısının fiilen oluşturulmaya başlanması ele alındı.

Gıda israfını azaltmak amacıyla yenilikçi çözümler tartışıldı. İki görsel arasındaki farkı inceleyerek olası gıda israfının önüne geçilmesi veya manuel son tüketim tarihi girme modülünün entegrasyonu konuşuldu.

Dijital ikiz arayüzünde, kullanıcının mevcut ürünleri görebilmesi ve yapay zeka (AI) analizi ile bozulmak üzere olan gıdaların sistem tarafından otomatik olarak işaretlenmesi detaylandırıldı.

### Altyapı ve Veritabanı

Geliştirme süreçlerini hızlandırmak için veritabanı mock verilerinin oluşturulması ve ayarlanması konusu görüşüldü.

Projenin Frontend (ön yüz) kısmının sürüm kontrolü ve ekip çalışması için GitHub'a entegre edilmesi gerektiği vurgulandı.

## Alınan Kararlar

- Giriş ekranına Google ile giriş seçeneğinin eklenmesine ve yetkilendirme altyapısının kurulmasına karar verildi
- Yemek önerileri için yerel verilerle birlikte yabancı mutfaklar adına MealDB entegrasyonunun kullanılmasına onay verildi
- Dijital ikiz yapısının sadece ürün listelemekle kalmayıp, görsel fark analizi, son tüketim tarihi takibi ve yapay zeka destekli bozulma uyarısı gibi akıllı özelliklerle donatılmasına karar verildi

## Sonraki Toplantıya Kadar Yapılacaklar

- [ ] Giriş ekranının tasarlanması/yapılandırılması ve Google Login yetkilendirmesinin projeye eklenmesi
- [ ] Yemek öneri sistemi için veritabanı mock verilerinin hazırlanması ve MealDB veri çekme işlemlerinin test edilmesi
- [ ] Frontend kısmının GitHub'a entegrasyonunun sağlanması
- [ ] Buzdolabı dijital ikizi modülünün kodlanmaya başlanması ve yapay zeka (AI) israf önleme mantığının ön çalışmalarının yapılması
