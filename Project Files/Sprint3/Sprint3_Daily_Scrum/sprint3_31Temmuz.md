# Sprint 3 — 2. Toplantı Notu

**Tarih:** 31 Temmuz 2026

---

## Gündem
* Eksik malzeme/alışveriş listesi için mock data (test verisi) oluşturulması
* Alerjen verilerinin Supabase veritabanına bağlanması
* Makro hesaplamalarının kullanıcı profiline (sayaçlara) entegrasyonu

---

## Görüşülen Konular

### Veritabanı ve Test Süreçleri
* Uygulama içindeki eksik listesi bölümünün arayüzde test edilebilmesi ve geliştirmenin devam edebilmesi için gerekli olan mock dataların oluşturulması gerektiği belirtildi.
* Kullanıcı profilinde yer alan alerjenlerin, statik bir yapıdan çıkarılıp doğrudan Supabase veritabanına bağlanarak dinamik bir yapıya kavuşturulması konuşuldu.

### Kullanıcı Deneyimi ve Fonksiyonellik
* Makro hesabı yapılan bir öğünün kullanıcı tarafından tüketilmiş (yemişiz) gibi varsayılarak, profil sayfasındaki günlük/haftalık hedeflere ve sayaçlara doğrudan etki etmesi üzerine fikir alışverişi yapıldı. Bu sayede kullanıcının makro ve kalori takibini anlık olarak kendi profilinde görebilmesi hedefleniyor.

---

## Alınan Kararlar
* Eksik listesi için mock dataların oluşturulup sisteme dahil edilmesine karar verildi.
* Alerjenlerin backend (Supabase) entegrasyonunun yapılmasına onay verildi.
* Makro sayaçlarının aktif bir şekilde profil sayfasına entegre edilmesi mantığı kabul edildi.

---

## Sonraki Toplantıya Kadar Yapılacaklar
- [ ] Eksik listesi için mock datanın hazırlanması ve arayüze entegre edilmesi.
- [ ] Alerjen verilerinin Supabase veritabanına bağlantısının kurulması ve test edilmesi.
- [ ] Makro hesabı tamamlanan öğünlerin, kullanıcı profilindeki sayaçlara (kalori ve makro hedefleri vb.) doğrudan etki etmesini sağlayacak altyapının (fonksiyonların) kodlanması.